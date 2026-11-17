import { Check } from 'lucide-react';
import {
  extractRawValue,
  formatDisplayValue,
  toArray,
} from '../../utils/coalesceUtils';
import './FieldComparisonTable.css';

const REQUIRED_FIELDS = new Set([
  'employer',
  'title',
  'jobTitle',
  'startDate',
  'institution',
  'degree',
  'name',
  'issuer',
  'language',
  'proficiency',
]);

const FIELD_LABELS = {
  employer: 'Employer',
  title: 'Job title',
  jobTitle: 'Job title',
  startDate: 'Start date',
  endDate: 'End date',
  location: 'Location',
  description: 'Description',
  skills: 'Skills',
  institution: 'Institution',
  degree: 'Degree',
  fieldOfStudy: 'Field of study',
  name: 'Name',
  issuer: 'Issuer',
  issueDate: 'Issue date',
  language: 'Language',
  proficiency: 'Proficiency',
};

function getFieldLabelElement(key) {
  const base =
    FIELD_LABELS[key] ||
    key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
  return (
    <>
      {base}
      {REQUIRED_FIELDS.has(key) && (
        <span className="coalesce-required-asterisk"> *</span>
      )}
    </>
  );
}

export default function FieldComparisonTable({
  proposal,
  fieldSelections = {},
  onSelectField,
  readOnly = false,
}) {
  if (!proposal || !proposal.fields) {
    return <div className="coalesce-empty">No comparison fields available.</div>;
  }

  const docNameLeft = (proposal.left?.documentName || 'Resume.pdf').toUpperCase();
  const docNameRight = (proposal.right?.documentName || 'LinkedIn export').toUpperCase();

  const entries = Object.entries(proposal.fields);
  const getComparisonState = (fieldName, comparison) => {
    const kind = comparison?.kind || 'same';
    const isDiff = ['conflict', 'compatible', 'warning'].includes(kind);
    const isEnrichment = kind === 'enrichment';
    let leftRaw = null;
    let rightRaw = null;

    if (isDiff) {
      leftRaw = extractRawValue(comparison.left);
      rightRaw = extractRawValue(comparison.right);
    } else {
      leftRaw = extractRawValue(comparison.value);
      rightRaw = leftRaw;
    }

    const isArrayField =
      Array.isArray(leftRaw) ||
      Array.isArray(rightRaw) ||
      fieldName.toLowerCase().includes('skill');

    return { isDiff, isEnrichment, isArrayField, leftRaw, rightRaw };
  };
  const decisionEntries = entries.filter(([fieldName, comparison]) => {
    const state = getComparisonState(fieldName, comparison);
    return state.isDiff;
  });
  const matchingEntries = entries.filter(([fieldName, comparison]) => {
    const state = getComparisonState(fieldName, comparison);
    return !state.isDiff;
  });

  return (
    <div className="coalesce-comparison">
      {decisionEntries.length > 0 && (
        <div className="coalesce-table-container">
          <table className="coalesce-table">
            <thead>
              <tr>
                <th className="coalesce-field-col">Field</th>
                <th className="coalesce-source-col">{docNameLeft}</th>
                <th className="coalesce-source-col">{docNameRight}</th>
              </tr>
            </thead>
            <tbody>
              {decisionEntries.map(([fieldName, comparison]) => {
            const { isArrayField, leftRaw, rightRaw } = getComparisonState(
              fieldName,
              comparison
            );
            const currentSelection = fieldSelections[fieldName];
            const isLeftSelected = currentSelection?.source === 'left';
            const isRightSelected = currentSelection?.source === 'right';
            const isBothSelected = currentSelection?.source === 'both';

            const handleCombine = () => {
              if (readOnly || !onSelectField) return;
              const combined = Array.from(
                new Set([...toArray(leftRaw), ...toArray(rightRaw)])
              );
              onSelectField(fieldName, 'both', combined);
            };

            const handleSelect = (source, val) => {
              if (readOnly || !onSelectField) return;
              onSelectField(fieldName, source, val);
            };

            return (
                <tr key={fieldName}>
                <td className="coalesce-field-col" data-label="Field">
                  <span className="coalesce-field-name">
                    {getFieldLabelElement(fieldName)}
                  </span>
                  {isArrayField && !readOnly && (
                    <button
                      type="button"
                      className={`coalesce-combine-btn ${
                        isBothSelected ? 'active' : ''
                      }`}
                      onClick={handleCombine}
                    >
                      Combine both
                    </button>
                  )}
                </td>

                <td
                  className="coalesce-source-col"
                  data-label={`Source A · ${docNameLeft}`}
                >
                    <div
                      className={`coalesce-choice-card ${
                        isLeftSelected ? 'selected' : ''
                      }`}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelect('left', leftRaw)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelect('left', leftRaw);
                        }
                      }}
                    >
                      <span
                        className={`coalesce-radio ${
                          isLeftSelected ? 'checked' : ''
                        }`}
                      >
                        {isLeftSelected && <span className="coalesce-radio-dot" />}
                      </span>
                      <div className="coalesce-choice-content">
                        <span className="coalesce-choice-text">
                          {formatDisplayValue(leftRaw)}
                        </span>
                      </div>
                    </div>
                </td>

                <td
                  className="coalesce-source-col"
                  data-label={`Source B · ${docNameRight}`}
                >
                    <div
                      className={`coalesce-choice-card ${
                        isRightSelected ? 'selected' : ''
                      }`}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelect('right', rightRaw)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelect('right', rightRaw);
                        }
                      }}
                    >
                      <span
                        className={`coalesce-radio ${
                          isRightSelected ? 'checked' : ''
                        }`}
                      >
                        {isRightSelected && (
                          <span className="coalesce-radio-dot" />
                        )}
                      </span>
                      <div className="coalesce-choice-content">
                        <span className="coalesce-choice-text">
                          {formatDisplayValue(rightRaw)}
                        </span>
                      </div>
                    </div>
                </td>
              </tr>
            );
            })}
            </tbody>
          </table>
        </div>
      )}

      {entries.length > 0 && (
        <details className="coalesce-matching-fields" open>
          <summary>
            <span>Complete claim preview</span>
            <small>
              {entries.length} {entries.length === 1 ? 'field' : 'fields'} ·{' '}
              {matchingEntries.length} non-conflicting
            </small>
          </summary>
          <div className="coalesce-matching-list">
            {entries.map(([fieldName, comparison]) => {
              const state = getComparisonState(fieldName, comparison);
              const selection = fieldSelections[fieldName];
              const previewValue = selection?.value ??
                (state.isDiff ? null : state.leftRaw);

              return (
                <div key={fieldName}>
                  <span className="coalesce-preview-status">
                    {previewValue == null ? '—' : <Check size={14} />}
                  </span>
                  <span>{getFieldLabelElement(fieldName)}</span>
                  <strong className={previewValue == null ? 'is-pending' : ''}>
                    {previewValue == null
                      ? 'Choose a value above'
                      : formatDisplayValue(previewValue)}
                  </strong>
                </div>
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
