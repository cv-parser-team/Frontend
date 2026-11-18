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

function pairKey(leftClaimId, rightClaimId) {
  return [leftClaimId, rightClaimId].sort().join(':');
}

export function getProposalClaims(proposal) {
  if (Array.isArray(proposal?.claims)) return proposal.claims;

  const claims = [proposal?.left, proposal?.right].filter(
    (claim) => claim?.claimId && Number.isInteger(claim?.version)
  );
  return [...new Map(claims.map((claim) => [claim.claimId, claim])).values()];
}

export function groupMergeProposals(proposals = []) {
  const validProposals = proposals.filter(
    (proposal) => proposal?.left?.claimId && proposal?.right?.claimId
  );
  const parents = new Map();
  const find = (claimId) => {
    const parent = parents.get(claimId) || claimId;
    if (parent !== claimId) parents.set(claimId, find(parent));
    return parents.get(claimId) || claimId;
  };
  const union = (leftClaimId, rightClaimId) => {
    parents.set(leftClaimId, find(leftClaimId));
    parents.set(rightClaimId, find(rightClaimId));
    const leftRoot = find(leftClaimId);
    const rightRoot = find(rightClaimId);
    if (leftRoot !== rightRoot) parents.set(rightRoot, leftRoot);
  };

  validProposals.forEach((proposal) =>
    union(proposal.left.claimId, proposal.right.claimId)
  );

  const components = new Map();
  validProposals.forEach((proposal) => {
    const root = find(proposal.left.claimId);
    if (!components.has(root)) components.set(root, []);
    components.get(root).push(proposal);
  });

  return [...components.values()].map((componentProposals) => {
    const claims = [
      ...new Map(
        componentProposals
          .flatMap((proposal) => [proposal.left, proposal.right])
          .map((claim) => [claim.claimId, claim])
      ).values(),
    ].sort((left, right) => left.claimId.localeCompare(right.claimId));
    if (claims.length <= 2) return componentProposals[0];

    const first = componentProposals[0];
    const unresolvedFields = [
      ...new Set(
        componentProposals.flatMap((proposal) => proposal.unresolvedFields || [])
      ),
    ];
    const proposedCurrents = [
      ...new Set(
        componentProposals
          .map((proposal) => proposal.proposedCurrent)
          .filter((value) => typeof value === 'boolean')
      ),
    ];
    const proposedSurvivors = componentProposals
      .map((proposal) => proposal.survivorClaimId)
      .filter(Boolean);
    const survivorClaimId = proposedSurvivors.every(
      (claimId) => claimId === proposedSurvivors[0]
    )
      ? proposedSurvivors[0]
      : claims[0]?.claimId;

    return {
      ...first,
      result: 'group_proposal',
      isGroup: true,
      claims,
      proposals: componentProposals,
      groupKey: claims.map(({ claimId }) => claimId).join(':'),
      survivorClaimId,
      unresolvedFields,
      requiresCandidateChoice:
        unresolvedFields.length > 0 ||
        componentProposals.some((proposal) => proposal.requiresCandidateChoice),
      ...(proposedCurrents.length === 1
        ? { proposedCurrent: proposedCurrents[0] }
        : {}),
    };
  });
}

export function buildProposalFieldMatrix(proposal) {
  const claims = getProposalClaims(proposal);
  const proposals = proposal?.isGroup ? proposal.proposals || [] : [proposal];
  const fields = new Map();

  proposals.forEach((pairProposal) => {
    Object.entries(pairProposal?.fields || {}).forEach(([fieldName, comparison]) => {
      if (!fields.has(fieldName)) {
        fields.set(fieldName, {
          kinds: new Set(),
          values: new Map(),
          proposedValues: [],
        });
      }
      const field = fields.get(fieldName);
      field.kinds.add(comparison?.kind || 'same');
      const isDifference = ['conflict', 'compatible', 'warning'].includes(
        comparison?.kind
      );
      const leftValue = isDifference
        ? extractRawValue(comparison?.left)
        : extractRawValue(comparison?.left ?? comparison?.value);
      const rightValue = isDifference
        ? extractRawValue(comparison?.right)
        : extractRawValue(comparison?.right ?? comparison?.value);
      if (leftValue !== undefined) {
        field.values.set(pairProposal.left.claimId, leftValue);
      }
      if (rightValue !== undefined) {
        field.values.set(pairProposal.right.claimId, rightValue);
      }
      if (comparison?.value !== undefined) {
        field.proposedValues.push(extractRawValue(comparison.value));
      }
    });
  });

  return {
    claims,
    fields: [...fields.entries()].map(([fieldName, field]) => {
      const values = Object.fromEntries(
        claims.map((claim) => [
          claim.claimId,
          field.values.has(claim.claimId)
            ? field.values.get(claim.claimId)
            : field.proposedValues[0] ?? null,
        ])
      );
      const distinctValues = new Set(
        Object.values(values)
          .filter((value) => value != null)
          .map((value) => JSON.stringify(value))
      );
      const requiresChoice =
        field.kinds.has('conflict') ||
        field.kinds.has('compatible') ||
        field.kinds.has('warning') ||
        distinctValues.size > 1;

      return {
        fieldName,
        values,
        requiresChoice,
        isArrayField:
          Object.values(values).some(Array.isArray) ||
          fieldName.toLowerCase().includes('skill'),
      };
    }),
  };
}

export function getProposalPairKeys(proposal) {
  const proposals = proposal?.isGroup ? proposal.proposals || [] : [proposal];
  return proposals
    .filter((item) => item?.left?.claimId && item?.right?.claimId)
    .map((item) => pairKey(item.left.claimId, item.right.claimId));
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
