import { FileText, Image, Link2, File, UserRound, Code2, BriefcaseBusiness, GraduationCap, Award } from 'lucide-react'

export const sectionIcons = { personal: UserRound, skills: Code2, experience: BriefcaseBusiness, education: GraduationCap, projects: Code2, certs: Award, links: Link2 }
export function ResourceBadge({ status }) {
  const map = { accepted: ['Accepted','success'], merged: ['Merged','merged'], review: ['Needs review','warning'], pending: ['Pending','neutral'], draft: ['Draft','neutral'], rejected: ['Invalid','danger'], Processed: ['Processed','success'], Partial: ['Partial','warning'], Failed: ['Failed','danger'] }
  const [label, tone] = map[status] || [status || 'Unknown','neutral']
  return <span className={`lumina-resource-badge ${tone}`}>{label}</span>
}
export function ResourceTypeIcon({ type }) {
  const Icon = type === 'Image' ? Image : type === 'Link' ? Link2 : type === 'PDF' ? FileText : File
  return <span className="lumina-resource-file-icon"><Icon size={19}/></span>
}
export function ResourceStat({ label, value, tone = '' }) {
  return <div className={`lumina-resource-stat ${tone}`}><span>{label}</span><strong>{value}</strong></div>
}
