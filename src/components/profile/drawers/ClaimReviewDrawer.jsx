import { Fragment, useState } from 'react';
import Drawer from './Drawer';
import DrawerFooter from './DrawerFooter';
import Badge from '../ui/Badge';
import Callout from '../ui/Callout';

const HIDDEN_FIELDS = new Set([
  'id',
  '_version',
  'origin',
  'status',
  'sources',
  'current',
  'low',
  'conflict',
  'dup',
  'resolved',
]);

export default function ClaimReviewDrawer({ item, area, onClose, onReview }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fields = Object.entries(item)
    .filter(([name, value]) => !HIDDEN_FIELDS.has(name) && (typeof value === 'string' || Array.isArray(value)))
    .map(([name, value]) => [
      name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase()),
      Array.isArray(value) ? value.join(', ') : value,
    ])
    .filter(([, value]) => value);

  const decide = async (status) => {
    setError('');
    setSaving(true);
    try {
      await onReview(status);
    } catch (reviewError) {
      setError(reviewError.message || 'Unable to save the claim review.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={`Review ${area.toLowerCase()} item`}
      sub="Extracted from a source document"
      badge={<Badge tone="amber">Needs review</Badge>}
      onClose={onClose}
      footer={
        <DrawerFooter
          ok={saving ? 'Saving…' : 'Accept claim'}
          disabled={saving}
          onCancel={onClose}
          onOk={() => decide('accepted')}
          left={
            <button className="btn danger" disabled={saving} onClick={() => decide('rejected')}>
              Reject claim
            </button>
          }
        />
      }
    >
      <Callout tone="amber">
        Confirm that this extracted information is accurate. Rejected claims are
        excluded from your profile.
      </Callout>
      <dl className="kv">
        {fields.map(([label, value]) => (
          <Fragment key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </Fragment>
        ))}
      </dl>
      {error && <p className="err" role="alert">{error}</p>}
    </Drawer>
  );
}
