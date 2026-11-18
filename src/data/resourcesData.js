export const initialResources = [
  { id: 'resume-2026', name: 'Resume_2026.pdf', type: 'PDF', added: 'Oct 12, 2026', status: 'Processed', fields: 24, issues: '1 conflict', size: '248 KB' },
  { id: 'resume-old', name: 'Resume_Old.docx', type: 'DOCX', added: 'Oct 4, 2026', status: 'Processed', fields: 19, issues: '—', size: '192 KB' },
  { id: 'resume-photo', name: 'Resume_Photo.jpg', type: 'Image', added: 'Sep 28, 2026', status: 'Partial', fields: 11, issues: '3 to review', size: '1.2 MB' },
  { id: 'linkedin', name: 'LinkedIn Profile', type: 'Link', added: 'Sep 20, 2026', status: 'Processed', fields: 17, issues: '1 conflict', size: 'Online' },
  { id: 'resume-scan', name: 'Resume_Scan.pdf', type: 'PDF', added: 'Sep 15, 2026', status: 'Failed', fields: 0, issues: 'Cannot be read', size: '384 KB' },
]

export const initialResourceSections = [
  { id: 'personal', title: 'Personal Information', kind: 'fields', items: [
    { label: 'Full name', extracted: 'Amina Haddad', current: 'Amina Haddad', confidence: .97, status: 'accepted', evidence: 'Page 1, header' },
    { label: 'Email', extracted: 'amina.haddad@example.com', current: 'amina.haddad@example.com', confidence: .98, status: 'accepted', evidence: 'Page 1, header' },
    { label: 'Phone', extracted: '+971 50 123 4567', current: '+971 50 123 4567', confidence: .90, status: 'accepted', evidence: 'Page 1, header' },
    { label: 'Location', extracted: 'Dubai', current: 'Not confirmed', confidence: .62, status: 'review', evidence: 'Page 1, header', note: 'This value appears only once in the source. Please confirm it.' },
    { label: 'Country', extracted: 'United Arab Emirates', current: 'United Arab Emirates', confidence: .88, status: 'accepted', evidence: 'Page 1, header' },
  ]},
  { id: 'skills', title: 'Skills', kind: 'fields', items: [
    ...[['React',.94,'merged'],['TypeScript',.95,'accepted'],['Node.js',.93,'accepted'],['SQL',.90,'accepted'],['Python',.90,'accepted'],['Docker',.88,'accepted'],['Git',.92,'accepted'],['REST APIs',.86,'accepted']].map(([label,confidence,status]) => ({ label, extracted: label, current: label, confidence, status, evidence: 'Page 2, Skills' })),
  ]},
  { id: 'experience', title: 'Work Experience', kind: 'entries', items: [
    { title: 'Senior Software Engineer', org: 'Northwind Labs', start: 'Feb 2021', end: 'March 2024', description: '', status: 'accepted', source: 'Page 1 · Experience', original: 'Senior Software Engineer · Northwind Labs · Feb 2021 – March 2024' },
    { title: 'Software Engineer', org: 'Brightpath', start: 'Jan 2018', end: 'January 2020', description: '', status: 'review', source: 'Page 1 · Experience', issue: 'End date differs from LinkedIn.', original: 'Software Engineer · Brightpath · Jan 2018 – December 2019' },
  ]},
  { id: 'education', title: 'Education', kind: 'entries', items: [
    { title: 'B.Sc. Computer Science', org: 'Sample University', start: '', end: '2017', description: '', status: 'accepted', source: 'Page 2 · Education', original: 'B.Sc. Computer Science · Sample University · 2017' },
  ]},
  { id: 'projects', title: 'Projects', kind: 'entries', items: [
    { title: 'TaskFlow Dashboard', org: 'Personal project', start: 'May 2025', end: 'Aug 2025', description: 'Built a lightweight dashboard for tracking team tasks and milestones.', url: 'https://github.com/ahaddad/taskflow', status: 'accepted', source: 'Page 2 · Projects', original: 'TaskFlow Dashboard · Personal project · May 2025 – Aug 2025' },
    { title: 'Portfolio Website', org: '', start: 'Sep 2025', end: 'Present', description: 'Personal portfolio and project showcase.', url: '', status: 'draft', source: 'Page 2 · Projects', issue: 'Add project details before accepting.', original: 'Portfolio Website · Sep 2025 – Present' },
  ]},
  { id: 'certs', title: 'Certifications', kind: 'fields', items: [
    { label: 'AWS Certified Cloud Practitioner', extracted: 'Amazon Web Services · Jun 2025', current: 'Amazon Web Services · Jun 2025', confidence: .91, status: 'accepted', evidence: 'Page 2, Certifications' },
    { label: 'Google Data Analytics Professional', extracted: 'Google · Jun 2025', current: 'Not added', confidence: .60, status: 'review', evidence: 'Page 2, Certifications', note: 'The issuing organization could not be confirmed from the source.' },
  ]},
  { id: 'links', title: 'Links', kind: 'links', items: [
    { label: 'My portfolio', url: 'https://amina-haddad.dev', valid: true, checked: false },
    { label: 'GitHub', url: 'https://github.com/ahaddad', valid: true, checked: true },
    { label: 'LinkedIn', url: 'https://linkedin.com/in/amina', valid: true, checked: true },
    { label: 'My work', url: 'amina-haddad.dev/work', valid: false, checked: false },
  ]},
]
