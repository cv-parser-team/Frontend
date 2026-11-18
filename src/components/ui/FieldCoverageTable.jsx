import Badge from "./Badge";

function StatusDot({ status }) {
  return (
    <span
      className={`coverage-dot dot-${status}`}
      aria-label={status}
    />
  );
}

export default function FieldCoverageTable({ rows }) {
  return (
    <section className="panel coverage-panel">

      {/* Header */}

      <div className="section-header coverage-header">

        <h2>Field coverage</h2>

        <span>
          Which source supports each profile field
        </span>

      </div>

      {/* Table */}

      <div className="table-scroll">

       <table className="coverage-table">
  <thead>
    <tr>
      <th>Field</th>
      <th>Profile value</th>
      <th>Resume_2026.pdf</th>
      <th>Resume_2024.docx</th>
      <th>Resume_Scan.jpg</th>
      <th>LinkedIn</th>
    </tr>
  </thead>

  <tbody>
    {rows.map((row) => (
      <tr key={row.field}>
        <td>
          <strong>{row.field}</strong>
        </td>

        <td>
          <Badge tone={row.valueStatus}>
            {row.value}
          </Badge>
        </td>

        {row.sources.map((source, index) => (
          <td key={index} className="coverage-source">
            {source?.value && source.value !== "—" ? (
              <>
                <StatusDot status={source.status} />
                <span>{source.value}</span>
              </>
            ) : (
              <span className="text-muted">—</span>
            )}
          </td>
        ))}
      </tr>
    ))}
  </tbody>
</table>
      </div>

      {/* Legend */}

      <div className="coverage-legend">

        <span>
          <StatusDot status="good" />
          Consistent
        </span>

        <span>
          <StatusDot status="warn" />
          Conflict or low confidence
        </span>

        <span>
          — Not found in this source
        </span>

      </div>

    </section>
  );
}