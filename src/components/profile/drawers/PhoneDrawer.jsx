import { useState } from 'react';
import Drawer from './Drawer';
import DrawerFooter from './DrawerFooter';
import Badge from '../ui/Badge';
import Callout from '../ui/Callout';
import PhoneField from './PhoneField';

export default function PhoneDrawer({ phone = '', onClose, onSave }) {
  const [v, setV] = useState(phone);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async (action) => {
    setError('');
    setSaving(true);
    try {
      await action();
    } catch (saveError) {
      setError(saveError.message || 'Unable to save the phone number.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Drawer
      title="Add phone number"
      sub="Contact details"
      badge={<Badge tone="blue">Missing information</Badge>}
      onClose={onClose}
      footer={
        <DrawerFooter
          ok={saving ? 'Saving…' : 'Save phone number'}
          disabled={saving || !/^\+?[\d\s()-]{7,}$/.test(v.trim())}
          onCancel={onClose}
          onOk={() => save(() => onSave(v.trim()))}
        />
      }
    >
      <Callout tone="blue"><b>Optional:</b> a phone number helps recruiters reach you faster.</Callout>
      {error && <p className="err" role="alert">{error}</p>}
      <PhoneField value={phone} onChange={setV} autoFocus />
    </Drawer>
  );
}
