export default function GlobalLoading() {
  return (
    <div
      style={{
        padding: "20px",
        marginTop: "56px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* KPI skeletons */}
      <div style={{ display: "flex", gap: "16px" }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="skeleton"
            style={{ flex: 1, height: "112px", borderRadius: "6px" }}
          />
        ))}
      </div>

      {/* Map + Recent */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "16px" }}>
        <div className="skeleton" style={{ height: "280px", borderRadius: "6px" }} />
        <div className="skeleton" style={{ height: "280px", borderRadius: "6px" }} />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: "280px", borderRadius: "6px" }}
          />
        ))}
      </div>
    </div>
  );
}
