interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export default function LoadingSkeleton({
  className = "",
  lines = 3,
}: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      <div className="h-4 bg-base-300 rounded w-1/4"></div>
      <div className="h-8 bg-base-300 rounded w-1/2"></div>
      <div className="space-y-3">
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={`h-4 bg-base-300 rounded ${
              i === lines - 1 ? "w-4/6" : i === lines - 2 ? "w-5/6" : ""
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
}
