import { useMemo, useState } from 'react';
import { Check, FileText, GitMerge } from 'lucide-react';
import {
  buildProposalFieldMatrix,
  formatDisplayValue,
  getProposalClaims,
  toArray,
} from '../../../utils/coalesceUtils';
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

function claimSourceNames(claim) {
  if (Array.isArray(claim.documentNames) && claim.documentNames.length > 0) {
    return claim.documentNames;
  }
  if (claim.documentName) return [claim.documentName];
  return ['Source document'];
}

function initialSelections(proposal, matrix) {
  const selections = {};
  for (const field of matrix.fields) {
    const preferredValue = field.values[proposal.survivorClaimId];
    const firstValue = Object.entries(field.values).find(
      ([, value]) => value !== null && value !== undefined
    );
    const selected = preferredValue !== null && preferredValue !== undefined
      ? [proposal.survivorClaimId, preferredValue]
      : firstValue;
    selections[field.fieldName] = {
      source: field.requiresChoice ? selected?.[0] ?? null : 'auto',
      value: selected?.[1] ?? null,
    };
  }
  return selections;
}

function ClaimPreview({ claim, fields }) {
  return (
    <article className="auto-merge-preview">
      <header className="auto-merge-preview-head">
        <span className="auto-merge-source-icon"><FileText size={15} /></span>
        <div>
          {claimSourceNames(claim).map((name) => <h3 key={name}>{name}</h3>)}
          <small>Separate claim</small>
        </div>
      </header>
      <dl className="auto-merge-fields">
        {fields.map((field) => {
          const value = field.values[claim.claimId];
          if (value === null || value === undefined || value === '') return null;
          return (
            <div key={field.fieldName}>
              <dt>{fieldLabel(field.fieldName)}</dt>
              <dd>{formatDisplayValue(value)}</dd>
            </div>
          );
        })}
      </dl>
    </article>
  );
}

export default function SuspectedDuplicateDrawer({
  proposal,
  onClose,
  onResolve,
  onKeepSeparate,
}) {
  const matrix = useMemo(() => buildProposalFieldMatrix(proposal), [proposal]);
  const claims = useMemo(() => getProposalClaims(proposal), [proposal]);
  const [selections, setSelections] = useState(() => initialSelections(proposal, matrix));
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const choiceFields = matrix.fields.filter((field) => field.requiresChoice);

  const select = (fieldName, source, value) => {
    setSelections((current) => ({
      ...current,
      [fieldName]: { source, value },
    }));
  };

  const run = async (action, callback) => {
    setSaving(action);
    setError('');
    try {
      await callback();
    } catch (actionError) {
      setError(actionError.message || 'Unable to update these claims.');
      setSaving('');
    }
  };

  const confirmMerge = async () => {
    const values = {};
    for (const [field, selection] of Object.entries(selections)) {
      if (selection?.value !== null && selection?.value !== undefined) {
        if (!(field === 'endDate' && selection.value === 'Present')) {
          values[field] = selection.value;
        }
      }
    }

    const selectedEndDate = selections.endDate?.value;
    const current = selectedEndDate === 'Present'
      ? true
      : selectedEndDate != null
        ? false
        : proposal.proposedCurrent;
    const shared = {
      survivorClaimId: proposal.survivorClaimId || claims[0]?.claimId,
      values,
      ...(typeof current === 'boolean' ? { current } : {}),
    };
    const action = claims.length > 2
      ? {
          action: 'merge_claim_group',
          claims: claims.map(({ claimId, version }) => ({ claimId, version })),
          ...shared,
        }
      : {
          action: 'merge_claims',
          leftClaimId: claims[0]?.claimId,
          rightClaimId: claims[1]?.claimId,
          leftVersion: claims[0]?.version,
          rightVersion: claims[1]?.version,
          ...shared,
        };
    await onResolve(action);
  };

  return (
    <Drawer
      title="Review suspected duplicates"
      sub={`${claims.length} separate ${claims.length === 1 ? 'claim' : 'claims'}`}
      onClose={onClose}
      footer={<>
        <button
          type="button"
          className="btn ghost"
          disabled={Boolean(saving)}
          onClick={() => run('separate', onKeepSeparate)}
        >
          {saving === 'separate' ? 'Saving…' : 'Keep separate'}
        </button>
        <button
          type="button"
          className="btn pri"
          disabled={Boolean(saving) || claims.length < 2}
          onClick={() => run('confirm', confirmMerge)}
        >
          <Check size={15} />
          {saving === 'confirm' ? 'Merging…' : 'Confirm merge'}
        </button>
      </>}
    >
      <div className="callout amber auto-merge-explanation">
        <GitMerge size={17} aria-hidden="true" />
        <span>These claims look alike. Compare each original claim before deciding whether to merge them.</span>
      </div>
      {error && <p className="err" role="alert">{error}</p>}
      <div className="auto-merge-previews">
        {claims.map((claim) => (
          <ClaimPreview key={claim.claimId} claim={claim} fields={matrix.fields} />
        ))}
      </div>

      {choiceFields.length > 0 && (
        <section className="suspected-merge-choices">
          <div>
            <h3>Choose values for the merged claim</h3>
            <p className="hint">Differences must be resolved before the claims are combined.</p>
          </div>
          {choiceFields.map((field) => {
            const combined = [...new Set(
              claims.flatMap((claim) => toArray(field.values[claim.claimId]))
            )];
            return (
              <fieldset key={field.fieldName} disabled={Boolean(saving)}>
                <legend>{fieldLabel(field.fieldName)}</legend>
                {claims.map((claim) => {
                  const value = field.values[claim.claimId];
                  if (value === null || value === undefined) return null;
                  const selected = selections[field.fieldName]?.source === claim.claimId;
                  return (
                    <label className={`opt ${selected ? 'on' : ''}`} key={claim.claimId}>
                      <input
                        type="radio"
                        name={`duplicate-${field.fieldName}`}
                        checked={selected}
                        onChange={() => select(field.fieldName, claim.claimId, value)}
                      />
                      <div>
                        <b>{formatDisplayValue(value)}</b>
                        <small>{claimSourceNames(claim).join(', ')}</small>
                      </div>
                    </label>
                  );
                })}
                {field.isArrayField && combined.length > 0 && (
                  <label className={`opt ${selections[field.fieldName]?.source === 'combined' ? 'on' : ''}`}>
                    <input
                      type="radio"
                      name={`duplicate-${field.fieldName}`}
                      checked={selections[field.fieldName]?.source === 'combined'}
                      onChange={() => select(field.fieldName, 'combined', combined)}
                    />
                    <div><b>{formatDisplayValue(combined)}</b><small>Combine all values</small></div>
                  </label>
                )}
              </fieldset>
            );
          })}
        </section>
      )}
    </Drawer>
  );
}
