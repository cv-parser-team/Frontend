import { useEffect, useMemo, useState } from 'react'
import { Search, ArrowUpRight, SlidersHorizontal, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getMyClaims } from '../api/candidateApi'
import { getDocuments } from '../api/documentApi'
import { getMyExtractionReviewItems } from '../api/extractionApi'
import { ResourceBadge, ResourceStat, ResourceTypeIcon } from '../components/resources/ResourceUI'
import '../css/resources.css'

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

function getFileType(document) {
  const mediaType = document.mediaType || ''
  if (mediaType.includes('pdf')) return 'PDF'
  if (mediaType.includes('word')) return 'DOCX'
  if (mediaType.startsWith('image/')) return 'Image'
  return document.originalFilename?.split('.').pop()?.toUpperCase() || 'File'
}

function getClaimIssues(claims, reviewItems) {
  const pending = reviewItems.length
  const rejected = claims.filter(claim => claim.status === 'rejected').length
  return [
    pending > 0 && `${pending} needs review`,
    rejected > 0 && `${rejected} rejected`,
  ].filter(Boolean).join(', ')
}

function normalizeDocument(document, claims, reviewItems) {
  const status = document.status === 'ready'
    ? 'Processed'
    : document.status === 'failed'
      ? 'Failed'
      : 'Partial'
  const fields = claims.reduce(
    (total, claim) => total + Object.keys(claim.values || {}).length,
    0
  )
  const claimIssues = getClaimIssues(claims, reviewItems)

  return {
    id: document.documentId,
    name: document.originalFilename || 'Untitled document',
    type: getFileType(document),
    added: formatDate(document.createdAt),
    size: formatSize(document.byteSize),
    status,
    fields,
    claims: claims.length,
    issues: [document.failureCode, claimIssues].filter(Boolean).join(', ') || '—',
  }
}

export default function ResourcesPage() {
  const navigate = useNavigate()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')

  useEffect(() => {
    let active = true

    async function loadResources() {
      setLoading(true)
      setError('')
      try {
        const [documents, claims, reviewItems] = await Promise.all([
          getDocuments(),
          getMyClaims(),
          getMyExtractionReviewItems(),
        ])
        if (active) {
          setResources(documents
            .filter(document => document.documentId)
            .map(document => {
              const documentClaims = claims.filter(claim =>
                claim.extraction?.sourceDocumentId === document.documentId
              )
              const documentReviewItems = reviewItems.filter(item =>
                item.documentId === document.documentId
              )
              return normalizeDocument(document, documentClaims, documentReviewItems)
            }))
        }
      } catch (loadError) {
        if (active) setError(loadError.message || 'Failed to load sources.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadResources()
    return () => { active = false }
  }, [reload])

  const filtered = useMemo(() => resources.filter(item => {
    const matchesQuery = `${item.name} ${item.type}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (status === 'All' || item.status === status)
  }), [resources, query, status])
  const processed = resources.filter(item => item.status === 'Processed').length
  const partial = resources.filter(item => item.status === 'Partial').length
  const failed = resources.filter(item => item.status === 'Failed').length

  return <main className="lumina-resource-page">
    <div className="lumina-resource-page-heading"><div><span className="lumina-resource-eyebrow">PROFILE DATA</span><h1>Sources</h1><p>Manage the documents and connected profiles used to build your candidate profile.</p></div><button className="lumina-resource-btn primary" onClick={() => navigate('/upload')}><Plus size={16}/> Add source</button></div>
    <div className="lumina-resource-stats"><ResourceStat label="Total sources" value={resources.length}/><ResourceStat label="Processed" value={processed} tone="green"/><ResourceStat label="Partial" value={partial} tone="amber"/><ResourceStat label="Failed" value={failed} tone="red"/></div>
    <section className="lumina-resource-panel">
      <div className="lumina-resource-panel-head"><div><h2>Your sources</h2><p>Open a source to review the information extracted from it.</p></div><span className="lumina-resource-count">{filtered.length} sources</span></div>
      <div className="lumina-resource-toolbar"><label className="lumina-resource-search"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search sources..."/></label><label className="lumina-resource-select"><SlidersHorizontal size={15}/><select value={status} onChange={e => setStatus(e.target.value)}><option>All</option><option>Processed</option><option>Partial</option><option>Failed</option></select></label></div>
      <div className="lumina-resource-table-wrap"><table className="lumina-resource-table"><thead><tr><th>Source</th><th>Type</th><th>Date added</th><th>Status</th><th>Fields</th><th>Issues</th><th/></tr></thead><tbody>
        {loading && <tr><td colSpan="7" className="lumina-resource-empty">Loading sources...</td></tr>}
        {!loading && error && <tr><td colSpan="7" className="lumina-resource-empty" role="alert">{error} <button className="lumina-resource-inline-link" onClick={() => setReload(value => value + 1)}>Try again</button></td></tr>}
        {!loading && !error && filtered.map(item => <tr key={item.id} onClick={() => navigate(`/sources/${encodeURIComponent(item.id)}`)} className="lumina-resource-row"><td><div className="lumina-resource-name"><ResourceTypeIcon type={item.type}/><div><strong>{item.name}</strong><small>{item.size}</small></div></div></td><td>{item.type}</td><td>{item.added}</td><td><ResourceBadge status={item.status}/></td><td>{item.fields} fields<small className="lumina-resource-field-count">{item.claims} claims</small></td><td>{item.issues}</td><td><ArrowUpRight size={17}/></td></tr>)}
        {!loading && !error && !filtered.length && <tr><td colSpan="7" className="lumina-resource-empty">No sources found. Try another search or filter.</td></tr>}
      </tbody></table></div>
    </section>
    <p className="lumina-resource-footnote">Source records and processing statuses are loaded from your account.</p>
  </main>
}
