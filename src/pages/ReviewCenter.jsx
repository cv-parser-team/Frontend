
import { useMemo, useState } from "react";
import { Bell, UserCircle } from "lucide-react";




import ReviewSummary from "../components/review/ReviewSummary";
import IssuesTable from "../components/review/IssuesTable";
import ReviewDetailPanel from "../components/review/ReviewDetailPanel";

import {
  reviewIssues as initialIssues,
  reviewSummary,
  initialSelectedIssueId,
} from "../data/reviewCenterData";

import "../css/ReviewCenter.css";

export default function ReviewCenter() {
  const [issues, setIssues] = useState(initialIssues);

  const [selectedIssueId, setSelectedIssueId] = useState(
    initialSelectedIssueId
  );

  const [search, setSearch] = useState("");

  const [activeCategory, setActiveCategory] = useState("All");

  const [showResolved, setShowResolved] = useState(false);

  const [filters, setFilters] = useState({
    type: "All",
    status: "All",
    priority: "All",
    source: "All",
  });

  const [savedIssue, setSavedIssue] = useState(null);

  const selectedIssue = useMemo(
    () =>
      issues.find(
        (issue) => issue.id === selectedIssueId
      ) || null,
    [issues, selectedIssueId]
  );

  // ================================
  // FILTER HANDLING
  // ================================

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        issue.title.toLowerCase().includes(searchText) ||
        issue.field.toLowerCase().includes(searchText) ||
        issue.source.toLowerCase().includes(searchText) ||
        issue.type.toLowerCase().includes(searchText);

      const matchesType =
        filters.type === "All" ||
        issue.type === filters.type;

      const matchesStatus =
        filters.status === "All" ||
        issue.status === filters.status;

      const matchesPriority =
        filters.priority === "All" ||
        issue.priority === filters.priority;

      const matchesSource =
        filters.source === "All" ||
        issue.source.includes(filters.source);

      const matchesCategory =
        activeCategory === "All" ||
        issue.category === activeCategory;

      const matchesResolved =
        showResolved ||
        !["Resolved", "Dismissed"].includes(issue.status);

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesPriority &&
        matchesSource &&
        matchesCategory &&
        matchesResolved
      );
    });
  }, [
    issues,
    search,
    filters,
    activeCategory,
    showResolved,
  ]);

  // ================================
  // FILTER UPDATE
  // ================================

  const handleFilterChange = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleClearFilters = () => {
    setSearch("");

    setFilters({
      type: "All",
      status: "All",
      priority: "All",
      source: "All",
    });

    setActiveCategory("All");
    setShowResolved(false);
  };

  const handleCategoryClick = (category) => {
    setActiveCategory((previous) =>
      previous === category ? "All" : category
    );
  };

  // ================================
  // SAVE DECISION
  // ================================

  const handleSaveDecision = (
    issueId,
    decision,
    value
  ) => {
    const existingIssue = issues.find(
      (issue) => issue.id === issueId
    );

    if (!existingIssue) return;

    // Save original data for Undo
    const previousIssue = { ...existingIssue };

    let newStatus = "Resolved";
    let message = "The decision was saved successfully.";

    switch (decision) {
      case "acceptA":
        message = `Last job end date set to ${value} (Source A). Profile is updating.`;
        break;

      case "acceptB":
        message = `Last job end date set to ${value} (Source B). Profile is updating.`;
        break;

      case "editAccept":
        message = `The corrected value "${value}" was accepted.`;
        break;

      case "confirm":
        message = `The extracted value "${value}" was confirmed.`;
        break;

      case "correct":
        message = `The value was corrected to "${value}".`;
        break;

      case "addInformation":
        message = `The information "${value}" was added to the profile.`;
        break;

      case "merge":
        message = "The duplicate records were merged.";
        break;

      case "keepBoth":
        message = "Both records were kept.";
        break;

      case "fixLink":
        message = `The link was updated to ${value}.`;
        break;

      case "retry":
        newStatus = "In review";
        message = "Document extraction has been queued for retry.";
        break;

      case "dismiss":
        newStatus = "Dismissed";
        message = "The issue was dismissed.";
        break;

      case "unresolved":
        newStatus = "Needs decision";
        message = "The issue was marked as unresolved.";
        break;

      case "saveChanges":
        message = "Changes were saved successfully.";
        break;

      default:
        message = "The decision was saved successfully.";
    }

    const updatedIssue = {
      ...existingIssue,
      currentValue: value ?? existingIssue.currentValue,
      status: newStatus,
    };

    setIssues((previous) =>
      previous.map((issue) =>
        issue.id === issueId
          ? updatedIssue
          : issue
      )
    );

    setSavedIssue({
      id: issueId,
      decision,
      message,
      previousIssue,
    });
  };

  // ================================
  // UNDO DECISION
  // ================================

  const handleUndo = (issueId) => {
    if (!savedIssue || savedIssue.id !== issueId) {
      return;
    }

    setIssues((previous) =>
      previous.map((issue) =>
        issue.id === issueId
          ? savedIssue.previousIssue
          : issue
      )
    );

    setSavedIssue(null);
  };

  // ================================
  // NEXT ISSUE
  // ================================

  const handleNextIssue = () => {
    const unresolvedIssues = issues.filter(
      (issue) =>
        !["Resolved", "Dismissed"].includes(issue.status)
    );

    if (unresolvedIssues.length === 0) {
      setSavedIssue(null);
      return;
    }

    const currentIndex = unresolvedIssues.findIndex(
      (issue) => issue.id === selectedIssueId
    );

    const nextIndex =
      currentIndex === -1 ||
      currentIndex === unresolvedIssues.length - 1
        ? 0
        : currentIndex + 1;

    setSelectedIssueId(
      unresolvedIssues[nextIndex].id
    );

    setSavedIssue(null);
  };

  // ================================
  // RENDER
  // ================================

  return (
    <div className="review-center-layout">

      
     

      <main className="review-center-main">

    
       

        <div className="review-center-content">

          {/* Breadcrumb */}
          <div className="review-breadcrumb">
            
          </div>

          {/* Page Heading */}
          <div className="review-page-heading">
            <div>
              <h1>Review Center</h1>

              <p>
                Review conflicts, missing information,
                and extraction issues.
              </p>
            </div>
 
          </div>

          {/* Summary Cards */}
          <div className="review-summary-grid">
            {reviewSummary.map((summary) => (
              <ReviewSummary
                key={summary.id}
                summary={summary}
                activeCategory={activeCategory}
                onFilterClick={handleCategoryClick}
              />
            ))}
          </div>

          {/* Main Workspace */}
          <div className="review-workspace">

            {/* Issues Table */}
            <IssuesTable
              issues={filteredIssues}
              selectedIssueId={selectedIssueId}
              onSelectIssue={setSelectedIssueId}
              search={search}
              onSearchChange={setSearch}
              filters={filters}
              onFilterChange={handleFilterChange}
              showResolved={showResolved}
              onShowResolvedChange={setShowResolved}
              onClearFilters={handleClearFilters}
            />

            {/* Right Review Panel */}
            <ReviewDetailPanel
              issue={selectedIssue}
              savedIssue={savedIssue}
              onSave={handleSaveDecision}
              onUndo={handleUndo}
              onNext={handleNextIssue}
            />

          </div>
        </div>
      </main>
    </div>
  );
}
