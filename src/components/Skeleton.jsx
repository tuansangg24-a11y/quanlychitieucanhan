export default function Skeleton({ label = "Đang tải nội dung…", rows = 4 }) {
  return (
    <div role="status" aria-label={label} aria-busy="true">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton" aria-hidden="true" />
      ))}
    </div>
  );
}
