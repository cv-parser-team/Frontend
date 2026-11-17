import { useMemo } from "react";

import {
  File,
  Image as ImageIcon,
  Globe,
  Search,
  Trash2,
} from "lucide-react";

import Badge from "./Badge";

function SourceIcon({ type }) {
  if (type === "Image") {
    return <ImageIcon size={15} />;
  }

  if (type === "LinkedIn URL") {
    return <Globe size={15} />;
  }

  return <File size={15} />;
}

export default function SourcesTable({
  sources,
  search,
  setSearch,
  type,
  setType,
  status,
  setStatus,
  issue,
  setIssue,
  sort,
  setSort,
  onView,
  onDelete,
}) {
  const filteredSources = useMemo(() => {
    let result = sources.filter((source) =>
      source.name.toLowerCase().includes(search.toLowerCase())
    );

    if (type !== "All") {
      result = result.filter(
        (source) => source.type === type
      );
    }

    if (status !== "All") {
      result = result.filter(
        (source) => source.status === status
      );
    }

    if (issue === "Issues") {
      result = result.filter(
        (source) => source.issueType !== "none"
      );
    }

    if (issue === "No issues") {
      result = result.filter(
        (source) => source.issueType === "none"
      );
    }

    return [...result].sort((a, b) =>
      sort === "Last processed"
        ? b.id - a.id
        : a.id - b.id
    );
  }, [sources, search, type, status, issue, sort]);

  return (
    <section className="panel sources-panel">

      {/* Header */}

      <div className="section-header">

        <h2>All sources</h2>

        <button
          className="add-source-button"
          onClick={() =>
            document.getElementById("source-upload").click()
          }
        >
          Add more sources <span>→</span>
        </button>

      </div>

      {/* Filters */}

      <div className="filters">

        <div className="source-search">
          <Search size={15} />

          <input
            type="text"
            placeholder="Search sources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="All">Type: All</option>
          <option value="PDF">PDF</option>
          <option value="DOCX">DOCX</option>
          <option value="Image">Image</option>
          <option value="LinkedIn URL">LinkedIn URL</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="All">Status: All</option>
          <option value="Processed">Processed</option>
          <option value="Partial">Partial</option>
          <option value="Failed">Failed</option>
        </select>

        <select
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
        >
          <option value="Any">Issues: Any</option>
          <option value="Issues">Issues found</option>
          <option value="No issues">No issues</option>
        </select>

        <div className="filter-spacer" />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="Last processed">
            Sort: Last processed
          </option>
          <option value="Oldest first">
            Sort: Oldest first
          </option>
        </select>

      </div>

      {/* Table */}

      <div className="table-scroll">

        <table className="sources-table">

          <thead>
            <tr>
              <th>Source Name</th>
              <th>Source Type</th>
              <th>Date Added</th>
              <th>Last Processed</th>
              <th>Processing Status</th>
              <th>Extracted Fields</th>
              <th>Issues Found</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {filteredSources.map((source) => (
              <tr key={source.id}>

                <td className="source-name">
                  <SourceIcon type={source.type} />
                  <strong>{source.name}</strong>
                </td>

                <td>{source.type}</td>

                <td>{source.added}</td>

                <td>{source.processed}</td>

                <td>
                  <Badge tone={source.status.toLowerCase()}>
                    {source.status}
                  </Badge>
                </td>

                <td>{source.fields}</td>

                <td>
                  <Badge tone={source.issueType}>
                    {source.issues}
                  </Badge>
                </td>

                <td className="table-actions">

                  <button
                    className="view-button"
                    onClick={() => onView(source)}
                  >
                    View
                  </button>

                  <button
                    className="delete-button"
                    aria-label={`Delete ${source.name}`}
                    onClick={() => onDelete(source)}
                  >
                    <Trash2 size={14} />
                  </button>

                </td>

              </tr>
            ))}

            {filteredSources.length === 0 && (
              <tr>
                <td colSpan="8" className="empty-state">
                  No sources match your filters.
                </td>
              </tr>
            )}

          </tbody>

        </table>

      </div>

      {/* Footer */}

      <div className="table-footer">

        <span>
          Showing {filteredSources.length} of {sources.length} sources
          · Select multiple to reprocess or compare
        </span>

        <span>
          Actions shown according to your permissions
        </span>

      </div>

    </section>
  );
}