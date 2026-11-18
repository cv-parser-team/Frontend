// profileData.js — source labels and pure profile helpers.

export const SOURCES = {
  resume: { label: 'Resume.pdf' },
  cv: { label: 'CV.docx' },
  linkedin: { label: 'LinkedIn' },
  manual: { label: 'Added by you' },
};
/* ───────── formatting ───────── */
export const fmtMonth = (v) => {
  if (!v) return '';
  if (/^\d{4}$/.test(v)) return v;
  return new Date(`${v}-01T00:00:00`).toLocaleString('en-US', { month: 'long', year: 'numeric' });
};
export const range = (from, to, current) => [fmtMonth(from), current ? 'Present' : fmtMonth(to)].filter(Boolean).join(' – ');

const WELL_FORMED = /^https?:\/\/[^\s/$.?#][^\s]*\.[^\s]{2,}$/i;
export const isBadLink = (u) => !!u && !WELL_FORMED.test(u);

/* ───────── total experience: merges overlapping roles, counts months inclusively ───────── */
export function totalExperience(roles) {
  const idx = (value, isEnd = false) => {
    const [year, month] = value.split('-').map(Number);
    if (!Number.isInteger(year)) return Number.NaN;
    return year * 12 + (month ? month - 1 : isEnd ? 11 : 0);
  };
  const now = new Date();
  const nowIdx = now.getFullYear() * 12 + now.getMonth();
  const spans = roles
    .filter((r) => r.start)
    .map((r) => [idx(r.start), r.current || !r.end ? nowIdx : idx(r.end, true)])
    .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b) && b >= a)
    .sort((x, y) => x[0] - y[0]);
  let months = 0;
  let cur = null;
  for (const [a, b] of spans) {
    if (cur && a <= cur[1]) cur[1] = Math.max(cur[1], b);
    else { if (cur) months += cur[1] - cur[0] + 1; cur = [a, b]; }
  }
  if (cur) months += cur[1] - cur[0] + 1;
  return { y: Math.floor(months / 12), m: months % 12 };
}

/* ───────── issues are DERIVED from the data (never stored) ───────── */
export function getIssues(d) {
  const out = [];
  const push = (kind, area, id, title, text) => out.push({ kind, area, id, title, text });
  const reviewAreas = {
    education: 'Education',
    employment: 'Work Experience',
    skill: 'Skills',
    language: 'Languages',
    certification: 'Certifications',
    project: 'Projects',
  };
  const formatField = (value) => value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
  const formatReviewValue = (field) => {
    const value = field && typeof field === 'object' && !Array.isArray(field)
      ? field.value ?? field.raw
      : field;
    if (Array.isArray(value)) return value.join(', ');
    if (value && typeof value === 'object') return JSON.stringify(value);
    return value == null ? '' : String(value);
  };
  const getReviewTitle = (item) => {
    const value = (...names) => names
      .map((name) => formatReviewValue(item.fields?.[name]).trim())
      .find(Boolean) ?? '';
    const join = (...parts) => parts.filter(Boolean).join(' · ');

    switch (item.claimType) {
      case 'employment':
        return join(value('jobTitle', 'title', 'role'), value('employer', 'company', 'organization')) || 'Verify extracted work experience';
      case 'education':
        return join(value('degree', 'qualification'), value('institution', 'school')) || 'Verify extracted education';
      case 'project':
        return value('name', 'title', 'projectName') || 'Verify extracted project';
      case 'certification':
        return join(value('name', 'title'), value('issuer', 'organization')) || 'Verify extracted certification';
      case 'language':
        return join(value('name', 'language'), value('proficiency', 'level')) || 'Verify extracted language';
      case 'skill':
        return value('name', 'skill') || 'Verify extracted skill';
      default:
        return 'Verify extracted information';
    }
  };

  d.experience.filter((e) => e.conflict).forEach((e) =>
    push('conflict', 'Work Experience', e.id, `${e.title} · end date`,
      `${e.conflict.map((o) => SOURCES[o.source].label).join(' and ')} give different end dates. A person has to choose.`));

  const seen = new Set();
  d.certifications.filter((c) => c.dup).forEach((c) => {
    if (seen.has(c.dup)) return; // report each duplicate pair once
    seen.add(c.id);
    push('duplicate', 'Certifications', c.id, c.name, 'Two certifications look like the same credential from different sources.');
  });

  d.projects.filter((p) => isBadLink(p.link)).forEach((p) =>
    push('link', 'Projects', p.id, `${p.name} · link`,
      /^https?:\/\//i.test(p.link) ? 'The link isn’t a valid web address.' : 'The link is missing “https://”, so it can’t be opened.'));

  d.skills.filter((s) => s.low).forEach((s) =>
    push('skill', 'Skills', s.id, s.name, 'Found once in your resume with low confidence. Confirm it is one of your skills.'));

  const pendingClaimMeta = {
    skills: { area: 'Skills', title: (item) => item.name },
    experience: { area: 'Work Experience', title: (item) => `${item.title} · ${item.employer}` },
    education: { area: 'Education', title: (item) => `${item.degree} · ${item.school}` },
    projects: { area: 'Projects', title: (item) => item.name },
    certifications: { area: 'Certifications', title: (item) => item.name },
    languages: { area: 'Languages', title: (item) => item.name },
  };

  (d.pendingClaims ?? []).forEach((item) => {
    const meta = pendingClaimMeta[item._collection];
    if (!meta) return;
    push(
      'claimReview',
      meta.area,
      item.id,
      meta.title(item),
      'This extracted item needs your review before it is accepted into your profile.',
    );
  });

  if (d.summary.cut) push('extract', 'Professional Summary', 'summary', 'Professional Summary', 'The last sentence was cut off in the scanned document.');
  if (!d.profile.phone) push('phone', 'Contact details', 'phone', 'Phone number', 'No phone number was found in your documents. This is optional.');

  (d.reviewItems ?? []).forEach((item) => {
    const area = reviewAreas[item.claimType] ?? 'Extracted information';
    const fields = Object.entries(item.fields ?? {})
      .map(([name, field]) => {
        const value = formatReviewValue(field);
        return value.trim() ? `${formatField(name)}: ${value}` : '';
      })
      .filter(Boolean);
    out.push({
      kind: 'review',
      area,
      id: item.reviewItemId,
      documentId: item.documentId,
      title: getReviewTitle(item),
      text: fields.length
        ? fields.join(' · ')
        : 'Extracted information is awaiting review.',
      issues: item.issues ?? [],
    });
  });

  return out;
}

/* ───────── profile completion: 10 steps, the first unfinished one is the "next step" ───────── */
export function completion(d, issues) {
  const p = d.profile;
  const steps = [
    ['Add your name and job title', p.fullName && p.title, 'profile'],
    ['Add your email', p.email, 'profile'],
    ['Add your location', p.location, 'profile'],
    ['Add your LinkedIn link', p.linkedin, 'profile'],
    ['Write a professional summary', d.summary.text, 'summary'],
    ['Add your skills', d.skills.length, 'skills'],
    ['Add your work experience', d.experience.length, 'exp'],
    ['Add your education', d.education.length, 'edu'],
    ['Add your phone number', p.phone, 'phone'],
    ['Resolve all review items', !issues.length, 'issues'],
  ].map(([label, done, act]) => ({ label, done: !!done, act }));
  const n = steps.filter((s) => s.done).length;
  return { steps, n, pct: Math.round((n / steps.length) * 100), next: steps.find((s) => !s.done) };
}
