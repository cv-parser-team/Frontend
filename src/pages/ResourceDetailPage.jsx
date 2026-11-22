import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Search, ChevronDown, ChevronRight, GraduationCap, BriefcaseBusiness, Code2, Award } from 'lucide-react'
import { getMyClaims } from '../api/candidateApi'
import { getDocument } from '../api/documentApi'
import { getMyExtractionReviewItems } from '../api/extractionApi'
import { ResourceBadge, ResourceStat, ResourceTypeIcon } from '../components/resources/ResourceUI'
import '../css/resources.css'

const claimGroups = [
  { id: 'education', title: 'Education', types: ['education'], Icon: GraduationCap },
  { id: 'experience', title: 'Work Experience', types: ['employment'], Icon: BriefcaseBusiness },
  { id: 'skills', title: 'Skills', types: ['skill', 'language'], Icon: Code2 },
  { id: 'certifications', title: 'Certifications', types: ['certification'], Icon: Award },
  { id: 'projects', title: 'Projects', types: ['project'], Icon: Code2 },
]

const fieldOrder = {
  education: ['degree', 'institution', 'fieldOfStudy', 'startDate', 'endDate'],
  employment: ['jobTitle', 'employer', 'startDate', 'endDate', 'description', 'location', 'skills'],
  skill: ['name'],
  language: ['name', 'proficiency'],
  certification: ['title', 'issuer', 'issueDate', 'expiryDate', 'credentialId'],
  project: ['name', 'role', 'startDate', 'endDate', 'description', 'url', 'skills'],
}

function formatSize(bytes) {
  if (!Number.isFinite(bytes)) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatLabel(value) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
}

function formatValue(value) {
  if (Array.isArray(value)) return value.join(', ')
  if (value && typeof value === 'object') return JSON.stringify(value)
  return value == null ? '' : String(value)
}

function getClaimsForDocument(claims, documentId) {
  return claims.filter(claim =>
    claim.extraction?.sourceDocumentId === documentId
  )
}

function getReviewFieldValues(fields) {
  return Object.values(fields || {}).map(field => {
    if (!field || typeof field !== 'object') return formatValue(field)
    return formatValue(field.value ?? field.raw)
  }).filter(Boolean)
}

function getStatus(document) {
  if (document.status === 'ready') return 'Processed'
  if (document.status === 'failed') return 'Failed'
  return 'Partial'
}

