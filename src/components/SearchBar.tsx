'use client';
import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) onSearch(input);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto my-6">
      <div className="relative flex items-center border border-gray-300 dark:border-gray-700 rounded-full bg-white dark:bg-zinc-900 shadow-sm focus-within:shadow-md transition">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything or simulate internal routing query..."
          className="w-full px-6 py-4 bg-transparent rounded-full focus:outline-none text-zinc-900 dark:text-zinc-100"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="absolute right-3 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Search'}
        </button>
      </div>
    </form>
  );
}
