import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import IssuesSection from '../components/profile/sections/IssuesSection';
import ActiveDrawer from '../components/profile/drawers/ActiveDrawer';
import { groupMergeProposals } from '../utils/coalesceUtils';
import { getGroupedProfileIssues } from '../utils/profileIssues';
import '../css/profile.css';

export default function IssuesPage() {
  const navigate = useNavigate();
  const {
    store,
    mergeCandidates,
    setMergeCandidates,
    mergeCandidatesError,
    loadMergeCandidates,
  } = useOutletContext();
  const { d, loading, error, reload, dismissReviewItem } = store;
  const [dr, setDr] = useState(null);
  const [mutationError, setMutationError] = useState('');
  const [comparison, setComparison] = useState(null);
  const [sectionOpen, setSectionOpen] = useState(true);

  const mergeGroups = useMemo(
    () => groupMergeProposals(mergeCandidates),
    [mergeCandidates]
  );
  const claimItemsById = useMemo(
    () => new Map(
      [
        ...d.skills,
        ...d.experience,
        ...d.education,
        ...d.projects,
        ...d.certifications,
        ...d.languages,
        ...d.pendingClaims,
      ].map((item) => [item.id, item])
    ),
    [d]
  );
  const { issues, reviewsByMergeGroup } = useMemo(
    () => getGroupedProfileIssues(d, mergeGroups),
    [d, mergeGroups]
  );

  const close = () => setDr(null);
  const dismissCopies = async (issue) => {
    const count = issue.copies.length;
    if (!window.confirm(`"${issue.title}" is already in your profile. Dismiss ${count === 1 ? 'its copy' : `its ${count} copies`} from your documents?`)) {
      return;
    }
    for (const reviewItemId of issue.copies) {
      const item = d.reviewItems.find(
        (reviewItem) => reviewItem.reviewItemId === reviewItemId
      );
      if (item) await dismissReviewItem(reviewItemId, item.version);
    }
  };
  const runMutation = async (action) => {
    setMutationError('');
    try {
      await action();
    } catch (saveError) {
      setMutationError(saveError.message || 'Unable to save this change.');
    }
  };

  if (loading) {
    return <div className="pf"><div className="wrap"><p className="hint">Loading issues…</p></div></div>;
  }

  if (error) {
    return (
      <div className="pf">
        <div className="wrap">
          <p className="err" role="alert">{error}</p>
          <button className="btn ghost sm" onClick={reload}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pf">
      <div className="wrap">
        <header className="issues-page-heading">
          <h1>Issues</h1>
          <p>Review and resolve items found in your profile and source documents.</p>
        </header>
        {mutationError && <p className="err" role="alert">{mutationError}</p>}
        {mergeCandidatesError && (
          <p className="err" role="alert">
            {mergeCandidatesError}{' '}
            <button className="btn ghost sm" onClick={loadMergeCandidates}>Retry</button>
          </p>
        )}
        <div className="secs">
          <IssuesSection
            items={issues}
            total={issues.length}
            mergeCandidates={mergeCandidates}
            open={sectionOpen}
            onToggle={() => setSectionOpen((open) => !open)}
            onOpenIssue={(issue) => setDr({ type: issue.kind, id: issue.id })}
            reviewsByMergeGroup={reviewsByMergeGroup}
            onDismissCopies={(issue) => runMutation(() => dismissCopies(issue))}
            onMergeCandidatesChange={setMergeCandidates}
            claimItemsById={claimItemsById}
            selectedProposal={comparison}
            onSelectedProposalChange={setComparison}
            onRefreshProfile={reload}
          />
        </div>
        <p className="foot">Issues are loaded from your account · <button onClick={reload}>Refresh issues</button></p>
      </div>

      <ActiveDrawer
        dr={dr}
        setDr={setDr}
        close={close}
        store={store}
        goSources={(id) => navigate(id ? `/sources/${encodeURIComponent(id)}` : '/sources')}
      />
    </div>
  );
}
