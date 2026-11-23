import { useState } from 'react';
import { TABS } from '../constants/config';
import { isBadLink } from '../data/profileData';

// Search filtering for profile sections, with their counts and review flags.
export default function useProfileFilters(d) {
  const [q, setQ] = useState('');

  const qq = q.trim().toLowerCase();
  const filtering = !!qq;
  const hay = (x) => Object.entries(x).filter(([k]) => k !== 'id').flatMap(([, v]) => v).filter((v) => typeof v === 'string').join(' ').toLowerCase();
  const hit = (x) => !qq || hay(x).includes(qq);

  const list = {
    summary: [d.summary].filter(hit),
    skills: d.skills.filter(hit),
    exp: d.experience.filter(hit),
    edu: d.education.filter(hit),
    proj: d.projects.filter(hit),
    cert: d.certifications.filter(hit),
    languages: d.languages.filter(hit),
  };
  const total = { skills: d.skills.length, exp: d.experience.length, edu: d.education.length, proj: d.projects.length, cert: d.certifications.length, languages: d.languages.length };
  const flagged = {
    summary: d.summary.cut,
    skills: d.skills.some((skill) => skill.low),
    exp: d.experience.some((experience) => experience.conflict),
    proj: d.projects.some((project) => isBadLink(project.link)),
    cert: d.certifications.some((certification) => certification.dup),
  };
  const visible = (id) => !filtering || list[id].length > 0;
  const anyVisible = TABS.some(([id]) => visible(id));

  const reset = () => setQ('');

  return { q, setQ, filtering, list, total, flagged, visible, anyVisible, reset };
}
