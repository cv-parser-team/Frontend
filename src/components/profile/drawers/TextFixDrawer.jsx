import { useState } from 'react';
import Drawer from './Drawer';
import DrawerFooter from './DrawerFooter';
import Badge from '../ui/Badge';
import Callout from '../ui/Callout';
import { SOURCES } from '../../../data/profileData';

export default function TextFixDrawer({ s, onClose, onSave, onKeep }) {
  const [v, setV] = useState(s.text);
  const sourceLabel = SOURCES[s.sources?.[0]]?.label || 'Candidate profile';
  return (
    <Drawer title="Check extracted text" sub={`${sourceLabel} · Professional Summary`} badge={<Badge>Extraction issue</Badge>} onClose={onClose}
      footer={<DrawerFooter ok="Save text" disabled={!v.trim() || v === s.text} onCancel={onClose} onOk={() => onSave(v.trim())}
        left={<button className="btn ghost" onClick={onKeep}>Keep as is</button>} />}>
      <Callout tone="red"><b>What happened:</b> the last sentence was cut off when your document was read. Finish it, or remove it.</Callout>
      <label className="fld"><span>Professional summary</span>
        <textarea className="in" rows={8} maxLength={700} value={v} onChange={(ev) => setV(ev.target.value)} />
        <small>{v.length}/700 characters</small>
      </label>
    </Drawer>
  );
}
