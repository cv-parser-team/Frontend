
import {
  Search,
  AlertTriangle,
  Circle,
  Triangle,
} from "lucide-react";

import ReviewBadge from "./ReviewBadge";

function PriorityIndicator({ priority }) {
  if (priority === "High") {
    return (
      <span className="priority high">
        <Triangle size={12} fill="currentColor" />
        High
      </span>
    );
  }

  if (priority === "Medium") {
    return (
      <span className="priority medium">
        <Circle size={11} fill="currentColor" />
        Medium
      </span>
    );
  }

  return (
    <span className="priority low">
      <Triangle size={12} />
      Low
    </span>
  );
}

function StatusBadge({ status }) {
  switch (status) {
    case "Needs decision":
      return (
        <ReviewBadge tone="warning">
          <AlertTriangle size={11} />
          Needs decision
        </ReviewBadge>
      );

    case "In review":
      return (
        <ReviewBadge tone="purple">
          In review
        </ReviewBadge>
      );

    case "Processing issue":
      return (
        <ReviewBadge tone="error">
          Processing issue
        </ReviewBadge>
      );

    case "Resolved":
      return (
        <ReviewBadge tone="success">
          Resolved
        </ReviewBadge>
      );

    case "Dismissed":
      return (
        <ReviewBadge tone="neutral">
          Dismissed
        </ReviewBadge>
      );

    default:
      return (
        <ReviewBadge tone="neutral">
          Needs review
        </ReviewBadge>
      );
  }
}

export default function IssuesTable({
  issues,
  selectedIssueId,
  onSelectIssue,
  search,
  onSearchChange,
  filters,
  onFilterChange,
  showResolved,
  onShowResolvedChange,
  onClearFilters,
}) {
  return (
    <section className="review-issues-panel">
      <div className="issues-heading">
        <h2>
          Issues

          <ReviewBadge tone="yellow">
            {issues.length}
          </ReviewBadge>
        </h2>
      </div>

      {/* Search and filters */}
      <div className="review-filters">
        <div className="review-search">
          <Search size={14} />

          <input
            type="search"
            placeholder="Search issues"
            value={search}
            onChange={(event) =>
              onSearchChange(event.target.value)
            }
            aria-label="Search issues"
          />
        </div>

        <select
          value={filters.type}
          onChange={(event) =>
            onFilterChange("type", event.target.value)
          }
          aria-label="Filter by type"
        >
          <option value="All">Type</option>

          {[
            "Conflict",
            "Low confidence",
            "Missing (required)",
            "Duplicate",
            "Invalid link",
            "Extraction issue",
          ].map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(event) =>
            onFilterChange("status", event.target.value)
          }
          aria-label="Filter by status"
        >
          <option value="All">Status</option>

          {[
            "Needs decision",
            "Needs review",
            "In review",
            "Processing issue",
            "Resolved",
            "Dismissed",
          ].map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={filters.priority}
          onChange={(event) =>
            onFilterChange("priority", event.target.value)
          }
          aria-label="Filter by priority"
        >
          <option value="All">Priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <select
          value={filters.source}
          onChange={(event) =>
            onFilterChange("source", event.target.value)
          }
          aria-label="Filter by source"
        >
          <option value="All">Source</option>
          <option value="Resume_v1.pdf">
            Resume_v1.pdf
          </option>
          <option value="Resume_Photo.jpg">
            Resume_Photo.jpg
          </option>
          <option value="LinkedIn">
            LinkedIn
          </option>
        </select>
      </div>

      <div className="review-filters second-row">
        <label className="show-resolved">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(event) =>
              onShowResolvedChange(event.target.checked)
            }
          />

          Show resolved and dismissed
        </label>

        <button
          type="button"
          className="clear-filters"
          onClick={onClearFilters}
        >
          Clear filters
        </button>
      </div>

      {/* Table */}
      <div className="issues-table-wrapper">
        <table className="issues-table">
          <thead>
            <tr>
              <th>Issue</th>
              <th>Field</th>
              <th>Type</th>
              <th>Source</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {issues.length > 0 ? (
              issues.map((issue) => (
                <tr
                  key={issue.id}
                  className={
                    selectedIssueId === issue.id
                      ? "selected-row"
                      : ""
                  }
                  onClick={() => onSelectIssue(issue.id)}
                >
                  <td>{issue.title}</td>

                  <td>{issue.field}</td>

                  <td>{issue.type}</td>

                  <td>{issue.source}</td>

                  <td>
                    <PriorityIndicator
                      priority={issue.priority}
                    />
                  </td>

                  <td>
                    <StatusBadge status={issue.status} />
                  </td>

                  <td>
                    <button
                      type="button"
                      className={`table-action ${
                        selectedIssueId === issue.id
                          ? "active"
                          : ""
                      }`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectIssue(issue.id);
                      }}
                    >
                      {issue.action}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="empty-table">
                  No issues found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="issues-table-footer">
        Sorted by priority, actions first. Optional empty
        fields never appear here.
      </p>
    </section>
  );
}
