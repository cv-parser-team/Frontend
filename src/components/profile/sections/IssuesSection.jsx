import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import Section from './Section';
import SuspectedDuplicateDrawer from '../drawers/SuspectedDuplicateDrawer';
import { SOURCES } from '../../../data/profileData';
import {
  getMyClaimMergeCandidates,
  resolveMyClaimBatch,
  markMyClaimsDifferent,
} from '../../../api/candidateApi';
import {
  extractRawValue,
  getProposalPairKeys,
  groupMergeProposals,
} from '../../../utils/coalesceUtils';
import { mergeGroupKey } from '../../../utils/duplicateGroups';
import './IssuesSection.css';

const ISSUE_CATEGORIES = {
  all: { label: 'All' },
  review: { label: 'Approval', cardLabel: 'Pending approval', action: 'Review' },
  extraction: { label: 'Review required', cardLabel: 'Review required', action: 'Review' },
  conflict: { label: 'Conflicts', cardLabel: 'Conflict', action: 'Resolve' },
  duplicate: { label: 'Suspected duplicates', cardLabel: 'Suspected duplicate', action: 'Compare' },
  quality: { label: 'Data quality', cardLabel: 'Data quality', action: 'Review' },
  missing: { label: 'Missing info', cardLabel: 'Missing info', action: 'Review' },
};

function getIssueCategory(issue) {
  if (issue.kind === 'review') return 'extraction';
  if (issue.kind === 'claimReview') return 'review';
  if (issue.kind === 'conflict') return 'conflict';
  if (issue.kind === 'duplicate') return 'duplicate';
  if (issue.kind === 'phone') return 'missing';
  return 'quality';
}

function getProposalIssueCategory(proposal) {
  return proposal.requiresCandidateChoice ? 'conflict' : 'duplicate';
}

function enrichClaimSource(claim, claimItemsById) {
  const item = claimItemsById?.get(claim?.claimId);
  const documentNames = (item?.sources ?? [])
    .map((sourceId) => SOURCES[sourceId]?.label)
    .filter(Boolean);
  return {
    ...claim,
    ...(documentNames.length > 0
      ? {
          documentNames: [...new Set(documentNames)],
          documentName: documentNames[0],
        }
      : {}),
  };
}

function enrichProposalSources(proposal, claimItemsById) {
  if (!proposal) return proposal;
  return {
    ...proposal,
    left: enrichClaimSource(proposal.left, claimItemsById),
    right: enrichClaimSource(proposal.right, claimItemsById),
    ...(Array.isArray(proposal.claims)
      ? { claims: proposal.claims.map((claim) => enrichClaimSource(claim, claimItemsById)) }
      : {}),
    ...(Array.isArray(proposal.proposals)
      ? {
          proposals: proposal.proposals.map((pair) => ({
            ...pair,
            left: enrichClaimSource(pair.left, claimItemsById),
            right: enrichClaimSource(pair.right, claimItemsById),
          })),
        }
      : {}),
  };
}

function getProposalCategory(proposal) {
  const rawType =
    proposal.claimType ||
    proposal.left?.type ||
    proposal.left?.claimType ||
    proposal.left?.section;

  if (rawType) {
    const map = {
      employment: 'Work experience',
      experience: 'Work experience',
      education: 'Education',
      project: 'Projects',
      certification: 'Certifications',
      skill: 'Skills',
      language: 'Languages',
    };
    if (map[rawType.toLowerCase()]) return map[rawType.toLowerCase()];
    return rawType;
  }

  const fields = proposal.fields || {};
  if (fields.employer || fields.jobTitle) return 'Work experience';
  if (fields.institution || fields.degree || fields.fieldOfStudy) return 'Education';
  if (fields.issuer || fields.credentialId) return 'Certifications';
  if (fields.proficiency) return 'Languages';
  if (fields.url || fields.role) return 'Projects';
  if (fields.name) return 'Skills';
  return 'Work experience';
}

function getProposalTitle(proposal) {
  if (proposal.left?.title) return proposal.left.title;

  const fields = proposal.fields || {};
  const employer =
    extractRawValue(fields.employer?.value) ||
    extractRawValue(fields.employer?.left) ||
    extractRawValue(fields.employer?.right);
  const jobTitle =
    extractRawValue(fields.jobTitle?.value) ||
    extractRawValue(fields.jobTitle?.left) ||
    extractRawValue(fields.jobTitle?.right);

  if (employer && jobTitle) return `${jobTitle} · ${employer}`;
  if (employer) return employer;
  if (jobTitle) return jobTitle;

  const school =
    extractRawValue(fields.institution?.value) ||
    extractRawValue(fields.institution?.left) ||
    extractRawValue(fields.institution?.right) ||
    extractRawValue(fields.school?.value);
  const degree =
    extractRawValue(fields.degree?.value) ||
    extractRawValue(fields.degree?.left) ||
    extractRawValue(fields.degree?.right);

  if (school && degree) return `${degree} · ${school}`;
  if (school) return school;

  const name =
    extractRawValue(fields.name?.value) ||
    extractRawValue(fields.name?.left) ||
    extractRawValue(fields.title?.value);
  if (name) return name;

  return 'Duplicate claim comparison';
}

