import { GoogleGenAI } from '@google/generative-ai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getVectorQueryContext(query: string): Promise<string> {
  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
    return "Vector service unconfigured.";
  }

  try {
    // 1. Generate local semantic mathematical embeddings for the query text string
    const embeddingModel = ai.getGenerativeModel({ model: 'text-embedding-004' });
    const embeddingResult = await embeddingModel.embedContent(query);
    const vectorCoordinates = embeddingResult.embedding.values;

    // 2. Search Pinecone's vector space database index structure
    const response = await fetch(`https://${process.env.PINECONE_INDEX_NAME}.svc.pinecone.io/query`, {
      method: 'POST',
      headers: {
        'Api-Key': process.env.PINECONE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vector: vectorCoordinates,
        topK: 3,
        includeMetadata: true,
      }),
    });

    const results = await response.json();
    return results.matches
      ?.map((match: any) => `[Internal Documentation Context]: ${match.metadata?.text || ''}`)
      .join('\n') || '';
  } catch (error) {
    console.error('Vector Database Fetch Error:', error);
    return '';
  }
}
