export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-neutral-100">
        <div className="h-8 bg-neutral-100 rounded-lg w-48 animate-pulse" />
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3 border-b border-neutral-50 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-5 bg-neutral-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-5 space-y-3">
          <div className="w-10 h-10 bg-neutral-100 rounded-xl animate-pulse" />
          <div className="h-4 bg-neutral-100 rounded w-3/4 animate-pulse" />
          <div className="h-6 bg-neutral-100 rounded w-1/2 animate-pulse" />
          <div className="h-4 bg-neutral-100 rounded w-1/3 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ rows = 10, cols = 7 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
      <div className="flex border-b border-neutral-100">
        <div className="w-[70px] p-3"><div className="h-4 bg-neutral-100 rounded w-10 animate-pulse" /></div>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex-1 p-3"><div className="h-4 bg-neutral-100 rounded w-16 animate-pulse" /></div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex border-b border-neutral-50 last:border-0">
          <div className="w-[70px] p-2"><div className="h-3 bg-neutral-100 rounded w-8 animate-pulse" /></div>
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="flex-1 p-1.5">
              <div className="h-12 bg-neutral-100 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
