export default function Loading() {
  return (
    <div className="page-shell" aria-label="Loading ClearCall">
      <span className="sr-only" role="status">Loading page.</span>
      <div className="loading-skeleton" style={{ width: "38%", height: 22, marginBottom: 12 }} aria-hidden="true" />
      <div className="loading-skeleton" style={{ width: "72%", height: 48, marginBottom: 28 }} aria-hidden="true" />
      <div className="loading-skeleton" style={{ minHeight: 520 }} aria-hidden="true" />
    </div>
  );
}
