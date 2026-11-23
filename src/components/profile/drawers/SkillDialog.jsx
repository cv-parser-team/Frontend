import { useState } from 'react';
import useModal from '../../../hooks/useModal';

export default function SkillDialog({ onClose, onAdd, taken }) {
  useModal(onClose);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const n = name.trim();
  const dup = taken(n);
  const submit = async () => {
    if (!n || dup || saving) return;
    setError('');
    setSaving(true);
    try {
      await onAdd(n);
    } catch (saveError) {
      setError(saveError.message || 'Unable to add this skill.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="ov mid" onMouseDown={onClose}>
      <div className="dlg" role="dialog" aria-modal="true" aria-label="Add skill" onMouseDown={(e) => e.stopPropagation()}>
        <h2>Add skill</h2>
        <label className="fld"><span>Skill name <b>*</b></span>
          <input className="in" autoFocus placeholder="e.g. GraphQL" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </label>
        {dup && <p className="err">This skill is already on your profile.</p>}
        {error && <p className="err" role="alert">{error}</p>}
        <div className="dr-f-r">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn pri" disabled={!n || dup || saving} onClick={submit}>{saving ? 'Saving…' : 'Add'}</button>
        </div>
      </div>
    </div>
  );
}
