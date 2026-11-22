import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { completion, totalExperience } from '../data/profileData';
import useProfileFilters from '../hooks/useProfileFilters';
import useSections from '../hooks/useSections';
import ProfileHeader from '../components/profile/layout/ProfileHeader';
import StatsGrid from '../components/profile/layout/StatsGrid';
import SectionNav from '../components/profile/layout/SectionNav';
import Toolbar from '../components/profile/layout/Toolbar';
import SummarySection from '../components/profile/sections/SummarySection';
import SkillsSection from '../components/profile/sections/SkillsSection';
import CollectionSection from '../components/profile/sections/CollectionSection';
import ActiveDrawer from '../components/profile/drawers/ActiveDrawer';
import SkillDialog from '../components/profile/drawers/SkillDialog';
import { COLL } from '../constants/config';
import { groupMergeProposals } from '../utils/coalesceUtils';
import { collapseDuplicates, indexGroupsByClaim } from '../utils/duplicateGroups';
import { getGroupedProfileIssues } from '../utils/profileIssues';
import '../css/profile.css';

export default function ProfilePage({ sourcesPath = '/sources', onNavigate = (p) => window.location.assign(p) }) {
  const navigate = useNavigate();
  const { store, mergeCandidates, mergeCandidatesError, loadMergeCandidates } = useOutletContext();
  const { d, add, del, reload, loading, error } = store;
  const [dr, setDr] = useState(null); // { type, id } — a single state decides which drawer is open
  const [skillDlg, setSkillDlg] = useState(false);
  const [editSkills, setEditSkills] = useState(false);
  const [mutationError, setMutationError] = useState('');
  const sections = useSections();

  const mergeGroups = useMemo(() => groupMergeProposals(mergeCandidates), [mergeCandidates]);
  const groupByClaim = useMemo(() => indexGroupsByClaim(mergeGroups), [mergeGroups]);
  const { issues } = useMemo(
    () => getGroupedProfileIssues(d, mergeGroups),
    [d, mergeGroups]
  );
  const comp = useMemo(() => completion(d, issues), [d, issues]);
  const tx = useMemo(() => totalExperience(d.experience), [d.experience]);
  const filters = useProfileFilters(d);
  const { list, total, flagged, visible } = filters;
  const listTotals = useMemo(
    () => Object.fromEntries(Object.entries(COLL).map(([type, { key }]) =>
      [type, collapseDuplicates(d[key], groupByClaim).length])),
    [d, groupByClaim]
  );
  const navTotal = useMemo(() => ({ ...total, ...listTotals }), [total, listTotals]);

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

  // "Next step" in the completion card
  const act = (a) => ({
    phone: () => setDr({ type: 'phone' }), profile: () => setDr({ type: 'profile' }), summary: () => setDr({ type: 'summary' }),
    skills: () => setSkillDlg(true), exp: () => setDr({ type: 'exp', id: 'new' }), edu: () => setDr({ type: 'edu', id: 'new' }),
    issues: () => navigate('/issues'),
  }[a]());

  const sec = (id) => ({ open: sections.open[id], onToggle: () => sections.toggle(id) });
  const collection = (type, label) => {
    if (!visible(type)) return null;
    return (
      <CollectionSection type={type} label={label}
        items={collapseDuplicates(list[type], groupByClaim, d[COLL[type].key])}
        total={listTotals[type]} {...sec(type)}
        onAdd={() => setDr({ type, id: 'new' })} onOpenItem={(id) => setDr({ type, id })}
        onOpenDuplicates={() => navigate('/issues')} />
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
        {mergeCandidatesError && <p className="err" role="alert">{mergeCandidatesError} <button className="btn ghost sm" onClick={loadMergeCandidates}>Retry</button></p>}
        <ProfileHeader profile={d.profile} hasIssues={!!issues.length || mergeGroups.length > 0} comp={comp} onEdit={() => setDr({ type: 'profile' })} onAct={act} />

        <StatsGrid education={d.education} skillsCount={d.skills.length} sourceCount={d.documents.length} totalExperience={tx} onOpenSources={goSources} />

        <SectionNav total={navTotal} flagged={flagged} visible={visible} onGo={sections.go}
          allOpen={sections.allOpen} openCount={sections.openCount} onToggleAll={sections.toggleAll} />

        <Toolbar q={filters.q} onQueryChange={filters.setQ}
          issuesCount={issues.length + mergeGroups.length} onOpenIssues={() => navigate('/issues')} />

        <main className="secs">
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
