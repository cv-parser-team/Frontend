import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import FieldComparisonTable from './FieldComparisonTable';
import {
  buildProposalFieldMatrix,
  extractRawValue,
  getProposalClaims,
} from '../../utils/coalesceUtils';
import './CoalescenceModal.css';

const CLAIM_TYPE_LABELS = {
  employment: 'Work experience',
  education: 'Education',
  project: 'Project',
  certification: 'Certification',
  skill: 'Skill',
  language: 'Language',
};

// The fields that name an entry of each type, joined for the title.
const TITLE_FIELDS = {
  employment: ['jobTitle', 'employer'],
  education: ['degree', 'institution'],
  certification: ['title', 'issuer'],
};

// A field's value as the proposal states it: the shared value, or the first
// side's when the copies differ.
function proposalFieldValue(proposal, field) {
  const comparison = proposal.fields?.[field];
  return extractRawValue(comparison?.value ?? comparison?.left);
}

function proposalTitle(proposal) {
  const fields = TITLE_FIELDS[proposal.claimType] || ['name'];
  return fields
    .map((field) => proposalFieldValue(proposal, field))
    .filter((value) => typeof value === 'string' && value)
    .join(' · ');
}

function computeInitialSelections(proposal) {
  if (!proposal) return {};
  const matrix = buildProposalFieldMatrix(proposal);
  const initial = {};
  for (const field of matrix.fields) {
    const preferredValue = field.values[proposal.survivorClaimId];
    const firstValueEntry = Object.entries(field.values).find(
      ([, value]) => value !== null && value !== undefined
    );
    const selectedEntry =
      preferredValue !== null && preferredValue !== undefined
        ? [proposal.survivorClaimId, preferredValue]
        : firstValueEntry;
    initial[field.fieldName] = field.requiresChoice
      ? { source: selectedEntry?.[0] || null, value: selectedEntry?.[1] ?? null }
      : { source: 'auto', value: selectedEntry?.[1] ?? null };
  }

  return initial;
}

function CoalescenceModalContent({
  proposal,
  onClose,
  onResolve,
  onMarkDifferent,
}) {
  const [fieldSelections, setFieldSelections] = useState(() =>
    computeInitialSelections(proposal)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const claims = getProposalClaims(proposal);

  const categoryLabel = CLAIM_TYPE_LABELS[proposal.claimType] || 'Profile entry';
  const entityTitle = proposalTitle(proposal) || 'Duplicate entries';

  const choiceFields = buildProposalFieldMatrix(proposal).fields
    .filter((field) => field.requiresChoice)
    .map((field) => field.fieldName);
  const remainingChoices = choiceFields.filter(
    (field) => !fieldSelections[field] || fieldSelections[field].source == null
  ).length;
  const hasUnresolvedChoices = choiceFields.some(
    (field) => !fieldSelections[field] || fieldSelections[field].source == null
  );

  const handleSelectField = (fieldName, source, value) => {
    setFieldSelections((prev) => ({
      ...prev,
      [fieldName]: { source, value },
    }));
  };

  const handleMergeSubmit = async () => {
    if (hasUnresolvedChoices) {
      setErrorMessage('Please select an option for every conflicting field.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const values = {};
      for (const [field, selection] of Object.entries(fieldSelections)) {
        if (
          selection &&
          selection.value !== undefined &&
          selection.value !== null
        ) {
          if (!(field === 'endDate' && selection.value === 'Present')) {
            values[field] = selection.value;
          }
        }
      }

      const endDateSelection = fieldSelections.endDate?.value;
      const current =
        endDateSelection === 'Present'
          ? true
          : endDateSelection != null
            ? false
            : proposal.proposedCurrent;
      const sharedAction = {
        survivorClaimId: proposal.survivorClaimId || claims[0]?.claimId,
        values,
        ...(typeof current === 'boolean' ? { current } : {}),
      };
      const batchAction =
        claims.length > 2
          ? {
              action: 'merge_claim_group',
              claims: claims.map(({ claimId, version }) => ({ claimId, version })),
              ...sharedAction,
            }
          : {
              action: 'merge_claims',
              leftClaimId: claims[0]?.claimId,
              rightClaimId: claims[1]?.claimId,
              leftVersion: claims[0]?.version,
              rightVersion: claims[1]?.version,
              ...sharedAction,
            };

      if (onResolve) {
        await onResolve(batchAction);
      }
      if (onClose) {
        onClose();
      }
    } catch (err) {
      const isConflict =
        err?.status === 409 ||
        err?.code === 'CONFLICT' ||
        /conflict/i.test(err?.message || '');
      if (isConflict) {
        setErrorMessage(
          err.message ||
            'Version conflict: one or more claims were modified in another session. Please refresh your profile and try again.'
        );
      } else {
        setErrorMessage(err.message || 'Failed to apply claim merge.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkDifferentClick = async () => {
    if (!onMarkDifferent) return;
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await onMarkDifferent(claims[0], claims[1]);
      if (onClose) {
        onClose();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to mark claims as different.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="coalesce-modal" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <header className="coalesce-modal-header">
        <h2 className="coalesce-modal-title">Resolve duplicate record</h2>
        <p className="coalesce-modal-subtitle">
          {categoryLabel} · {entityTitle}
        </p>
        <p className="coalesce-modal-instruction">
          Choose the value to keep for each difference.
        </p>
        <button
          type="button"
          className="coalesce-modal-close"
          onClick={onClose}
          aria-label="Close comparison"
        >
          <X size={18} />
        </button>
      </header>

      {/* Body */}
      <div className="coalesce-modal-body">
        <div className="coalesce-sources-bar">
          {claims.map((claim, index) => (
            <span key={claim.claimId}>
              {claim.documentName || `Source ${index + 1}`}
            </span>
          ))}
          <span className="coalesce-choice-progress">
            {remainingChoices
              ? `${remainingChoices} ${remainingChoices === 1 ? 'choice' : 'choices'} remaining`
              : 'Ready to merge'}
          </span>
        </div>

        {errorMessage && (
          <div className="coalesce-error-box">{errorMessage}</div>
        )}

        {/* Table Component */}
        <FieldComparisonTable
          proposal={proposal}
          fieldSelections={fieldSelections}
          onSelectField={handleSelectField}
          readOnly={isSubmitting}
        />
      </div>

      {/* Footer */}
      <footer className="coalesce-modal-footer">
        <div className="coalesce-footer-actions">
          {onMarkDifferent && claims.length === 2 && (
            <button
              type="button"
              className="coalesce-different-btn"
              onClick={handleMarkDifferentClick}
              disabled={isSubmitting}
            >
              Mark as different
            </button>
          )}

          <button
            type="button"
            className="coalesce-submit-btn"
            onClick={handleMergeSubmit}
            disabled={isSubmitting || hasUnresolvedChoices}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Merging...
              </>
            ) : (
              'Merge records'
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}

export default function CoalescenceModal({
  isOpen,
  proposal,
  onClose,
  onResolve,
  onMarkDifferent,
}) {
  if (!isOpen || !proposal) return null;

  const key = proposal.groupKey || `${proposal.left?.claimId || 'left'}-${
    proposal.right?.claimId || 'right'
  }`;

  return (
    <div
      className="coalesce-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <CoalescenceModalContent
        key={key}
        proposal={proposal}
        onClose={onClose}
        onResolve={onResolve}
        onMarkDifferent={onMarkDifferent}
      />
    </div>
  );
}
