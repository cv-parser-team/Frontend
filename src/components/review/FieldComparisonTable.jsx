import { Check } from 'lucide-react';
import {
  buildProposalFieldMatrix,
  formatDisplayValue,
  toArray,
} from '../../utils/coalesceUtils';
import './FieldComparisonTable.css';

const REQUIRED_FIELDS = new Set([
  'employer', 'title', 'jobTitle', 'startDate', 'institution', 'degree',
  'name', 'issuer', 'language', 'proficiency',
]);

const FIELD_LABELS = {
  employer: 'Employer', title: 'Job title', jobTitle: 'Job title',
  startDate: 'Start date', endDate: 'End date', location: 'Location',
  description: 'Description', skills: 'Skills', institution: 'Institution',
  degree: 'Degree', fieldOfStudy: 'Field of study', name: 'Name',
  issuer: 'Issuer', issueDate: 'Issue date', expiryDate: 'Expiry date',
  credentialId: 'Credential ID', language: 'Language', proficiency: 'Proficiency',
  role: 'Role', url: 'URL',
};

function FieldLabel({ fieldName }) {
  const label = FIELD_LABELS[fieldName] || fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (character) => character.toUpperCase());
  return <>{label}{REQUIRED_FIELDS.has(fieldName) && (
    <span className="coalesce-required-asterisk"> *</span>
  )}</>;
}

function sourceLabel(claim, index) {
  return (claim.documentName || claim.title || `Source ${index + 1}`).toUpperCase();
}

export default function FieldComparisonTable({
  proposal,
  fieldSelections = {},
  onSelectField,
  readOnly = false,
}) {
  const matrix = buildProposalFieldMatrix(proposal);
  if (matrix.fields.length === 0) {
    return <div className="coalesce-empty">No comparison fields available.</div>;
  }

  const choiceFields = matrix.fields.filter((field) => field.requiresChoice);
  const selectValue = (fieldName, source, value) => {
    if (!readOnly && onSelectField) onSelectField(fieldName, source, value);
  };

  return (
    <div className="coalesce-comparison">
      {choiceFields.length > 0 && (
        <div className="coalesce-table-container">
          <table
            className="coalesce-table coalesce-table--multi"
            style={{ '--source-count': matrix.claims.length }}
          >
            <thead><tr>
              <th className="coalesce-field-col">Field</th>
              {matrix.claims.map((claim, index) => (
                <th className="coalesce-source-col" key={claim.claimId}>
                  {sourceLabel(claim, index)}
                </th>
              ))}
            </tr></thead>
            <tbody>
              {choiceFields.map((field) => {
                const selection = fieldSelections[field.fieldName];
                const combined = Array.from(new Set(
                  matrix.claims.flatMap((claim) => toArray(field.values[claim.claimId]))
                ));
                return (
                  <tr key={field.fieldName}>
                    <td className="coalesce-field-col">
                      <span className="coalesce-field-name">
                        <FieldLabel fieldName={field.fieldName} />
                      </span>
                      {field.isArrayField && (
                        <button
                          type="button"
                          className={`coalesce-combine-btn ${selection?.source === 'combined' ? 'active' : ''}`}
                          disabled={readOnly}
                          onClick={() => selectValue(field.fieldName, 'combined', combined)}
                        >
                          Combine all
                        </button>
                      )}
                    </td>
                    {matrix.claims.map((claim, index) => {
                      const value = field.values[claim.claimId];
                      const selected = selection?.source === claim.claimId;
                      return (
                        <td className="coalesce-source-col" data-label={sourceLabel(claim, index)} key={claim.claimId}>
                          <button
                            type="button"
                            className={`coalesce-choice-card ${selected ? 'selected' : ''}`}
                            disabled={readOnly || value == null}
                            onClick={() => selectValue(field.fieldName, claim.claimId, value)}
                          >
                            <span className={`coalesce-radio ${selected ? 'checked' : ''}`}>
                              {selected && <span className="coalesce-radio-dot" />}
                            </span>
                            <span className="coalesce-choice-content">
                              <span className="coalesce-choice-text">{formatDisplayValue(value)}</span>
                            </span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <details className="coalesce-matching-fields" open>
        <summary>
          <span>Complete claim preview</span>
          <small>{matrix.fields.length} {matrix.fields.length === 1 ? 'field' : 'fields'} ·{' '}
            {matrix.fields.length - choiceFields.length} non-conflicting</small>
        </summary>
        <div className="coalesce-matching-list">
          {matrix.fields.map((field) => {
            const selection = fieldSelections[field.fieldName];
            return (
              <div key={field.fieldName}>
                <span className="coalesce-preview-status">
                  {selection?.value == null ? '—' : <Check size={14} />}
                </span>
                <span><FieldLabel fieldName={field.fieldName} /></span>
                <strong className={selection?.value == null ? 'is-pending' : ''}>
                  {selection?.value == null ? 'Choose a value above' : formatDisplayValue(selection.value)}
                </strong>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
