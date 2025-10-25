export default function LoadingState() {
  return (
    <div className="min-h-screen p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-base-300 rounded w-1/4"></div>
        <div className="h-64 bg-base-300 rounded"></div>
      </div>
    </div>
  );
}
