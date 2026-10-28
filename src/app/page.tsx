'use client';
import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import MarkdownText from '@/components/MarkdownText';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ApplicationTerminalShell() {
  const { data: session, status } = useSession();
  const [query, setQuery] = useState('');
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentActiveRoute, setCurrentActiveRoute] = useState('web4/index?-Idle');

  const fetchDbLogs = async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/history');
      if (res.ok) setHistoryLogs(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (session) fetchDbLogs(); }, [session]);

  if (status === 'loading') {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center font-mono text-xs text-zinc-500">SYSTEM LOADING...</div>;
  }

  // 🚪 UNAUTHENTICATED GUEST VIEW: Splash Lock Screen
  if (!session) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 font-mono">
        <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-6 shadow-2xl">
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white tracking-tight">GWS-Wiz Gateway Engine</h1>
            <p className="text-zinc-500 text-xs">Secure real-time web parsing layer node configuration index.</p>
          </div>
          <button
            onClick={() => signIn('github')}
            className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold rounded-xl text-sm transition flex items-center justify-center space-x-2 shadow-sm"
          >
            <span>Authenticate via GitHub Profile</span>
          </button>
        </div>
      </main>
    );
  }

  // 🖥️ AUTHENTICATED USER VIEW: Main Terminal Search Engine Dashboard
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

      if (!response.ok || !response.body) throw new Error('Failed connection.');

      const routingHeader = response.headers.get('X-Routing-Params') || 'web4/index?-Dynamic';
      setCurrentActiveRoute(`web4/index?-%25%3D${routingHeader}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      setChatLog((prev) => [...prev, { role: 'assistant', content: '' }]);

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
      fetchDbLogs();
    } catch (err) {
      console.error(err);
    } {
      setIsStreaming(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col md:flex-row">
      <div className="w-full md:w-80 bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-800 p-4 space-y-4 flex flex-col justify-between">
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono">Index Log Streams</h2>
            <span className="text-[10px] text-zinc-500 truncate max-w-[120px] font-mono">{session.user.name}</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs font-mono">
            {historyLogs.map((log) => (
              <div key={log.id} className="p-2.5 bg-zinc-950 rounded border border-zinc-800 space-y-1">
                <div className="text-blue-400 truncate">Q: {log.query}</div>
                <div className="text-zinc-500 text-[10px] truncate select-all">{log.routingParams}</div>
              </div>
            ))}
          </div>
        </div>
        <button 
          onClick={() => signOut()} 
          className="w-full py-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-400 transition"
        >
          Terminate Session
        </button>
      </div>

      <div className="flex-1 flex flex-col h-[calc(100vh-220px)] md:h-screen">
        <div className="p-3 bg-zinc-900 border-b border-zinc-800 font-mono text-xs text-zinc-400 flex items-center space-x-2 truncate">
          <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          <span className="font-bold text-zinc-300">ACTIVE_ROUTE:</span>
          <span className="text-zinc-500 select-all">{currentActiveRoute}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {chatLog.map((msg, index) => (
            <div key={index} className={`max-w-3xl mx-auto flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-3 rounded-2xl max-w-[85%] ${
                msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none text-sm' : 'bg-zinc-900 rounded-bl-none border border-zinc-800'
              }`}>
                {msg.role === 'user' ? msg.content : <MarkdownText text={msg.content} />}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-zinc-900/60 border-t border-zinc-800">
          <form onSubmit={runDeepSearch} className="max-w-3xl mx-auto flex items-center space-x-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything (e.g., 'Latest framework releases or trending technology insights')..."
              className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:border-blue-600 text-sm"
              disabled={isStreaming}
            />
            <button
              type="submit"
              disabled={isStreaming || !query.trim()}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-30"
            >
              Search
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
// Add these configuration track states to the top of your react component:
const [activeFileBase64, setActiveFileBase64] = useState<string | null>(null);
const [activeFileMime, setActiveFileMime] = useState<string | null>(null);

// Inject tracking attachment values into your standard fetch submission loop:
const response = await fetch('/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    query: userMessage, 
    history: chatLog,
    imageBase64: activeFileBase64,
    mimeType: activeFileMime
  }),
});

// Clear document buffers inside your terminal form code setup:
setActiveFileBase64(null);
setActiveFileMime(null);
