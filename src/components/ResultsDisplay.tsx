interface SearchData {
  routingParams: string;
  summary: string;
  keyTakeaways: string[];
}

export default function ResultsDisplay({ data }: { data: SearchData }) {
  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 p-6 shadow-sm space-y-6">
      {/* Simulation Routing Element Block */}
      <div className="flex items-center space-x-2 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 p-3 rounded-lg overflow-x-auto whitespace-nowrap">
        <span className="text-emerald-500 font-bold">SYS_ROUTE:</span>
        <span>web4/index?-%25%3D{data.routingParams}</span>
      </div>

      {/* Main Core Summary */}
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Core Summary</h3>
        <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">{data.summary}</p>
      </div>

      {/* Scannable Bullet Highlights */}
      <div>
        <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-3">Key Takeaways</h4>
        <ul className="space-y-2 pl-5 list-disc text-zinc-700 dark:text-zinc-300">
          {data.keyTakeaways.map((item, index) => (
            <li key={index} className="font-medium text-sm">{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
