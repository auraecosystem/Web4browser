'use client';
import { useState, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  routing?: string;
}

export default function DeepSearchEngine() {
  const [query, setQuery] = useState('');
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentActiveRoute, setCurrentActiveRoute] = useState('web4/index?-Idle');

  // Load backend database records
  const fetchDbLogs = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) setHistoryLogs(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchDbLogs(); }, []);

  const runDeepSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isStreaming) return;

    const userMessage = query;
    setQuery('');
    setIsStreaming(true);

    const updatedLog: Message[] = [...chatLog, { role: 'user', content: userMessage }];
    setChatLog(updatedLog);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage, history: chatLog }),
      });

      if (!response.ok || !response.body) throw new Error('Failed execution connection.');

      // Pull calculated backend server header attributes
      const routingHeader = response.headers.get('X-Routing-Params') || 'web4/index?-Dynamic';
      setCurrentActiveRoute(`web4/index?-%25%3D${routingHeader}`);

      // Setup chunk streaming readers
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      setChatLog((prev) => [...prev, { role: 'assistant', content: '', routing: routingHeader }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunkText = decoder.decode(value, { stream: true });
        setChatLog((prev) => {
          const adjusted = [...prev];
          const targetIndex = adjusted.length - 1;
          adjusted[targetIndex].content += chunkText;
          return adjusted;
        });
      }
      
      fetchDbLogs(); // Refresh DB layout list view
    } catch (err) {
      console.error(err);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      {/* 📊 LEFT COLUMN: DB Query Router Logs */}
      <div className="w-full md:w-80 bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-800 p-4 space-y-4 flex flex-col">
        <h2 className="text-sm font-bold uppercase tracking-widest text-emerald-400">Database Index Logs</h2>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs font-mono">
          {historyLogs.length === 0 && <p className="text-zinc-600">No search records stored yet.</p>}
          {historyLogs.map((log) => (
            <div key={log.id} className="p-2.5 bg-zinc-950 rounded border border-zinc-800 space-y-1">
              <div className="text-zinc-500 text-[10px]">{new Date(log.createdAt).toLocaleTimeString()}</div>
              <div className="text-blue-400 truncate">Q: {log.query}</div>
              <div className="text-zinc-400 text-[10px] select-all truncate">ROUTE: {log.routingParams}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 💬 RIGHT COLUMN: Continuous Streaming Agent Interface */}
      <div className="flex-1 flex flex-col h-[calc(100vh-200px)] md:h-screen">
        {/* Active System Header Status Bar */}
        <div className="p-3 bg-zinc-900 border-b border-zinc-800 font-mono text-xs text-zinc-400 flex items-center space-x-2 truncate">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
          <span className="font-bold text-zinc-300">ACTIVE_GWS_STREAM:</span>
          <span className="text-zinc-500 select-all">{currentActiveRoute}</span>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {chatLog.length === 0 && (
            <div className="text-center py-12 max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-semibold text-zinc-300">Live AI Search Active</h3>
              <p className="text-zinc-500 text-sm">Ask a question. The system will scrap live Google data index metrics and maintain full chat context memory loops.</p>
            </div>
          )}

          {chatLog.map((msg, index) => (
            <div key={index} className={`max-w-3xl mx-auto flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[85%] ${
                msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-zinc-900 text-zinc-200 rounded-bl-none border border-zinc-800'
              }`}>
                {msg.content || <span className="animate-pulse">● ● ●</span>}
              </div>
              {msg.routing && (
                <span className="text-[10px] font-mono text-zinc-600 mt-1 pl-1">route token parsed to db</span>
              )}
            </div>
          ))}
        </div>

        {/* Message / Query Entry Terminal bar */}
        <div className="p-4 bg-zinc-900/60 border-t border-zinc-800">
          <form onSubmit={runDeepSearch} className="max-w-3xl mx-auto flex items-center space-x-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Query live internet engines (e.g., 'Current stock of Apple or today's news')..."
              className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:border-blue-600 text-sm"
              disabled={isStreaming}
            />
            <button
              type="submit"
              disabled={isStreaming || !query.trim()}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-30"
            >
              Execute
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
