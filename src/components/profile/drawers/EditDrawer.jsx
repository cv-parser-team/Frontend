import { useState } from 'react';
import Drawer from './Drawer';
import DrawerFooter from './DrawerFooter';
import FieldInput from './FieldInput';
import SourceList from '../ui/SourceList';

// Generic edit drawer (profile, summary, experience, project, education, certification)
export default function EditDrawer({ title, sub, badge, note, rows, init = {}, item, onSave, onDelete, onClose, onViewSource, ok }) {
  const flat = rows.flat();
  const [v, setV] = useState(() => Object.fromEntries(flat.map(([k, , t]) =>
    [k, t === 'list' ? (init[k] || []).join(', ') : t === 'check' ? !!init[k] : init[k] ?? ''])));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k, x) => setV((p) => ({ ...p, [k]: x }));
  const valid = flat.every(([k, , , req]) => !req || String(v[k]).trim());
  const save = async () => {
    const out = Object.fromEntries(flat.map(([k, , t]) =>
      [k, t === 'list' ? v[k].split(',').map((s) => s.trim()).filter(Boolean) : typeof v[k] === 'string' ? v[k].trim() : v[k]]));
    if (out.current) out.end = '';
    setError('');
    setSaving(true);
    try {
      await onSave(out);
    } catch (saveError) {
      setError(saveError.message || 'Unable to save these changes.');
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    setError('');
    setSaving(true);
    try {
      await onDelete();
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete this entry.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Drawer title={title} sub={sub} badge={badge} onClose={onClose}
      footer={<DrawerFooter onCancel={onClose} onOk={save} disabled={!valid || saving}
        ok={saving ? 'Saving…' : ok}
        left={onDelete && <button className="btn danger" disabled={saving} onClick={remove}>Delete</button>} />}>
      {note}
      {error && <p className="err" role="alert">{error}</p>}
      {rows.map((r, i) => (
        <div key={i} className={r.length > 1 ? 'g2' : undefined}>
          {r.map((f) => <FieldInput key={f[0]} f={f} v={v} set={set} disabled={f[0] === 'end' && !!v.current} />)}
        </div>
      ))}
      {item?.sources?.length > 0 && (
        <div className="srcbox">
          <dl className="kv">
            <dt>Source</dt>
            <dd><SourceList ids={item.sources} /></dd>
            {item.conf && <><dt>Confidence</dt><dd>{item.conf}</dd></>}
          </dl>
          {onViewSource && !item.sources.includes('manual') && (
            <button className="btn ghost sm" onClick={() => onViewSource(item.sources[0])}>View source</button>
          )}
          <p className="hint">Original documents stay unchanged. Edits only affect your profile.</p>
        </div>
      )}
    </Drawer>
  );
}
