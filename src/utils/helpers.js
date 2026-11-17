import { SOURCES, isBadLink } from '../data/profileData';

export const cx = (...a) => a.filter(Boolean).join(' ');
export const uid = () => Math.random().toString(36).slice(2, 8);
const sourceLabel = (id) => {
  const source = Object.prototype.hasOwnProperty.call(SOURCES, id) ? SOURCES[id] : null;
  return source && typeof source.label === 'string' ? source.label : 'Source document';
};
export const infoText = (x) => [
  (Array.isArray(x.sources) ? x.sources : []).map(sourceLabel).join(' + '),
  x.conf && `${x.conf} confidence`,
].filter(Boolean).join(' · ');

// which "issue drawer" an item can be sent to from its edit drawer
export const reviewOf = (t, x) => x && ({
  exp: x.conflict && ['conflict', 'The two sources disagree about the end date.'],
  cert: x.dup && ['duplicate', 'Two certifications look like the same credential from different sources.'],
  proj: isBadLink(x.link) && ['link', 'The link can’t be opened as written.'],
}[t] || null);

// editing the end date by hand also settles a conflict
export const patchFor = (t, x, v) => (t === 'exp' && x.conflict && v.end !== x.end ? { ...v, conflict: null, resolved: true } : v);
