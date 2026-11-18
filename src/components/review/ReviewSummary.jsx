
import ReviewBadge from "./ReviewBadge";

export default function ReviewSummary({
  summary,
  activeCategory,
  onFilterClick,
}) {
  return (
    <section
      className={`review-summary-card ${summary.color}`}
    >
      <h3>
        {summary.title}

        {summary.count !== undefined && (
          <ReviewBadge tone="yellow">
            {summary.count}
          </ReviewBadge>
        )}
      </h3>

      <div className="summary-filter-buttons">
        {summary.filters.map((filter) => {
          const isActive =
            activeCategory === filter.label;

          return (
            <button
              key={filter.label}
              type="button"
              className={isActive ? "active" : ""}
              onClick={() => onFilterClick(filter.label)}
              aria-pressed={isActive}
            >
              {filter.label} {filter.count}
            </button>
          );
        })}
      </div>
    </section>
  );
}
