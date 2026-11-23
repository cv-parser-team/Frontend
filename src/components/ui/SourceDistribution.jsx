const sourceData = [
  {
    label: "LinkedIn",
    value: 42,
    color: "#5146F5",
  },
  {
    label: "Resume_2026",
    value: 38,
    color: "#8186FF",
  },
  {
    label: "Resume_2024",
    value: 14,
    color: "#C5D0FF",
  },
  {
    label: "Scan",
    value: 6,
    color: "#E3E6EB",
  },
];

export default function SourceDistribution() {
  return (
    <section className="panel distribution-card">

      <h2>Where your profile comes from</h2>

      {/* Distribution Bar */}

      <div className="distribution-bar">

        {sourceData.map((item) => (
          <div
            key={item.label}
            style={{
              width: `${item.value}%`,
              backgroundColor: item.color,
            }}
            title={`${item.label}: ${item.value}%`}
          />
        ))}

      </div>

      {/* Legend */}

      <div className="distribution-legend">

        {sourceData.map((item) => (
          <div
            className="legend-item"
            key={item.label}
          >
            <span
              className="legend-dot"
              style={{
                backgroundColor: item.color,
              }}
            />

            <span>{item.label}</span>

            <strong>{item.value}%</strong>
          </div>
        ))}

      </div>

    </section>
  );
}