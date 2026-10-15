export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-2 border-vena-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-charcoal-muted">Loading...</p>
      </div>
    </div>
  );
}