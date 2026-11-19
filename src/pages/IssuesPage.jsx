import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { getIssues } from '../data/profileData';
import useSections from '../hooks/useSections';
import IssuesSection from '../components/profile/sections/IssuesSection';
import ActiveDrawer from '../components/profile/drawers/ActiveDrawer';
import '../css/profile.css';

export default function IssuesPage() {
  const {
    profileStore: store,
    mergeCandidates,
    mergeCandidatesLoading,
    onMergeCandidatesChange,
  } = useOutletContext();
  const { d, reload, loading, error } = store;
  const navigate = useNavigate();
  const [dr, setDr] = useState(null);
  const sections = useSections();
  const issues = useMemo(() => getIssues(d), [d]);
  const close = useCallback(() => setDr(null), []);
  const goSources = useCallback((id) => {
    navigate(id ? `/sources/${encodeURIComponent(id)}` : '/sources');
  }, [navigate]);

  if (loading || mergeCandidatesLoading) {
    return (
      <main className="pf">
        <div className="wrap">
          <p className="hint">Loading issues…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="pf">
        <div className="wrap">
          <p className="err" role="alert">{error}</p>
          <button className="btn ghost sm" onClick={reload}>Retry</button>
        </div>
      </main>
    );
  }

  return (
    <div className="pf">
      <div className="wrap">
        <header className="issues-page-heading">
          <h1>Issues</h1>
          <p>Review and resolve items that need your attention.</p>
        </header>
        <main className="secs">
          <IssuesSection
            items={issues}
            total={issues.length}
            open={sections.open.issues}
            onToggle={() => sections.toggle('issues')}
            onOpenIssue={(issue) => setDr({ type: issue.kind, id: issue.id })}
            mergeCandidates={mergeCandidates}
            onMergeCandidatesChange={onMergeCandidatesChange}
            onRefreshProfile={reload}
          />
        </main>
      </div>
      <ActiveDrawer
        dr={dr}
        setDr={setDr}
        close={close}
        store={store}
        goSources={goSources}
      />
    </div>
  );
}
