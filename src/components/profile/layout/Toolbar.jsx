import { Search, X } from 'lucide-react';

// Profile search and shortcut to the separate Issues page.
export default function Toolbar({ q, onQueryChange, issuesCount, onOpenIssues }) {
  return (
    <div className="tools">
      <label className="search">
        <Search size={18} />
        <input value={q} onChange={(e) => onQueryChange(e.target.value)} placeholder="Search your skills, experience, projects and more" aria-label="Search profile" />
        <button onClick={() => onQueryChange('')} aria-label="Clear search"><X size={16} /></button>
      </label>
      <div className="seg">
        <button className="on" onClick={onOpenIssues}>Review issues ({issuesCount})</button>
      </div>
    </div>
  );
}
