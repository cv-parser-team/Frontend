import { useMemo, useState } from 'react';
import { Check, FileText, GitMerge, Undo2 } from 'lucide-react';
import { SOURCES } from '../../../data/profileData';
import Drawer from './Drawer';

const FIELD_LABELS = {
  employer: 'Employer',
  jobTitle: 'Job title',
  institution: 'Institution',
  degree: 'Degree',
  fieldOfStudy: 'Field of study',
  title: 'Title',
  issuer: 'Issuer',
  name: 'Name',
  proficiency: 'Proficiency',
  role: 'Role',
  description: 'Description',
  url: 'URL',
  startDate: 'Start date',
  endDate: 'End date',
  issueDate: 'Issue date',
  expiryDate: 'Expiry date',
  credentialId: 'Credential ID',
  location: 'Location',
  skills: 'Skills',
};

function fieldLabel(field) {
  return FIELD_LABELS[field] || field
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/^./, (character) => character.toUpperCase());
}

function valueText(value) {
  return Array.isArray(value) ? value.join(', ') : String(value);
}

function sourceNames(claim) {
  const ids = [
    claim.sourceDocumentId,
    ...(claim.sources ?? []).map((source) => source.documentId),
  ].filter(Boolean);
  const names = [...new Set(ids.map((id) => SOURCES[id]?.label).filter(Boolean))];
  if (names.length > 0) return names;
  return [claim.origin === 'manual' ? 'Manually entered' : 'Source document'];
}

function originalClaims(notices) {
  const claims = new Map();
  for (const notice of [...notices].reverse()) {
    for (const claim of notice.claimsBefore ?? []) {
      if (!claims.has(claim.claimId)) claims.set(claim.claimId, claim);
    }
  }
  return [...claims.values()];
}

function ClaimPreview({ claim }) {
  const names = sourceNames(claim);
  const fields = Object.entries(claim.values ?? {}).filter(
    ([, value]) => value !== '' && value != null && (!Array.isArray(value) || value.length > 0)
  );

  return (
    <article className="auto-merge-preview">
      <header className="auto-merge-preview-head">
        <span className="auto-merge-source-icon"><FileText size={15} /></span>
        <div>
          {names.map((name) => <h3 key={name}>{name}</h3>)}
          <small>Original claim</small>
        </div>
      </header>
      <dl className="auto-merge-fields">
        {fields.map(([field, value]) => (
          <div key={field}>
            <dt>{fieldLabel(field)}</dt>
            <dd>{valueText(value)}</dd>
          </div>
        ))}
        {claim.current && <div><dt>Status</dt><dd>Present</dd></div>}
      </dl>
    </article>
  );
}

export default function AutoMergeReviewDrawer({
  item,
  onClose,
  onConfirm,
  onKeepSeparate,
}) {
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const claims = useMemo(
    () => originalClaims(item?.mergeNotices ?? []),
    [item?.mergeNotices]
  );
  const messages = (item?.mergeNotices ?? [])
    .flatMap((notice) => notice.messages ?? [])
    .filter(Boolean);

  const run = async (action, callback) => {
    setSaving(action);
    setError('');
    try {
      await callback();
    } catch (actionError) {
      setError(actionError.message || 'Unable to update this automatic merge.');
      setSaving('');
    }
  };

  return (
    <Drawer
      title="Review automatic merge"
      sub={`${claims.length || 'Multiple'} original ${claims.length === 1 ? 'claim' : 'claims'}`}
      onClose={onClose}
      footer={<>
        <button
          className="btn ghost"
          disabled={Boolean(saving) || claims.length === 0}
          onClick={() => run('separate', onKeepSeparate)}
        >
          <Undo2 size={15} />
          {saving === 'separate' ? 'Restoring…' : 'Keep separate'}
        </button>
        <button
          className="btn pri"
          disabled={Boolean(saving)}
          onClick={() => run('confirm', onConfirm)}
        >
          <Check size={15} />
          {saving === 'confirm' ? 'Confirming…' : 'Confirm merge'}
        </button>
      </>}
    >
      <div className="callout amber auto-merge-explanation">
        <GitMerge size={17} aria-hidden="true" />
        <span>{messages.join(' · ') || 'These claims matched and were combined automatically.'}</span>
      </div>
      <p className="hint">Compare the original claims and their named sources before confirming.</p>
      {error && <p className="err" role="alert">{error}</p>}
      {claims.length > 0 ? (
        <div className="auto-merge-previews">
          {claims.map((claim) => <ClaimPreview key={claim.claimId} claim={claim} />)}
        </div>
      ) : (
        <div className="auto-merge-preview">
          <p className="hint">Original previews are unavailable for this older automatic merge. You can still confirm it.</p>
        </div>
      )}
    </Drawer>
  );
}
