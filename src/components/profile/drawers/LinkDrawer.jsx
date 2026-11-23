import { useState } from 'react';
import Drawer from './Drawer';
import DrawerFooter from './DrawerFooter';
import Badge from '../ui/Badge';
import Callout from '../ui/Callout';
import { isBadLink } from '../../../data/profileData';

export default function LinkDrawer({ p, onClose, onSave, onRemove }) {
  const [v, setV] = useState(p.link);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const t = v.trim();
  const fixed = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  const bad = isBadLink(t);
  const save = async (action) => {
    setError('');
    setSaving(true);
    try {
      await action();
    } catch (saveError) {
      setError(saveError.message || 'Unable to save the project link.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Drawer title="Fix link" sub={p.name} badge={<Badge tone="red">Invalid link</Badge>} onClose={onClose}
      footer={<DrawerFooter ok={saving ? 'Saving…' : 'Save link'} disabled={saving || !t || bad} onCancel={onClose} onOk={() => save(() => onSave(fixed))}
        left={<button className="btn danger" disabled={saving} onClick={() => save(onRemove)}>Remove link</button>} />}>
      <Callout tone="red"><b>What’s wrong:</b> “{p.link}” is missing “https://”, so it can’t be opened.</Callout>
      <label className="fld"><span>Project link</span><input className="in" autoFocus value={v} onChange={(ev) => setV(ev.target.value)} /></label>
      {bad && !isBadLink(fixed) && <button className="btn ghost sm" onClick={() => setV(fixed)}>Use {fixed}</button>}
      {error && <p className="err" role="alert">{error}</p>}
      <p className="hint">We only check that a link is well-formed. We never open it for you.</p>
    </Drawer>
  );
}
