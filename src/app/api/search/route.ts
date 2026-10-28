import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Initialize the advanced reasoning model
    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Instruct the model to mimic search index architecture and return structured data
    const prompt = `
      You are acting as an advanced internal web search and parsing engine. 
      Analyze the following user input query: "${query}"
      
      Generate a structured JSON response containing:
      1. 'routingParams': Simulation of internal routing keys (like mobile-gws-wiz-serp layouts).
      2. 'summary': A concise, scannable summary paragraph answering the core intent.
      3. 'keyTakeaways': An array of 3 bulleted short fragments.
      
      Respond ONLY with valid, unquoted JSON data. Do not include markdown code block syntax.
    `;

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text().trim();
    
    // Parse response cleanly
    const cleanJson = JSON.parse(textResponse.replace(/```json|```/g, ''));

    return NextResponse.json(cleanJson);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error processing request' }, { status: 500 });
  }
}
