import Badge from '../ui/Badge';
import Callout from '../ui/Callout';
import { NormalizedCallout } from '../ui/NormalizedNote';
import EditDrawer from './EditDrawer';
import ConflictDrawer from './ConflictDrawer';
import DuplicateDrawer from './DuplicateDrawer';
import LinkDrawer from './LinkDrawer';
import SkillDrawer from './SkillDrawer';
import TextFixDrawer from './TextFixDrawer';
import PhoneDrawer from './PhoneDrawer';
import ExtractionReviewDrawer from './ExtractionReviewDrawer';
import ClaimReviewDrawer from './ClaimReviewDrawer';
import AutoMergeReviewDrawer from './AutoMergeReviewDrawer';
import { COLL, F } from '../../../constants/config';
import { patchFor, reviewOf } from '../../../utils/helpers';
import { SOURCES } from '../../../data/profileData';

// A single state ({ type, id }) decides which drawer is open.
export default function ActiveDrawer({ dr, setDr, close, store, goSources }) {
  const { d, setD, upd, add, del, merge, resolveReviewItem, dismissReviewItem, reviewClaim, acknowledgeAutoMerge, keepAutoMergeSeparate } = store;
  if (!dr) return null;
  const { type, id } = dr;
  const pr = d.profile;

  const c = COLL[type];
  if (c) {
    const item = id === 'new' ? null : d[c.key].find((x) => x.id === id);
    if (id !== 'new' && !item) return null;
    if (item?.mergeNotices?.length > 0) {
      return <AutoMergeReviewDrawer
        key={`auto-merge-${id}`}
        item={item}
        onClose={close}
        onConfirm={async () => {
          await acknowledgeAutoMerge(c.key, id);
          close();
        }}
        onKeepSeparate={async () => {
          await keepAutoMergeSeparate(c.key, id);
          close();
        }}
      />;
    }
    const rv = reviewOf(type, item);
    return (
      <EditDrawer key={`${type}-${id}`} title={`${item ? 'Edit' : 'Add'} ${c.noun}`} sub={item && c.sub(item)}
        badge={rv && <Badge>Needs review</Badge>}
        note={<>
          {rv && (
            <Callout tone="amber"><b>Needs review:</b> {rv[1]}{' '}
              <button className="lk" onClick={() => setDr({ type: rv[0], id })}>Resolve issue</button>
            </Callout>
          )}
          <NormalizedCallout
            original={item?.normalizedFrom?.title ?? item?.normalizedFrom?.degree}
            shown={item?.title ?? item?.degree}
          />
        </>}
        rows={F[type]} init={item || {}} item={item} onClose={close} onViewSource={goSources}
        ok={item?.normalizedFrom?.title || item?.normalizedFrom?.degree ? 'Got it' : undefined}
        onSave={async (v) => {
          if (item) await upd(c.key, id, patchFor(type, item, v));
          else await add(c.key, v);
          close();
        }}
        onDelete={item && (async () => {
          if (window.confirm(`Delete this ${c.noun} entry?`)) {
            await del(c.key, id);
            close();
          }
        })} />
    );
  }

  switch (type) {
    case 'profile':
      return <EditDrawer key="profile" title="Edit profile" sub={pr.fullName} rows={F.profile} init={pr} onClose={close}
        onSave={async (v) => { await merge('profile', v); close(); }} />;
    case 'summary': {
      const s = d.summary;
      return (
        <EditDrawer key="summary" title="Edit professional summary" sub={SOURCES[s.sources?.[0]]?.label || 'Candidate profile'}
          badge={s.cut && <Badge>Needs review</Badge>}
          note={s.cut && <Callout tone="amber"><b>Needs review:</b> The last sentence was cut off in the scanned document.</Callout>}
          rows={F.summary} init={s} item={s} onClose={close} onViewSource={goSources}
          onSave={async (v) => { await merge('summary', { text: v.text, cut: v.text === s.text ? s.cut : false }); close(); }}
          onDelete={async () => {
            if (window.confirm('Delete your professional summary?')) {
              await merge('summary', { text: '', cut: false });
              close();
            }
          }} />
      );
    }
    case 'conflict': {
      const e = d.experience.find((x) => x.id === id);
      return e && <ConflictDrawer key={id} e={e} onClose={close}
        onResolve={async (value) => { await upd('experience', id, { end: value, current: false }); close(); }} />;
    }
    case 'duplicate': {
      const x = d.certifications.find((z) => z.id === id);
      const y = x && d.certifications.find((z) => z.id === x.dup);
      if (!x || !y) return null;
      const [a, b] = d.certifications.indexOf(x) < d.certifications.indexOf(y) ? [x, y] : [y, x];
      return <DuplicateDrawer key={id} a={a} b={b} onClose={close} onDone={(merged) => {
        setD((s) => ({
          ...s,
          certifications: merged
            ? s.certifications.filter((z) => z.id !== b.id).map((z) => (z.id === a.id ? { ...z, dup: null, sources: [...new Set([...a.sources, ...b.sources])] } : z))
            : s.certifications.map((z) => (z.id === a.id || z.id === b.id ? { ...z, dup: null } : z)),
        }));
        close();
      }} />;
    }
    case 'link': {
      const p = d.projects.find((x) => x.id === id);
      return p && <LinkDrawer key={id} p={p} onClose={close}
        onSave={async (link) => { await upd('projects', id, { link }); close(); }}
        onRemove={async () => { await upd('projects', id, { link: '' }); close(); }} />;
    }
    case 'skill': {
      const s = d.skills.find((x) => x.id === id);
      return s && <SkillDrawer key={id} s={s} onClose={close} onDone={(mode, name) => {
        if (mode === 'remove') return del('skills', id).then(close);
        return upd('skills', id, { ...(mode === 'rename' && { name }) }).then(close);
      }} />;
    }
    case 'skillEdit': {
      const skill = d.skills.find((x) => x.id === id);
      if (!skill) return null;
      if (skill.mergeNotices?.length > 0) {
        return <AutoMergeReviewDrawer
          key={`auto-merge-${id}`}
          item={skill}
          onClose={close}
          onConfirm={async () => {
            await acknowledgeAutoMerge('skills', id);
            close();
          }}
          onKeepSeparate={async () => {
            await keepAutoMergeSeparate('skills', id);
            close();
          }}
        />;
      }
      return <EditDrawer key={id} title="Edit skill" sub={skill.name} rows={F.skill} init={skill}
        note={<>
          <NormalizedCallout original={skill.normalizedFrom?.name} shown={skill.name} />
        </>}
        onClose={close} ok={skill.normalizedFrom?.name ? 'Got it' : undefined}
        onSave={async (values) => { await upd('skills', id, values); close(); }}
        onDelete={async () => {
          if (window.confirm('Delete this skill from your profile?')) {
            await del('skills', id);
            close();
          }
        }} />;
    }
    case 'extract':
      return <TextFixDrawer key="extract" s={d.summary} onClose={close}
        onKeep={async () => { await merge('summary', { text: d.summary.text, cut: false }); close(); }}
        onSave={async (text) => { await merge('summary', { text, cut: false }); close(); }} />;
    case 'phone':
      return <PhoneDrawer key="phone" phone={pr.phone} onClose={close}
        onSave={async (phone) => { await merge('profile', { phone }); close(); }} />;
    case 'review': {
      const item = d.reviewItems.find((reviewItem) => reviewItem.reviewItemId === id);
      return item && <ExtractionReviewDrawer
        key={id}
        item={item}
        onClose={close}
        onResolve={async (values) => {
          await resolveReviewItem(id, values, item.version);
          close();
        }}
        onDismiss={async () => {
          await dismissReviewItem(id, item.version);
          close();
        }}
      />;
    }
    case 'claimReview': {
      const item = d.pendingClaims.find((claim) => claim.id === id);
      const areas = {
        skills: 'Skills',
        experience: 'Work Experience',
        education: 'Education',
        projects: 'Projects',
        certifications: 'Certifications',
        languages: 'Languages',
      };
      return item && <ClaimReviewDrawer
        key={id}
        item={item}
        area={areas[item._collection] || 'Profile'}
        onClose={close}
        onReview={async (status) => {
          await reviewClaim(item._collection, id, status);
          close();
        }}
      />;
    }
    default:
      return null;
  }
}
