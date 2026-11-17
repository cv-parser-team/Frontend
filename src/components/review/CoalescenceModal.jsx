import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import FieldComparisonTable from './FieldComparisonTable';
import { extractRawValue } from '../../utils/coalesceUtils';
import './CoalescenceModal.css';

function computeInitialSelections(proposal) {
  if (!proposal || !proposal.fields) return {};

  const initial = {};
  const preferredSurvivorSide =
    proposal.survivorClaimId === proposal.left?.claimId
      ? 'left'
      : proposal.survivorClaimId === proposal.right?.claimId
      ? 'right'
      : null;

  for (const [field, comp] of Object.entries(proposal.fields)) {
    const kind = comp?.kind || 'same';

    if (kind === 'same' || kind === 'precision_improvement') {
      initial[field] = {
        source: 'auto',
        value: extractRawValue(comp.value),
      };
    } else if (kind === 'enrichment') {
      initial[field] = {
        source: comp.from || 'both',
        value: extractRawValue(comp.value),
      };
    } else if (['conflict', 'compatible', 'warning'].includes(kind)) {
      if (preferredSurvivorSide === 'left' && comp.left) {
        initial[field] = {
          source: 'left',
          value: extractRawValue(comp.left),
        };
      } else if (preferredSurvivorSide === 'right' && comp.right) {
        initial[field] = {
          source: 'right',
          value: extractRawValue(comp.right),
        };
      } else {
        initial[field] = {
          source: null,
          value: null,
        };
      }
    }
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

  const docNameLeft = proposal.left?.documentName || 'Resume.pdf';
  const docNameRight = proposal.right?.documentName || 'LinkedIn export';
  const categoryLabel =
    proposal.left?.type || proposal.left?.section || 'Work experience';
  const entityTitle =
    proposal.left?.title ||
    proposal.fields?.employer?.value ||
    'Conflicting role details';

  const unresolvedFields = proposal.unresolvedFields || [];
  const choiceFields = unresolvedFields.length
    ? unresolvedFields
    : Object.entries(proposal.fields || {})
        .filter(([, comparison]) =>
          ['conflict', 'compatible', 'warning'].includes(comparison?.kind)
        )
        .map(([field]) => field);
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
          values[field] = selection.value;
        }
      }

      const batchAction = {
        action: 'merge_claims',
        leftClaimId: proposal.left?.claimId,
        rightClaimId: proposal.right?.claimId,
        leftVersion: proposal.left?.version,
        rightVersion: proposal.right?.version,
        survivorClaimId: proposal.survivorClaimId || proposal.left?.claimId,
        values,
        ...(typeof proposal.proposedCurrent === 'boolean'
          ? { current: proposal.proposedCurrent }
          : {}),
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
      await onMarkDifferent(proposal.left?.claimId, proposal.right?.claimId);
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
          <span>{docNameLeft}</span>
          <span className="coalesce-vs">and</span>
          <span>{docNameRight}</span>
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
          {onMarkDifferent && (
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

  const key = `${proposal.left?.claimId || 'left'}-${
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
