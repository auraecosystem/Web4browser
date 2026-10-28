import { GoogleGenAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function fetchLiveSearchData(query: string): Promise<string> {
  try {
    const res = await fetch('https://serper.dev', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 4 }),
    });
    const data = await res.json();
    return data.organic?.map((item: any) => `[${item.title}](${item.link}): ${item.snippet}`).join('\n') || 'No live results.';
  } catch {
    return 'Web scraping context extraction failed.';
  }
}

export async function POST(request: Request) {
  try {
    // Session Guard Verification Injection
    const session = await auth();
    if (!session || !session.user) {
      return new Response('Unauthorized Access Attempt Blocked', { status: 401 });
    }

    const { query, history } = await request.json();
    if (!query) return new Response('Missing query payload', { status: 400 });

    const randomHash = Math.random().toString(36).substring(2, 10);
    const generatedRouting = `mobile-gws-wiz-serp%26sg_ss%3D*-_${randomHash}`;

    const scrapedText = await fetchLiveSearchData(query);
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const conversationContext = history
      .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const prompt = `
      You are an advanced conversational AI Search Engine with complete Markdown rendering capabilities.
      
      [CHAT HISTORY]
      ${conversationContext}
      
      [LIVE SCRAPED WEB RESULTS FOR CURRENT QUERY]
      ${scrapedText}
      
      Current User Query: "${query}"
      
      Provide a comprehensive solution using clear markdown notation formatting rules:
      - Highlight essential points using bold text (**text**).
      - Build punchy lists using structural markdown bullet blocks ("- item").
      - Retain web links strictly using standard syntax format: [Anchor Source Text](URL). Do not drop target links.
    `;

    const result = await model.generateContentStream(prompt);
    let completeResponseText = '';
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          completeResponseText += text;
          controller.enqueue(encoder.encode(text));
        }
        
        await prisma.searchSession.create({
          data: {
            routingParams: generatedRouting,
            query,
            aiResponse: completeResponseText,
          },
        });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Routing-Params': generatedRouting,
      },
    });
  } catch (err) {
    console.error(err);
    return new Response('Stream Execution Error', { status: 500 });
  }
}
