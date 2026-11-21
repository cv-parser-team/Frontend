import { useCallback, useMemo, useState } from 'react';
import { completion, getIssues, totalExperience } from '../data/profileData';
import useProfileData from '../hooks/useProfileData';
import useProfileFilters from '../hooks/useProfileFilters';
import useSections from '../hooks/useSections';
import ProfileHeader from '../components/profile/layout/ProfileHeader';
import StatsGrid from '../components/profile/layout/StatsGrid';
import SectionNav from '../components/profile/layout/SectionNav';
import Toolbar from '../components/profile/layout/Toolbar';
import IssuesSection from '../components/profile/sections/IssuesSection';
import SummarySection from '../components/profile/sections/SummarySection';
import SkillsSection from '../components/profile/sections/SkillsSection';
import CollectionSection from '../components/profile/sections/CollectionSection';
import ActiveDrawer from '../components/profile/drawers/ActiveDrawer';
import SkillDialog from '../components/profile/drawers/SkillDialog';
import { COLL } from '../constants/config';
import { groupMergeProposals } from '../utils/coalesceUtils';
import { collapseDuplicates, groupReviewIssues, indexGroupsByClaim } from '../utils/duplicateGroups';
import '../css/profile.css';

export default function ProfilePage({ sourcesPath = '/sources', onNavigate = (p) => window.location.assign(p) }) {
  const store = useProfileData();
  const { d, add, del, reload, loading, error, dismissReviewItem } = store;
  const [dr, setDr] = useState(null); // { type, id } — a single state decides which drawer is open
  const [skillDlg, setSkillDlg] = useState(false);
  const [editSkills, setEditSkills] = useState(false);
  const [mutationError, setMutationError] = useState('');
  const sections = useSections();

  // Claims the backend suspects are copies of each other, grouped the way the
  // Issues section shows them, so its count and the tab count agree.
  const [mergeCandidates, setMergeCandidates] = useState([]);
  const [comparison, setComparison] = useState(null);
  const mergeGroups = useMemo(() => groupMergeProposals(mergeCandidates), [mergeCandidates]);
  const groupByClaim = useMemo(() => indexGroupsByClaim(mergeGroups), [mergeGroups]);
  const candidateIssuesCount = mergeGroups.length;
  const claimItemsById = useMemo(() => new Map(
    [
      ...d.skills,
      ...d.experience,
      ...d.education,
      ...d.projects,
      ...d.certifications,
      ...d.languages,
      ...d.pendingClaims,
    ].map((item) => [item.id, item])
  ), [d]);

  // Issues are derived from the data, never stored — badges, red dots and counts can't drift apart.
  // A pending claim that is one of several suspected copies is resolved by
  // merging the copies, so it has no approval card of its own: accepting it
  // alone would leave two accepted copies of the same entry.
  // Review items that state the same fact as each other or as saved claims
  // share one card, as duplicate claims do.
  const { issues, reviewsByMergeGroup } = useMemo(
    () => groupReviewIssues(
      getIssues(d).filter((issue) => !(issue.kind === 'claimReview' && groupByClaim.has(issue.id))),
      d.reviewItems ?? [],
      mergeGroups
    ),
    [d, groupByClaim, mergeGroups]
  );
  const comp = useMemo(() => completion(d, issues), [d, issues]);
  const tx = useMemo(() => totalExperience(d.experience), [d.experience]);
  const filters = useProfileFilters(d, issues);
  const { list, total, flagged, visible, setOnlyReview } = filters;
  const totalIssuesCount = total.issues + candidateIssuesCount;
  // Each list counts suspected copies once, as it shows them; the tabs and the
  // section headers use the same counts.
  const listTotals = useMemo(
    () => Object.fromEntries(Object.entries(COLL).map(([type, { key }]) =>
      [type, collapseDuplicates(d[key], groupByClaim).length])),
    [d, groupByClaim]
  );
  const navTotal = useMemo(
    () => ({ ...total, ...listTotals, issues: totalIssuesCount }),
    [total, listTotals, totalIssuesCount]
  );
  const navFlagged = useMemo(
    () => ({ ...flagged, issues: flagged.issues || candidateIssuesCount > 0 }),
    [flagged, candidateIssuesCount]
  );

  const close = useCallback(() => setDr(null), []);
  const closeSkill = useCallback(() => setSkillDlg(false), []);
  const goSources = (id) => onNavigate(id
    ? `${sourcesPath}/${encodeURIComponent(id)}`
    : sourcesPath);
  const runMutation = async (action) => {
    setMutationError('');
    try {
      await action();
    } catch (saveError) {
      setMutationError(saveError.message || 'Unable to save this change.');
    }
  };

  // The fact is already in the profile, so its extracted copies awaiting review
  // add nothing. The candidate confirms before they are dismissed.
  const dismissCopies = async (issue) => {
    const count = issue.copies.length;
    if (!window.confirm(`"${issue.title}" is already in your profile. Dismiss ${count === 1 ? 'its copy' : `its ${count} copies`} from your documents?`)) {
      return;
    }
    for (const reviewItemId of issue.copies) {
      const item = d.reviewItems.find((reviewItem) => reviewItem.reviewItemId === reviewItemId);
      if (item) await dismissReviewItem(reviewItemId, item.version);
    }
  };

  // "Next step" in the completion card
  const act = (a) => ({
    phone: () => setDr({ type: 'phone' }), profile: () => setDr({ type: 'profile' }), summary: () => setDr({ type: 'summary' }),
    skills: () => setSkillDlg(true), exp: () => setDr({ type: 'exp', id: 'new' }), edu: () => setDr({ type: 'edu', id: 'new' }),
    issues: () => { setOnlyReview(true); sections.go('issues'); },
  }[a]());

  const sec = (id) => ({ open: sections.open[id], onToggle: () => sections.toggle(id) });
  const collection = (type, label) => {
    if (!visible(type)) return null;
    return (
      <CollectionSection type={type} label={label}
        items={collapseDuplicates(list[type], groupByClaim, d[COLL[type].key])}
        total={listTotals[type]} {...sec(type)}
        onAdd={() => setDr({ type, id: 'new' })} onOpenItem={(id) => setDr({ type, id })}
        onOpenDuplicates={setComparison} />
    );
  };

  if (loading) {
    return <div className="pf"><div className="wrap"><p className="hint">Loading profile…</p></div></div>;
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
        {mutationError && <p className="err" role="alert">{mutationError}</p>}
        <ProfileHeader profile={d.profile} hasIssues={!!issues.length || candidateIssuesCount > 0} comp={comp} onEdit={() => setDr({ type: 'profile' })} onAct={act} />

        <StatsGrid education={d.education} skillsCount={d.skills.length} sourceCount={d.documents.length} totalExperience={tx} onOpenSources={goSources} />

        <SectionNav total={navTotal} flagged={navFlagged} visible={visible} onGo={sections.go}
          allOpen={sections.allOpen} openCount={sections.openCount} onToggleAll={sections.toggleAll} />

        <Toolbar q={filters.q} onQueryChange={filters.setQ} onlyReview={filters.onlyReview}
          onOnlyReviewChange={setOnlyReview} issuesCount={totalIssuesCount} />

        <main className="secs">
          {visible('issues') && (
            <IssuesSection items={list.issues} total={total.issues} {...sec('issues')}
              onOpenIssue={(i) => setDr({ type: i.kind, id: i.id })}
              reviewsByMergeGroup={reviewsByMergeGroup}
              onDismissCopies={(issue) => runMutation(() => dismissCopies(issue))}
              onMergeCandidatesChange={setMergeCandidates}
              claimItemsById={claimItemsById}
              selectedProposal={comparison} onSelectedProposalChange={setComparison}
              onRefreshProfile={reload} />
          )}

          {visible('summary') && (
            <SummarySection summary={d.summary} {...sec('summary')} onEdit={() => setDr({ type: 'summary' })} />
          )}

          {visible('skills') && (
            <SkillsSection items={list.skills} total={total.skills} {...sec('skills')}
              editing={editSkills} onStartEdit={() => setEditSkills(true)} onStopEdit={() => setEditSkills(false)}
              onAdd={() => setSkillDlg(true)} onReview={(id) => setDr({ type: 'skill', id })}
              onEdit={(id) => setDr({ type: 'skillEdit', id })}
              onRemove={(id) => runMutation(() => del('skills', id))} />
          )}

          {collection('exp', 'work experience')}
          {collection('edu', 'education')}
          {collection('proj', 'project')}
          {collection('cert', 'certification')}
          {collection('languages', 'language')}

          {filters.filtering && !filters.anyVisible && <p className="empty">No results match your filters.</p>}
        </main>

        <p className="foot">Profile data is saved to your account · <button onClick={reload}>Refresh profile</button></p>
      </div>

      <ActiveDrawer dr={dr} setDr={setDr} close={close} store={store} goSources={goSources} />
      {skillDlg && <SkillDialog onClose={closeSkill} taken={(n) => d.skills.some((s) => s.name.toLowerCase() === n.toLowerCase())}
        onAdd={async (name) => { await add('skills', { name }); closeSkill(); }} />}
    </div>
  );
}
