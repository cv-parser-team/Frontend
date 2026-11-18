/**
 * Maps extraction review issue codes to user-facing hints.
 *
 * Each code maps to:
 *   - message: a short actionable message shown on the issue card
 *   - fieldHint: a per-field instruction shown as a warning in the review drawer
 */
const ISSUE_HINTS = {
  invalid_item: {
    message: 'This item could not be read correctly from your document.',
    fieldHint: 'Review all fields — the extracted data may be incomplete or garbled.',
  },
  invalid_source: {
    message: 'A field references a part of the document that could not be found.',
    fieldHint: 'The source reference is invalid. Re-enter this value manually.',
  },
  missing_value: {
    message: 'A value was found in the document text but could not be interpreted.',
    fieldHint: 'We found text but could not parse it. Enter the correct value.',
  },
  invalid_value: {
    message: 'A field value does not match the expected format.',
    fieldHint: 'This value is not in the expected format. Please correct it.',
  },
  invalid_date: {
    message: 'A date could not be read — use YYYY or YYYY-MM format.',
    fieldHint: 'Enter the date as YYYY or YYYY-MM (e.g., 2023 or 2023-06).',
  },
  invalid_date_order: {
    message: 'The end date is before the start date.',
    fieldHint: 'The end date must be the same as or after the start date.',
  },
  missing_name: {
    message: 'The name is missing — please provide it.',
    fieldHint: 'This field is required. Enter the name.',
  },
  missing_employer: {
    message: 'The employer name is missing — please provide it.',
    fieldHint: 'This field is required. Enter the employer name.',
  },
  missing_job_title: {
    message: 'The job title is missing — please provide it.',
    fieldHint: 'This field is required. Enter your job title.',
  },
  missing_start_date: {
    message: 'The start date is missing — please provide it.',
    fieldHint: 'This field is required. Enter the start date as YYYY or YYYY-MM.',
  },
  missing_institution: {
    message: 'The institution name is missing — please provide it.',
    fieldHint: 'This field is required. Enter the institution name.',
  },
  missing_degree: {
    message: 'The degree is missing — please provide it.',
    fieldHint: 'This field is required. Enter the degree or qualification.',
  },
  missing_title: {
    message: 'The certification title is missing — please provide it.',
    fieldHint: 'This field is required. Enter the certification title.',
  },
  missing_issuer: {
    message: 'The issuing organization is missing — please provide it.',
    fieldHint: 'This field is required. Enter the issuing organization.',
  },
  missing_issue_date: {
    message: 'The issue date is missing — please provide it.',
    fieldHint: 'This field is required. Enter the issue date as YYYY or YYYY-MM.',
  },
};

/**
 * Returns the user-facing hint for an issue code.
 * Falls back to a generic message for unknown codes.
 */
export function getIssueHint(code) {
  return (
    ISSUE_HINTS[code] ?? {
      message: 'This item needs your attention before it can be saved.',
      fieldHint: 'Please review and correct this value.',
    }
  );
}

/**
 * Builds a combined hint summary from an array of issues.
 * Returns { messages: string[], fieldHints: Map<string, string> }.
 */
export function summarizeIssues(issues = []) {
  const seen = new Set();
  const messages = [];
  const fieldHints = new Map();

  for (const issue of issues) {
    if (!issue) continue;
    const hint = getIssueHint(issue.code);
    if (issue.code && !seen.has(issue.code)) {
      seen.add(issue.code);
      messages.push(hint.message);
    }
    if (issue.field && hint.fieldHint) {
      fieldHints.set(issue.field, hint.fieldHint);
    }
  }

  return { messages, fieldHints };
}
