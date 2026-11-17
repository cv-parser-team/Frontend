/**
 * Utility functions for Claim Merge and Coalescence comparisons
 */

export function extractRawValue(item) {
  if (item == null) return null;
  if (typeof item === 'object') {
    if (item.kind === 'date') return item.value;
    if (item.kind === 'present') return 'Present';
    if (item.kind === 'missing') return null;
    if ('value' in item) return extractRawValue(item.value);
  }
  return item;
}

export function formatDisplayValue(val) {
  if (val == null || val === '') return '—';
  if (Array.isArray(val)) return val.join(', ');
  if (typeof val === 'object') {
    if (val.kind === 'date') return val.value || '—';
    if (val.kind === 'present') return 'Present';
    if (val.kind === 'missing') return '—';
    if (val.value !== undefined) return formatDisplayValue(val.value);
    return JSON.stringify(val);
  }
  return String(val);
}

export function toArray(val) {
  const raw = extractRawValue(val);
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [raw];
}

// Sample Scale AI merge proposal matching the UI concept and mockups
export const SAMPLE_SCALE_AI_PROPOSAL = {
  result: 'proposal',
  identity: 'suspected_duplicate',
  claimType: 'employment',
  left: {
    claimId: 'left-scale-ai-001',
    version: 1,
    documentName: 'Resume.pdf',
    type: 'Work experience',
    title: 'Scale AI',
  },
  right: {
    claimId: 'right-scale-ai-002',
    version: 1,
    documentName: 'LinkedIn export',
    type: 'Work experience',
    title: 'Scale AI',
  },
  survivorClaimId: 'left-scale-ai-001',
  survivorReason: 'oldest_pending',
  fields: {
    employer: {
      kind: 'same',
      value: 'Scale AI',
    },
    jobTitle: {
      kind: 'conflict',
      left: 'Staff ML Engineer',
      right: 'Senior ML Engineer',
    },
    startDate: {
      kind: 'precision_improvement',
      value: { kind: 'date', value: '2022-03' },
      from: 'right',
    },
    endDate: {
      kind: 'warning',
      left: { kind: 'present' },
      right: { kind: 'date', value: '2025-06' },
    },
    location: {
      kind: 'same',
      value: 'San Francisco, CA',
    },
    skills: {
      kind: 'enrichment',
      value: ['Python', 'PyTorch', 'Distributed Training', 'LLM Alignment'],
      left: ['Python', 'PyTorch'],
      right: ['Distributed Training', 'LLM Alignment'],
      from: 'both',
    },
  },
  proposedValues: {
    employer: 'Scale AI',
    location: 'San Francisco, CA',
    skills: ['Python', 'PyTorch', 'Distributed Training', 'LLM Alignment'],
  },
  proposedCurrent: true,
  unresolvedFields: ['jobTitle', 'endDate'],
  requiresCandidateChoice: true,
  recommendedAction: 'candidate_review',
};

