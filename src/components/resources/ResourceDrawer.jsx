import { useEffect, useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { LANGUAGE_PROFICIENCY_LEVELS as proficiencyLevels } from '../../constants/config'
const months = [
  ['01', 'January'], ['02', 'February'], ['03', 'March'], ['04', 'April'],
  ['05', 'May'], ['06', 'June'], ['07', 'July'], ['08', 'August'],
  ['09', 'September'], ['10', 'October'], ['11', 'November'], ['12', 'December'],
]
const currentYear = new Date().getFullYear()
const years = Array.from(
  { length: currentYear + 10 - 1900 + 1 },
  (_, index) => String(currentYear + 10 - index)
)

export default function ResourceDrawer({ record, onClose, onSave, onDelete }) {
  const { item, kind, sectionId } = record
  const [value, setValue] = useState(kind === 'field' ? item.current : kind === 'link' ? item.url : item.title || '')
  const [dateYear, setDateYear] = useState(item.valueType === 'date' ? item.current.slice(0, 4) : '')
  const [dateMonth, setDateMonth] = useState(item.valueType === 'date' ? item.current.slice(5, 7) : '')
  const [org, setOrg] = useState(item.org || '')
  const [start, setStart] = useState(item.start || '')
  const [end, setEnd] = useState(item.end || '')
  const [description, setDescription] = useState(item.description || '')
  const [url, setUrl] = useState(item.url || '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const isEntry = kind === 'entry'
  const isLink = kind === 'link'
  const editedValue = item.valueType === 'date'
    ? dateYear ? dateMonth ? `${dateYear}-${dateMonth}` : dateYear : ''
    : value

  useEffect(() => {
    const handleKey = event => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const save = async (accept = true) => {
    if (item.required && !editedValue.trim()) return setError('Please enter a value before saving.')
    if (isLink && !/^https?:\/\/[^\s.]+(?:\.[^\s.]+)+/i.test(value)) return setError('Enter a complete URL starting with https://.')
    if (isEntry && sectionId !== 'projects' && !org.trim()) return setError('Please complete the organization or employer field.')
    if (isEntry && url && !/^https?:\/\/[^\s.]+(?:\.[^\s.]+)+/i.test(url)) return setError('Enter a valid project URL.')
    setError('')
    setSaving(true)
    try {
      await onSave(isEntry ? { title: value, org, start, end, description, url, status: accept ? 'accepted' : 'draft' } : isLink ? { url: value, valid: true } : { current: editedValue, status: 'accepted' })
    } catch (saveError) {
      setError(saveError.message || 'Unable to save this field.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="lumina-resource-overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <aside className="lumina-resource-drawer" role="dialog" aria-modal="true" aria-label="Edit source item">
      <header className="lumina-resource-drawer-head"><div><span className="lumina-resource-eyebrow">SOURCE REVIEW</span><h2>{isEntry ? `Review ${sectionId}` : item.label}</h2><p>{record.sourceName || 'Source document'} · Original source remains unchanged</p></div><button className="lumina-resource-icon-btn" onClick={onClose} aria-label="Close" disabled={saving}><X size={19}/></button></header>
      <div className="lumina-resource-drawer-content">
        {isEntry ? <>
          <label className="lumina-resource-label">{sectionId === 'education' ? 'Degree' : sectionId === 'projects' ? 'Project name' : 'Job title'}<input value={value} onChange={e => setValue(e.target.value)}/></label>
          <label className="lumina-resource-label">{sectionId === 'education' ? 'Institution' : sectionId === 'projects' ? 'Organization / role' : 'Employer'}<input value={org} onChange={e => setOrg(e.target.value)}/></label>
          <div className="lumina-resource-two-col"><label className="lumina-resource-label">Start date<input value={start} onChange={e => setStart(e.target.value)}/></label><label className="lumina-resource-label">End date<input value={end} onChange={e => setEnd(e.target.value)}/></label></div>
          {sectionId === 'projects' && <label className="lumina-resource-label">Project URL<input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://"/></label>}
          <label className="lumina-resource-label">Description<textarea rows="4" value={description} onChange={e => setDescription(e.target.value)}/></label>
        </> : item.valueType === 'date'
          ? <div>
            <span className="lumina-resource-label">{item.label}</span>
            <div className="lumina-resource-two-col">
              <label className="lumina-resource-label">Year<select value={dateYear} onChange={event => { setDateYear(event.target.value); if (!event.target.value) setDateMonth('') }}>
                <option value="">Select year</option>
                {!years.includes(dateYear) && dateYear && <option value={dateYear}>{dateYear}</option>}
                {years.map(year => <option value={year} key={year}>{year}</option>)}
              </select></label>
              <label className="lumina-resource-label">Month<select value={dateMonth} onChange={event => setDateMonth(event.target.value)} disabled={!dateYear}>
                <option value="">Year only</option>
                {months.map(([month, label]) => <option value={month} key={month}>{label}</option>)}
              </select></label>
            </div>
          </div>
          : item.valueType === 'proficiency'
            ? <label className="lumina-resource-label">{item.label}<select value={value} onChange={event => setValue(event.target.value)}>
              <option value="">Select a level</option>
              {value && !proficiencyLevels.includes(value) && <option value={value}>{value}</option>}
              {proficiencyLevels.map(level => <option value={level} key={level}>{level}</option>)}
            </select></label>
            : <label className="lumina-resource-label">{isLink ? 'URL' : item.label || 'Profile value'}{item.multiline
              ? <textarea rows="5" value={value} onChange={e => setValue(e.target.value)}/>
              : <input value={value} onChange={e => setValue(e.target.value)}/>}</label>}
        {error && <p className="lumina-resource-error">{error}</p>}
        {item.note && <p className="lumina-resource-note"><AlertTriangle size={15}/>{item.note}</p>}
        <div className="lumina-resource-original"><span>ORIGINAL SOURCE VALUE</span><p>{kind === 'field' ? item.extracted : kind === 'link' ? item.url : item.original || item.title}</p><small>{item.evidence || item.source || 'Source document'}</small></div>
      </div>
      <footer className="lumina-resource-drawer-foot">{onDelete && <button className="lumina-resource-delete" onClick={() => { if (window.confirm('Delete this item?')) onDelete() }}>Delete item</button>}<div><button className="lumina-resource-btn" onClick={onClose} disabled={saving}>Cancel</button>{isEntry && <button className="lumina-resource-btn" onClick={() => save(false)} disabled={saving}>Save draft</button>}<button className="lumina-resource-btn primary" onClick={() => save(true)} disabled={saving}>{saving ? 'Saving...' : isEntry ? 'Accept entry' : 'Save changes'}</button></div></footer>
    </aside>
  </div>
}