export default function ResourceDetailPage() {
  const { resourceId } = useParams()
  const navigate = useNavigate()
  const [document, setDocument] = useState(null)
  const [claims, setClaims] = useState([])
  const [reviewItems, setReviewItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [expanded, setExpanded] = useState(() =>
    Object.fromEntries(claimGroups.map(group => [group.id, true]))
  )

  useEffect(() => {
    let active = true

    async function loadResource() {
      setLoading(true)
      setError('')
      try {
        const [sourceDocument, allClaims, pendingReviewItems] = await Promise.all([
          getDocument(resourceId),
          getMyClaims(),
          getMyExtractionReviewItems(resourceId),
        ])
        if (active) {
          setDocument(sourceDocument)
          setClaims(getClaimsForDocument(allClaims, resourceId))
          setReviewItems(pendingReviewItems)
        }
      } catch (loadError) {
        if (active) setError(loadError.message || 'Failed to load source details.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadResource()
    return () => { active = false }
  }, [resourceId, reload])

  const stats = useMemo(() => ({
    fields: claims.reduce(
      (total, claim) => total + Object.keys(claim.values || {}).length,
      0
    ),
    pending: reviewItems.length,
    rejected: claims.filter(claim => claim.status === 'rejected').length,
  }), [claims, reviewItems])
  const reviewClaimIds = useMemo(() => new Set(
    reviewItems
      .filter(item => item.resolvedClaimId)
      .map(item => item.resolvedClaimId)
  ), [reviewItems])

  if (loading) {
    return <main className="lumina-resource-page"><p role="status">Loading source details...</p></main>
  }

  if (error) {
    return <main className="lumina-resource-page"><div className="lumina-resource-not-found" role="alert"><h1>Unable to load source</h1><p>{error}</p><button className="lumina-resource-btn primary" onClick={() => setReload(value => value + 1)}>Try again</button></div></main>
  }

  if (!document) {
    return <main className="lumina-resource-page"><div className="lumina-resource-not-found"><h1>Source not found</h1><p>This source may have been removed or the link is invalid.</p><button className="lumina-resource-btn primary" onClick={() => navigate('/sources')}><ArrowLeft size={15}/> Back to sources</button></div></main>
  }

  const resourceType = document.mediaType?.includes('pdf')
    ? 'PDF'
    : document.mediaType?.includes('word')
      ? 'DOCX'
      : document.mediaType?.startsWith('image/')
        ? 'Image'
        : 'File'
  const needsAttention = reviewItems.length
  const matches = claim => {
    const valuesMatch = JSON.stringify(claim.values || {})
      .toLowerCase()
      .includes(query.toLowerCase())
    const statusMatch = filter === 'All' || reviewClaimIds.has(claim.claimId)
    return valuesMatch && statusMatch
  }

  return <main className="lumina-resource-page">
    <button className="lumina-resource-back" onClick={() => navigate('/sources')}><ArrowLeft size={16}/> All sources</button>
    <section className="lumina-resource-detail-hero">
      <div className="lumina-resource-detail-title">
        <ResourceTypeIcon type={resourceType}/>
        <div><span className="lumina-resource-eyebrow">SOURCE DETAILS</span><h1>{document.originalFilename || 'Untitled document'}</h1><p>Added {formatDate(document.createdAt)} · {formatSize(document.byteSize)}</p></div>
      </div>
      <ResourceBadge status={getStatus(document)}/>
    </section>
    <div className="lumina-resource-stats detail">
      <ResourceStat label="Claims" value={claims.length}/>
      <ResourceStat label="Fields" value={stats.fields}/>
      <ResourceStat label="Pending review" value={stats.pending} tone="amber"/>
      <ResourceStat label="Rejected" value={stats.rejected} tone="red"/>
    </div>
    <section className="lumina-resource-panel lumina-resource-extracted">
      <div className="lumina-resource-panel-head"><div><h2>Extracted information</h2><p>Read-only information extracted from this source, grouped by profile section.</p></div><span className="lumina-resource-count">{claims.length} claims</span></div>
      <div className="lumina-resource-toolbar detail">
        <label className="lumina-resource-search"><Search size={17}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search values..."/></label>
        <div className="lumina-resource-filter-chips">
          {['All', 'Needs attention'].map(option => <button key={option} className={filter === option ? 'active' : ''} onClick={() => setFilter(option)}>{option}{option === 'Needs attention' ? ` (${needsAttention})` : ''}</button>)}
        </div>
        <button className="lumina-resource-expand" onClick={() => setExpanded(Object.fromEntries(claimGroups.map(group => [group.id, !claimGroups.every(item => expanded[item.id])])))}>
          {claimGroups.every(group => expanded[group.id]) ? 'Collapse all' : 'Expand all'}
        </button>
      </div>
      {claimGroups.map(group => {
        const groupClaims = claims.filter(claim => group.types.includes(claim.claimType))
        const visibleClaims = groupClaims.filter(matches)
        const groupReviewItems = reviewItems.filter(item =>
          group.types.includes(item.claimType) &&
          (JSON.stringify(item.fields || {}).toLowerCase().includes(query.toLowerCase()))
        )
        const groupItemCount = visibleClaims.length + groupReviewItems.length
        const open = !!expanded[group.id]
        const Icon = group.Icon

        return <section className="lumina-resource-accordion" key={group.id}>
          <button className="lumina-resource-accordion-head" aria-expanded={open} onClick={() => setExpanded(previous => ({ ...previous, [group.id]: !previous[group.id] }))}>
            <Icon size={19}/><strong>{group.title}</strong><span>{groupItemCount} {groupItemCount === 1 ? 'item' : 'items'}</span>
            {open ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
          </button>
          {open && <div className="lumina-resource-accordion-body">
            {visibleClaims.map(claim => {
              const keys = fieldOrder[claim.claimType] || Object.keys(claim.values || {})
              const fields = keys.filter(key =>
                Object.prototype.hasOwnProperty.call(claim.values || {}, key) &&
                formatValue(claim.values[key]).trim()
              )
              const primary = fields[0]
              const secondary = fields.slice(1)

              return <article className="lumina-resource-claim-card" key={claim.claimId}>
                <div className="lumina-resource-claim-heading">
                  {primary && <strong className="lumina-resource-claim-primary">{formatValue(claim.values[primary])}</strong>}
                </div>
                <div className="lumina-resource-claim-values">
                  {secondary.map(field => <span
                    className={`lumina-resource-claim-value${field === 'description' ? ' description' : ''}`}
                    key={field}
                  >{formatValue(claim.values[field])}</span>)}
                </div>
              </article>
            })}
            {groupReviewItems.map(item => <article className="lumina-resource-claim-card" key={item.reviewItemId}>
              <div className="lumina-resource-claim-heading">
                <strong className="lumina-resource-claim-primary">{formatLabel(item.claimType)}</strong>
              </div>
              <div className="lumina-resource-claim-values">
                {getReviewFieldValues(item.fields).map((value, index) => <span className="lumina-resource-claim-value" key={`${item.reviewItemId}-${index}`}>{value}</span>)}
              </div>
            </article>)}
            {!visibleClaims.length && !groupReviewItems.length && <p className="lumina-resource-empty">{groupClaims.length ? 'No claims match this search or filter.' : 'No information in this section yet.'}</p>}
          </div>}
        </section>
      })}
      {document.failureCode && <p className="lumina-resource-error">Processing issue: {document.failureCode}</p>}
    </section>
  </main>
}