function getConflictingFields(proposal) {
  if (Array.isArray(proposal.unresolvedFields) && proposal.unresolvedFields.length > 0) {
    return proposal.unresolvedFields;
  }
  const fields = proposal.fields || {};
  return Object.keys(fields).filter((field) => {
    const kind = fields[field]?.kind;
    return ['conflict', 'compatible', 'warning'].includes(kind);
  });
}

function formatFieldName(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function CandidateIssueCard({ proposal, pendingReviews = 0, onOpenComparison }) {
  const issueCategory = getProposalIssueCategory(proposal);
  const areaCategory = getProposalCategory(proposal);
  const title = getProposalTitle(proposal);
  const conflictingFields = getConflictingFields(proposal);
  const sourceCount = proposal.claims?.length || 2;
  const docLeft = proposal.left?.documentName || 'Source 1';
  const docRight = proposal.right?.documentName || 'Source 2';

  const conflictCount = conflictingFields.length;
  const conflictText =
    conflictCount > 0
      ? `${conflictCount} conflicting ${conflictCount === 1 ? 'field' : 'fields'} (${conflictingFields
          .map(formatFieldName)
          .join(', ')})`
      : 'Suspected duplicate entry across sources';

  return (
    <div
      className={`issue-card issue-card--${issueCategory}`}
      onClick={() => onOpenComparison(proposal)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenComparison(proposal);
        }
      }}
    >
      <div className="issue-card-info">
        <div className="issue-card-meta">
          <span className="issue-area-label">{areaCategory}</span>
        </div>
        <h4 className="issue-card-title" title={title}>{title}</h4>
        <p className="issue-card-description">
          {proposal.isGroup
            ? `${sourceCount} related sources`
            : `${docLeft} vs. ${docRight}`}{' '}
          · {conflictText}
          {pendingReviews > 0 && ` · +${pendingReviews} awaiting review`}
        </p>
      </div>

      <div
        className="issue-card-actions"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="btn-open-comparison"
          onClick={() => onOpenComparison(proposal)}
        >
          {proposal.requiresCandidateChoice ? 'Resolve' : 'Compare'}
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function IssueItem({ issue: i, onClick, onDismissCopies }) {
  const issueCategory = getIssueCategory(i);
  const category = ISSUE_CATEGORIES[issueCategory];

  // Copies of a fact already in the profile can be dismissed from the card.
  // The card is then not a button itself, because it holds two buttons.
  if (i.inProfile && onDismissCopies) {
    return (
      <div
        className={`issue-card issue-card--${issueCategory}`}
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <span className="issue-card-info">
          <span className="issue-card-meta">
            <span className="issue-area-label">{i.area}</span>
          </span>
          <h4 className="issue-card-title" title={i.title}>{i.title}</h4>
          <span className="issue-card-description">{i.text}</span>
        </span>
        <span className="issue-card-actions" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="btn-open-comparison" onClick={() => onDismissCopies(i)}>
            Dismiss {i.copies.length === 1 ? 'copy' : 'copies'}
          </button>
          <button type="button" className="btn-open-comparison" onClick={onClick}>
            {category.action}
            <ChevronRight size={14} />
          </button>
        </span>
      </div>
    );
  }

  return (
    <button className={`issue-card issue-card--${issueCategory}`} onClick={onClick}>
      <span className="issue-card-info">
        <span className="issue-card-meta">
          <span className="issue-area-label">{i.area}</span>
        </span>
        <h4 className="issue-card-title" title={i.title}>{i.title}</h4>
        <span className="issue-card-description">{i.text}</span>
      </span>
      <span className="issue-card-actions">
        <span className="issue-card-action-label">{category.action}</span>
        <ChevronRight size={17} />
      </span>
    </button>
  );
}

export default function IssuesSection({
  items = [],
  total,
  open,
  onToggle,
  onOpenIssue,
  mergeCandidates: propMergeCandidates,
  onMergeCandidatesChange,
  onOpenComparison: propOnOpenComparison,
  onResolveProposal,
  onMarkDifferentProposal,
  onRefreshProfile,
  // Optional control of the open comparison, so other sections can open it.
  selectedProposal: controlledSelectedProposal,
  onSelectedProposalChange,
  // Review items each merge group card stands for, by merge group key.
  reviewsByMergeGroup,
  onDismissCopies,
  claimItemsById,
}) {
  const [internalCandidates, setInternalCandidates] = useState([]);
  const [resolvedPairKeys, setResolvedPairKeys] = useState(() => new Set());
  const mergeCandidates =
    propMergeCandidates !== undefined ? propMergeCandidates : internalCandidates;
  const candidateGroups = useMemo(
    () => groupMergeProposals(mergeCandidates),
    [mergeCandidates]
  );
  const [internalSelectedProposal, setInternalSelectedProposal] = useState(null);
  const selectedProposal =
    controlledSelectedProposal !== undefined
      ? controlledSelectedProposal
      : internalSelectedProposal;
  const enrichedSelectedProposal = useMemo(
    () => enrichProposalSources(selectedProposal, claimItemsById),
    [selectedProposal, claimItemsById]
  );
  const setSelectedProposal = onSelectedProposalChange ?? setInternalSelectedProposal;
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categoryCounts = useMemo(() => {
    const counts = Object.fromEntries(
      Object.keys(ISSUE_CATEGORIES).map((category) => [category, 0])
    );
    items.forEach((item) => {
      counts[getIssueCategory(item)] += 1;
    });
    candidateGroups.forEach((proposal) => {
      counts[getProposalIssueCategory(proposal)] += 1;
    });
    counts.all = items.length + candidateGroups.length;
    return counts;
  }, [items, candidateGroups]);

  const effectiveCategory =
    selectedCategory === 'all' || categoryCounts[selectedCategory] > 0
      ? selectedCategory
      : 'all';
  const visibleItems =
    effectiveCategory === 'all'
      ? items
      : items.filter((item) => getIssueCategory(item) === effectiveCategory);
  const visibleCandidates =
    effectiveCategory === 'all'
      ? candidateGroups
      : candidateGroups.filter(
          (proposal) => getProposalIssueCategory(proposal) === effectiveCategory
        );
  const categoryFilters = Object.entries(ISSUE_CATEGORIES).filter(
    ([category]) => category === 'all' || categoryCounts[category] > 0
  );

  const loadCandidates = useCallback(
    async (currentResolvedKeys = resolvedPairKeys) => {
      setIsLoading(true);
      setLoadError(false);
      try {
        const candidates = await getMyClaimMergeCandidates();
        if (Array.isArray(candidates) && candidates.length > 0) {
          const filtered = candidates.filter(
            (candidate) =>
              !getProposalPairKeys(candidate).some((key) =>
                currentResolvedKeys.has(key)
              )
          );
          setInternalCandidates(filtered);
          onMergeCandidatesChange?.(filtered);
        } else {
          setInternalCandidates([]);
          onMergeCandidatesChange?.([]);
        }
      } catch {
        // Show nothing invented: keep the list empty and offer a retry.
        setLoadError(true);
        setInternalCandidates([]);
        onMergeCandidatesChange?.([]);
      } finally {
        setIsLoading(false);
      }
    },
    [resolvedPairKeys, onMergeCandidatesChange]
  );

  useEffect(() => {
    if (propMergeCandidates === undefined) {
      loadCandidates();
    }
  }, [propMergeCandidates, loadCandidates]);

  const handleOpenComparison = (proposal) => {
    setSelectedProposal(proposal);
    propOnOpenComparison?.(proposal);
  };

  const handleCloseComparison = () => {
    setSelectedProposal(null);
  };

  const handleResolve = async (batchAction) => {
    if (onResolveProposal) {
      await onResolveProposal(batchAction);
    } else {
      const results = await resolveMyClaimBatch([batchAction]);
      const firstResult = results?.[0];
      if (firstResult && firstResult.status === 'conflict') {
        const conflictErr = new Error(
          'Version conflict: this claim was updated in another session. Please refresh your profile and try again.'
        );
        conflictErr.status = 409;
        conflictErr.code = 'CONFLICT';
        throw conflictErr;
      }
      if (firstResult && firstResult.status === 'not_eligible') {
        throw new Error(
          firstResult.reason ||
            'This claim pair is no longer eligible for merging.'
        );
      }
      if (firstResult && firstResult.status === 'failed') {
        throw new Error(
          firstResult.message || 'Failed to merge selected claims.'
        );
      }
    }

    // Success flow: track every resolved proposal edge, close modal, and refresh.
    const resolvedKeys = getProposalPairKeys(selectedProposal);
    const nextResolvedKeys = new Set(resolvedPairKeys);
    resolvedKeys.forEach((key) => nextResolvedKeys.add(key));
    setResolvedPairKeys(nextResolvedKeys);

    setSelectedProposal(null);
    setInternalCandidates((prev) =>
      prev.filter(
        (proposal) =>
          !getProposalPairKeys(proposal).some((key) => nextResolvedKeys.has(key))
      )
    );

    await loadCandidates(nextResolvedKeys);
    if (onRefreshProfile) {
      await onRefreshProfile();
    }
  };

  const handleKeepSeparate = async () => {
    const proposals = selectedProposal?.isGroup
      ? selectedProposal.proposals ?? []
      : [selectedProposal];
    for (const proposal of proposals) {
      const leftClaim = proposal?.left;
      const rightClaim = proposal?.right;
      const leftClaimId = leftClaim?.claimId;
      const rightClaimId = rightClaim?.claimId;
      if (onMarkDifferentProposal) {
        await onMarkDifferentProposal(leftClaimId, rightClaimId);
      } else {
        await markMyClaimsDifferent(leftClaim, rightClaim);
      }
    }

    const nextResolvedKeys = new Set(resolvedPairKeys);
    getProposalPairKeys(selectedProposal).forEach((key) => nextResolvedKeys.add(key));
    setResolvedPairKeys(nextResolvedKeys);

    setSelectedProposal(null);
    setInternalCandidates((prev) =>
      prev.filter(
        (proposal) =>
          !getProposalPairKeys(proposal).some((key) => nextResolvedKeys.has(key))
      )
    );

    await loadCandidates(nextResolvedKeys);
    if (onRefreshProfile) {
      await onRefreshProfile();
    }
  };

  const totalCount =
    (total !== undefined ? total : items.length) + candidateGroups.length;
  const hasContent = candidateGroups.length > 0 || items.length > 0;
  const hasVisibleContent = visibleCandidates.length > 0 || visibleItems.length > 0;

  return (
    <>
      <Section
        id="issues"
        count={totalCount}
        open={open}
        onToggle={onToggle}
      >
        <div className="issues-section-content">
          {hasContent && (
            <div className="issues-filter-bar" aria-label="Filter issues by category">
              {categoryFilters.map(([category, config]) => (
                <button
                  key={category}
                  type="button"
                  className={`issues-filter-button ${
                    effectiveCategory === category ? 'active' : ''
                  }`}
                  aria-pressed={effectiveCategory === category}
                  onClick={() => setSelectedCategory(category)}
                >
                  {config.label}
                  <span>{categoryCounts[category]}</span>
                </button>
              ))}
            </div>
          )}

          {isLoading && mergeCandidates.length === 0 && (
            <p className="candidate-loading">Loading candidate issues...</p>
          )}

          {loadError && !isLoading && (
            <p className="candidate-loading" role="alert">
              Possible duplicates could not be loaded.{' '}
              <button type="button" className="candidate-retry" onClick={() => loadCandidates()}>
                Try again
              </button>
            </p>
          )}

        {/* Merge candidate proposals */}
        {visibleCandidates.map((proposal, idx) => {
          const key = `merge-${proposal.groupKey || getProposalPairKeys(proposal)[0] || idx}`;
          const displayProposal = enrichProposalSources(proposal, claimItemsById);
          return (
            <CandidateIssueCard
              key={key}
              proposal={displayProposal}
              pendingReviews={reviewsByMergeGroup?.get(mergeGroupKey(proposal)) ?? 0}
              onOpenComparison={handleOpenComparison}
            />
          );
        })}

        {/* Existing profile issues */}
        {visibleItems.map((i) => (
          <IssueItem
            key={`${i.kind}-${i.id}`}
            issue={i}
            onClick={() => onOpenIssue?.(i)}
            onDismissCopies={onDismissCopies}
          />
        ))}

        {!hasVisibleContent && (
          <p className="empty">
            {hasContent
              ? 'No issues match this category.'
              : totalCount
              ? 'No issues match your search.'
              : 'No issues — everything looks good.'}
          </p>
        )}
        </div>
      </Section>

      {enrichedSelectedProposal && <SuspectedDuplicateDrawer
        key={enrichedSelectedProposal.groupKey || getProposalPairKeys(enrichedSelectedProposal)[0]}
        proposal={enrichedSelectedProposal}
        onClose={handleCloseComparison}
        onResolve={handleResolve}
        onKeepSeparate={handleKeepSeparate}
      />}
    </>
  );
}
