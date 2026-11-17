import { useState } from 'react';
import Drawer from './Drawer';
import DrawerFooter from './DrawerFooter';
import Badge from '../ui/Badge';
import Callout from '../ui/Callout';
import { SOURCES } from '../../../data/profileData';

const CLAIM_FIELDS = {
  skill: [{ name: 'name', label: 'Skill', required: true }],
  language: [
    { name: 'name', label: 'Language', required: true },
    { name: 'proficiency', label: 'Proficiency' },
  ],
  employment: [
    { name: 'jobTitle', label: 'Job title', required: true },
    { name: 'employer', label: 'Employer', required: true },
    { name: 'startDate', label: 'Start date', required: true, date: true },
    { name: 'endDate', label: 'End date', date: true },
    { name: 'location', label: 'Location' },
    { name: 'description', label: 'Description', multiline: true },
    { name: 'skills', label: 'Skills', multiline: true, list: true },
  ],
  education: [
    { name: 'degree', label: 'Degree', required: true },
    { name: 'institution', label: 'Institution', required: true },
    { name: 'fieldOfStudy', label: 'Field of study' },
    { name: 'startDate', label: 'Start date', required: true, date: true },
    { name: 'endDate', label: 'End date', date: true },
  ],
  certification: [
    { name: 'title', label: 'Certification', required: true },
    { name: 'issuer', label: 'Issuer', required: true },
    { name: 'issueDate', label: 'Issue date', required: true, date: true },
    { name: 'expiryDate', label: 'Expiry date', date: true },
    { name: 'credentialId', label: 'Credential ID' },
  ],
  project: [
    { name: 'name', label: 'Project name', required: true },
    { name: 'role', label: 'Role' },
    { name: 'startDate', label: 'Start date', date: true },
    { name: 'endDate', label: 'End date', date: true },
    { name: 'url', label: 'Project URL', url: true },
    { name: 'description', label: 'Description', multiline: true },
    { name: 'skills', label: 'Skills', multiline: true, list: true },
  ],
};

const CLAIM_TITLES = {
  skill: 'skill',
  language: 'language',
  employment: 'work experience',
  education: 'education',
  certification: 'certification',
  project: 'project',
};

function fieldValue(field) {
  const value = field && typeof field === 'object' && !Array.isArray(field)
    ? field.value ?? field.raw
    : field;
  return Array.isArray(value) ? value.join(', ') : value == null ? '' : String(value);
}

function initialValues(item, fields) {
  return Object.fromEntries(
    fields.map(({ name }) => [name, fieldValue(item.fields?.[name])])
  );
}

export default function ExtractionReviewDrawer({ item, onClose, onResolve, onDismiss }) {
  const fields = CLAIM_FIELDS[item.claimType] ?? [];
  const [values, setValues] = useState(() => initialValues(item, fields));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const sourceName = SOURCES[item.documentId]?.label || 'Source document';
  const missingRequired = fields.some(
    ({ name, required }) => required && !values[name]?.trim()
  );

  const update = (name, value) => setValues((current) => ({ ...current, [name]: value }));

  const save = async () => {
    const requestValues = {};
    for (const field of fields) {
      const value = values[field.name]?.trim() ?? '';
      if (!value) {
        if (field.required) {
          setError(`${field.label} is required.`);
          return;
        }
        continue;
      }
      if (field.date && !/^\d{4}(?:-(0[1-9]|1[0-2]))?$/.test(value)) {
        setError(`${field.label} must use YYYY or YYYY-MM format.`);
        return;
      }
      if (field.list) {
        requestValues[field.name] = value.split(',').map((entry) => entry.trim()).filter(Boolean);
      } else {
        requestValues[field.name] = value;
      }
    }

    setError('');
    setSaving(true);
    try {
      await onResolve(requestValues);
    } catch (saveError) {
      setError(saveError.message || 'Unable to resolve this profile issue.');
    } finally {
      setSaving(false);
    }
  };

  const dismiss = async () => {
    setError('');
    setSaving(true);
    try {
      await onDismiss();
    } catch (dismissError) {
      setError(dismissError.message || 'Unable to dismiss this profile issue.');
    } finally {
      setSaving(false);
    }
  };

  const title = CLAIM_TITLES[item.claimType] || 'profile information';
  return (
    <Drawer
      title={`Review ${title}`}
      sub={sourceName}
      badge={<Badge tone="amber">Needs review</Badge>}
      onClose={onClose}
      footer={
        <DrawerFooter
          ok={saving ? 'Saving…' : 'Save to profile'}
          disabled={saving || missingRequired}
          onCancel={onClose}
          onOk={save}
          left={<button className="btn ghost" disabled={saving} onClick={dismiss}>Dismiss issue</button>}
        />
      }
    >
      <Callout tone="amber">
        Correct the extracted values below. Saving adds this item to your profile
        and marks it as reviewed.
      </Callout>
      {fields.map((field) => (
        <label className="fld" key={field.name}>
          <span>{field.label}{field.required ? ' *' : ''}</span>
          {field.multiline
            ? <textarea
                className="in"
                rows={field.list ? 2 : 4}
                value={values[field.name] ?? ''}
                onChange={(event) => update(field.name, event.target.value)}
                placeholder={field.list ? 'Separate items with commas' : ''}
              />
            : <input
                className="in"
                type="text"
                value={values[field.name] ?? ''}
                onChange={(event) => update(field.name, event.target.value)}
                placeholder={field.date ? 'YYYY or YYYY-MM' : field.url ? 'https://' : ''}
              />}
        </label>
      ))}
      {error && <p className="err" role="alert">{error}</p>}
      <p className="hint">Source evidence: {item.sources?.join(', ') || 'Not available'}</p>
    </Drawer>
  );
}
