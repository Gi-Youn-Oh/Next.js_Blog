export default function SkeletonLoader() {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
          <h2 className="text-2xl font-bold text-center skeleton skeleton-text">Loading...</h2>
          <div className="space-y-4">
            <div className="skeleton skeleton-button"></div>
            <div className="skeleton skeleton-button"></div>
            <div className="skeleton skeleton-button"></div>
            <div className="skeleton skeleton-button"></div>
          </div>
        </div>
      </div>
    );
  }
  