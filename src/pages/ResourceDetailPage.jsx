import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Search, ChevronDown, ChevronUp, GraduationCap, BriefcaseBusiness, Code2, Award, Languages, Rocket, ChevronsDown, ChevronsUp, Trash2, X } from 'lucide-react'
import { getMyClaims } from '../api/candidateApi'
import { deleteDocument, getDocument, SOURCE_UPLOADED_EVENT } from '../api/documentApi'
import { getMyExtractionReviewItems } from '../api/extractionApi'
import { ResourceBadge, ResourceStat, ResourceTypeIcon } from '../components/resources/ResourceUI'
import StatusBadge from '../components/profile/ui/StatusBadge'
import { fmtMonth, range } from '../data/profileData'
import '../css/profile.css'
import '../css/resources.css'

const claimGroups = [
  { id: 'education', title: 'Education', types: ['education'], Icon: GraduationCap },
  { id: 'experience', title: 'Work Experience', types: ['employment'], Icon: BriefcaseBusiness },
  { id: 'skills', title: 'Skills', types: ['skill'], Icon: Code2 },
  { id: 'languages', title: 'Languages', types: ['language'], Icon: Languages },
  { id: 'certifications', title: 'Certifications', types: ['certification'], Icon: Award },
  { id: 'projects', title: 'Projects', types: ['project'], Icon: Rocket },
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
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
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

  const allOpen = claimGroups.every(group => expanded[group.id])
  const openCount = claimGroups.filter(group => expanded[group.id]).length
  const goToSection = (id) => {
    const isOpen = !!expanded[id]
    setExpanded(previous => ({ ...previous, [id]: !isOpen }))

    if (!isOpen) {
      window.requestAnimationFrame(() => {
        window.document.getElementById(`sec-${id}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      })
    }
  }

  const handleDeleteSource = async () => {
    if (deleting) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteDocument(resourceId)
      window.dispatchEvent(new Event(SOURCE_UPLOADED_EVENT))
      setDeleteOpen(false)
      navigate('/sources', { replace: true })
    } catch (deleteRequestError) {
      setDeleteError(deleteRequestError.message || 'Failed to delete source.')
    } finally {
      setDeleting(false)
    }
  }

  return <main className="lumina-resource-page pf">
    <div className="wrap">
      <button className="lumina-resource-back" onClick={() => navigate('/sources')}><ArrowLeft size={16}/> All sources</button>
      <section className="lumina-resource-detail-hero card">
        <div className="lumina-resource-detail-title">
          <ResourceTypeIcon type={resourceType}/>
          <div><span className="lumina-resource-eyebrow">SOURCE DETAILS</span><h1>{document.originalFilename || 'Untitled document'}</h1><p>Added {formatDate(document.createdAt)} · {formatSize(document.byteSize)}</p></div>
        </div>
        <div className="lumina-resource-detail-actions">
          <ResourceBadge status={getStatus(document)}/>
          <button
            type="button"
            className="lumina-resource-delete-button"
            onClick={() => {
              setDeleteError('')
              setDeleteOpen(true)
            }}
            disabled={deleting}
          >
            <Trash2 size={16}/>
            Delete source
          </button>
        </div>
      </section>
      <div className="lumina-resource-stats detail">
        <ResourceStat label="Claims" value={claims.length}/>
        <ResourceStat label="Fields" value={stats.fields}/>
        <ResourceStat label="Pending review" value={stats.pending} tone="amber"/>
        <ResourceStat label="Rejected" value={stats.rejected} tone="red"/>
      </div>

      <nav className="nav" aria-label="Source detail sections">
        <div className="tabs">
          {claimGroups.map(group => {
            const count = claims.filter(claim => group.types.includes(claim.claimType)).length +
              reviewItems.filter(item => group.types.includes(item.claimType)).length
            const Icon = group.Icon
            return <button
              key={group.id}
              className={`tab${expanded[group.id] ? ' active' : ''}`}
              aria-pressed={expanded[group.id]}
              onClick={() => goToSection(group.id)}
            >
              <Icon size={16}/>{group.title}<span>{count}</span>
            </button>
          })}
        </div>
        <button className="tgl" onClick={() => setExpanded(Object.fromEntries(claimGroups.map(group => [group.id, !allOpen])))}>
          {allOpen ? <ChevronsUp size={16}/> : <ChevronsDown size={16}/>}
          {allOpen ? 'Collapse all' : 'Expand all'}<em>{openCount}/{claimGroups.length} open</em>
        </button>
      </nav>

      <div className="tools">
        <label className="search"><Search size={17}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search extracted values..."/></label>
        <div className="seg">
          {['All', 'Needs attention'].map(option => <button key={option} className={filter === option ? 'on' : ''} onClick={() => setFilter(option)}>{option}{option === 'Needs attention' ? ` (${needsAttention})` : ''}</button>)}
        </div>
      </div>

      <main className="secs">
        {claimGroups.map(group => {
          const groupClaims = claims.filter(claim => group.types.includes(claim.claimType))
          const visibleClaims = groupClaims.filter(matches)
          const groupReviewItems = reviewItems.filter(item =>
            group.types.includes(item.claimType) &&
            JSON.stringify(item.fields || {}).toLowerCase().includes(query.toLowerCase())
          )
          const groupItemCount = visibleClaims.length + groupReviewItems.length
          const open = !!expanded[group.id]
          const Icon = group.Icon

          return <section id={`sec-${group.id}`} className={`card sec${open ? '' : ' shut'}`} key={group.id}>
            <header className="sec-h">
              <button className="sec-t" aria-expanded={open} onClick={() => setExpanded(previous => ({ ...previous, [group.id]: !previous[group.id] }))}>
                <span className="sec-ic"><Icon size={20}/></span>
                <h2>{group.title}</h2>
                <span className="cnt">{groupItemCount}</span>
                {open ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
              </button>
            </header>
            {open && <div className={`sec-b${group.id === 'skills' ? ' chips' : ''}`}>
              {group.id === 'skills' ? visibleClaims.map(claim => {
                const skillName = formatValue(claim.values?.name ?? claim.values?.skill ?? '')
                return <span className="chip lumina-resource-read-chip" key={claim.claimId} title={skillName || 'Skill'}>
                  <span className="chip-label">{skillName || 'Unnamed skill'}</span>
                </span>
              }) : visibleClaims.map(claim => {
                const values = claim.values || {}
                let title = ''
                let meta = ''
                let desc = ''
                let tags = []
                let link = ''
                let badge = null

                if (claim.claimType === 'employment') {
                  title = formatValue(values.jobTitle)
                  meta = [
                    formatValue(values.employer),
                    range(values.startDate, values.endDate, !values.endDate),
                    formatValue(values.location),
                  ].filter(Boolean).join(' · ')
                  desc = formatValue(values.description)
                  tags = Array.isArray(values.skills) ? values.skills : []
                  badge = <StatusBadge resolved={claim.status === 'accepted' || claim.status === 'auto_accepted'} />
                } else if (claim.claimType === 'education') {
                  title = values.fieldOfStudy
                    ? `${formatValue(values.degree)} in ${formatValue(values.fieldOfStudy)}`
                    : formatValue(values.degree)
                  meta = [
                    formatValue(values.institution),
                    [formatValue(values.startDate), formatValue(values.endDate)].filter(Boolean).join(' – '),
                  ].filter(Boolean).join(' · ')
                  badge = <StatusBadge resolved={claim.status === 'accepted' || claim.status === 'auto_accepted'} />
                } else if (claim.claimType === 'project') {
                  title = formatValue(values.name)
                  meta = [
                    formatValue(values.role),
                    range(values.startDate, values.endDate, !values.endDate),
                  ].filter(Boolean).join(' · ')
                  desc = formatValue(values.description)
                  link = formatValue(values.url)
                  tags = Array.isArray(values.skills) ? values.skills : []
                } else if (claim.claimType === 'certification') {
                  title = formatValue(values.title)
                  meta = [
                    formatValue(values.issuer),
                    fmtMonth(values.issueDate),
                  ].filter(Boolean).join(' · ')
                } else if (claim.claimType === 'language') {
                  title = formatValue(values.name)
                  meta = formatValue(values.proficiency)
                }

                return (
                  <article className="row lumina-resource-profile-row" key={claim.claimId}>
                    <div>
                      {title && <h3>{title}</h3>}
                      {meta && <p className="meta">{meta}</p>}
                      {desc && <p>{desc}</p>}
                      {link && (
                        <a
                          href={/^https?:\/\//i.test(link) ? link : `https://${link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="lnk"
                        >
                          {link}
                        </a>
                      )}
                      {!!tags.length && (
                        <div className="tags sm">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                      )}
                    </div>
                    <div className="row-side">
                      {badge && <div className="row-top">{badge}</div>}
                    </div>
                  </article>
                )
              })}
              {groupReviewItems.map(item => group.id === 'skills'
                ? <span className="chip warn lumina-resource-read-chip" key={item.reviewItemId} title="Pending review">
                    <span className="chip-label">{getReviewFieldValues(item.fields)[0] || 'Unnamed skill'}</span>
                    <em className="mini">Needs Review</em>
                  </span>
                : <article className="row lumina-resource-profile-row" key={item.reviewItemId}>
                    <div>
                      <h3>{formatLabel(item.claimType)}</h3>
                      {getReviewFieldValues(item.fields).length > 0 && (
                        <p className="meta">{getReviewFieldValues(item.fields).join(' · ')}</p>
                      )}
                    </div>
                    <div className="row-side">
                      <div className="row-top"><span className="bd amber">Needs review</span></div>
                    </div>
                  </article>)}
              {!visibleClaims.length && !groupReviewItems.length && <p className="empty">{groupClaims.length ? 'No claims match this search or filter.' : 'No information in this section yet.'}</p>}
            </div>}
          </section>
        })}
      </main>
      {document.failureCode && <p className="lumina-resource-error">Processing issue: {document.failureCode}</p>}
    </div>
    {deleteOpen && (
      <div
        className="lumina-resource-delete-backdrop"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !deleting) setDeleteOpen(false)
        }}
      >
        <section
          className="lumina-resource-delete-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-resource-title"
        >
          <button
            type="button"
            className="lumina-resource-delete-modal-close"
            aria-label="Close confirmation"
            disabled={deleting}
            onClick={() => setDeleteOpen(false)}
          >
            <X size={18}/>
          </button>
          <span className="lumina-resource-delete-modal-icon"><Trash2 size={20}/></span>
          <h2 id="delete-resource-title">Delete source?</h2>
          <p>
            Delete <strong>{document.originalFilename || 'this source'}</strong>?
            This also removes its extracted claims and review data. This action cannot be undone.
          </p>
          {deleteError && <p className="lumina-resource-delete-error" role="alert">{deleteError}</p>}
          <div className="lumina-resource-delete-modal-actions">
            <button
              type="button"
              className="lumina-resource-delete-cancel"
              disabled={deleting}
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="lumina-resource-delete-confirm"
              disabled={deleting}
              onClick={handleDeleteSource}
            >
              <Trash2 size={14}/>
              {deleting ? 'Deleting...' : 'Delete source'}
            </button>
          </div>
        </section>
      </div>
    )}
  </main>
}
