/**
 * Loading Skeleton Component
 * Max 50 lines per NASA standard
 */

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 bg-base-300 rounded w-48 mb-2"></div>
          <div className="h-4 bg-base-300 rounded w-32"></div>
        </div>
        <div className="h-12 bg-base-300 rounded w-48"></div>
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="h-6 bg-base-300 rounded w-32 mb-4"></div>
              <div className="h-10 bg-base-300 rounded w-40"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="h-6 bg-base-300 rounded w-48 mb-4"></div>
          <div className="h-64 bg-base-300 rounded"></div>
        </div>
      </div>

      {/* Monthly overview skeleton */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="h-6 bg-base-300 rounded w-48 mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-base-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
