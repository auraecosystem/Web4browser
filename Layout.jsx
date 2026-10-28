<div className="p-4 bg-zinc-900/60 border-t border-zinc-800 space-y-3">
  <div className="max-w-3xl mx-auto flex items-center justify-between">
    {/* Dynamic File Uploader Integration */}
    <FileUpload onFileLoaded={(base64, mime) => {
      setActiveFileBase64(base64);
      setActiveFileMime(mime);
    }} />
    <span className="text-[10px] text-zinc-500 font-mono">Modes Active: Vector RAG • Web Scraper • Alert Engine</span>
  </div>
  
  <form onSubmit={runDeepSearch} className="max-w-3xl mx-auto flex items-center space-x-3">
    <input
      type="text"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Search query... (Type 'security alert' to test system notifications)"
      className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl focus:outline-none focus:border-blue-600 text-sm text-white"
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
