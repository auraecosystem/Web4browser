import { GoogleGenAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// 🌐 Background Web Scraper Utility
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
    return data.organic?.map((item: any) => `${item.title}: ${item.snippet}`).join('\n') || 'No live results.';
  } catch {
    return 'Web scraping unavailable.';
  }
}

export async function POST(request: Request) {
  try {
    const { query, history } = await request.json();
    if (!query) return new Response('Missing query', { status: 400 });

    // Generate real custom mock internal tracking hashes
    const randomHash = Math.random().toString(36).substring(2, 15);
    const generatedRouting = `mobile-gws-wiz-serp%26sg_ss%3D*-_${randomHash}`;

    // 1. Gather Live Internet Context
    const scrapedText = await fetchLiveSearchData(query);

    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 2. Synthesize Context for conversational multi-turn chat
    const conversationContext = history
      .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const prompt = `
      You are an advanced real-time conversational AI Search Engine.
      
      [CHAT HISTORY]
      ${conversationContext}
      
      [LIVE SCRAPED WEB RESULTS FOR CURRENT QUERY]
      ${scrapedText}
      
      Current User Query: "${query}"
      
      Synthesize the chat history and live scraped results to give a direct, clean answer. Use short, punchy formatting or list elements where applicable. Do not explain your technical backend processes to the user.
    `;

    // 3. Initiate Stream
    const result = await model.generateContentStream(prompt);

    // Create a native readable stream to feed client chunks
    let completeResponseText = '';
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          completeResponseText += text;
          controller.enqueue(encoder.encode(text));
        }
        
        // 4. Log interaction record inside database on stream termination
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
