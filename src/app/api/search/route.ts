import { GoogleGenAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { getVectorQueryContext } from '@/lib/pinecone';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// 📡 Automated Webhook Channel Dispatcher Engine
async function dispatchAutomationAlert(user: string, query: string, routing: string) {
  const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
  if (!webhookUrl) return;

  // Real-time keyword filter rule matching criteria configuration
  const matchesAlertRule = /alert|security|vulnerability|critical|downtime/i.test(query);
  if (!matchesAlertRule) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🚨 **CRITICAL SEARCH PARAMETER ALERT**\n**Operator:** ${user}\n**Query Parameter:** \`${query}\`\n**Routing Trace ID:** \`${routing}\`\n*System dispatch routing running via automated core.*`
      })
    });
  } catch (err) { console.error('Alert Dispatch Failure:', err); }
}

async function fetchLiveSearchData(query: string): Promise<string> {
  try {
    const res = await fetch('https://serper.dev', {
      method: 'POST',
      headers: { 'X-API-KEY': process.env.SERPER_API_KEY || '', 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: 3 }),
    });
    const data = await res.json();
    return data.organic?.map((item: any) => `[${item.title}](${item.link}): ${item.snippet}`).join('\n') || '';
  } catch { return ''; }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) return new Response('Unauthorized', { status: 401 });

    const { query, history, imageBase64, mimeType } = await request.json();
    if (!query) return new Response('Missing query', { status: 400 });

    const randomHash = Math.random().toString(36).substring(2, 10);
    const generatedRouting = `mobile-gws-wiz-serp%26sg_ss%3D*-_${randomHash}`;

    // ⚡ Execute Parallel Extraction: Live Internet Index + Pinecone Internal Document Context
    const [scrapedText, internalDocText] = await Promise.all([
      fetchLiveSearchData(query),
      getVectorQueryContext(query)
    ]);

    // Dispatch webhook notifications if critical rules match
    await dispatchAutomationAlert(session.user.name || 'System Operator', query, generatedRouting);

    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const conversationContext = history.map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n');

    const corePrompt = `
      You are an enterprise AI Search Core engineered with Vector RAG context and Multimodal input support.
      
      [CHAT HISTORY CONTEXT LOOP]
      ${conversationContext}
      
      [VECTOR DATABASE DOCUMENT REFERENCE]
      ${internalDocText || 'No relevant company records matched.'}
      
      [LIVE SCRAPED WEB ENGINE INDEX]
      ${scrapedText || 'No public indexes found.'}
      
      Current Request Intent: "${query}"
      Synthesize information directly, maintaining bold text conventions (**text**) and structural lists ("- item") where appropriate.
    `;

    // 🖼️ Construct Payload: Switch processing tracks depending on multimodal attachments
    let modelContentsPayload: any[] = [];
    if (imageBase64 && mimeType) {
      modelContentsPayload = [
        corePrompt,
        { inlineData: { data: imageBase64, mimeType: mimeType } }
      ];
    } else {
      modelContentsPayload = [corePrompt];
    }

    const result = await model.generateContentStream({ contents: [{ role: 'user', parts: modelContentsPayload as any }] });
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
          data: { routingParams: generatedRouting, query, aiResponse: completeResponseText },
        });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Routing-Params': generatedRouting },
    });
  } catch (err) {
    console.error(err);
    return new Response('Stream Execution Error', { status: 500 });
  }
}
