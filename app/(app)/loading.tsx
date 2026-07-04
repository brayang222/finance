export default function Loading() {
  return (
    <div className="flex flex-col gap-[18px]">
      <div className="skeleton" style={{ height: 150 }} />
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="skeleton" style={{ height: 112 }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 280 }} />
    </div>
  );
}
