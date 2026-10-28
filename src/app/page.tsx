'use client';
import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import ResultsDisplay from '@/components/ResultsDisplay';

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError('');
    setData(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Request processing failed');
      
      setData(json);
    } catch (err: any) {
      setError(err.message || 'An unexpected runtime error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-black px-4 py-12 flex flex-col justify-start items-center">
      <div className="w-full max-w-2xl text-center mb-4">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          Custom <span className="text-blue-600">GWS-Wiz</span> AI Engine
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-sm">
          A fully operational web parsing core engineered from scratch.
        </p>
      </div>

      <SearchBar onSearch={handleSearch} isLoading={loading} />

      {error && (
        <div className="w-full max-w-2xl p-4 my-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/50">
          ❌ {error}
        </div>
      )}

      {data && <ResultsDisplay data={data} />}
    </main>
  );
}
