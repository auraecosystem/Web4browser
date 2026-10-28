import { GoogleGenerativeAI } from '@google/generative-ai';

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function getVectorQueryContext(query: string): Promise<string> {
  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
    return "Vector service unconfigured.";
  }

  try {
    // Generate embeddings for the query text.
    const embeddingModel = ai.getGenerativeModel({ model: 'text-embedding-004' });
    const embeddingResult = await embeddingModel.embedContent(query);
    const vectorCoordinates = embeddingResult.embedding.values;

    // Query the configured Pinecone index.
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
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return '';
    const results = await response.json();
    return results.matches
      ?.map((match: any) => `[Internal Documentation Context]: ${String(match.metadata?.text || '').slice(0, 4000)}`)
      .join('\n') || '';
  } catch (error) {
    console.error('Vector Database Fetch Error:', error);
    return '';
  }
}
