import { getIssues } from '../data/profileData';
import { groupReviewIssues, indexGroupsByClaim } from './duplicateGroups';

export function getGroupedProfileIssues(data, mergeGroups) {
  const groupByClaim = indexGroupsByClaim(mergeGroups);
  return groupReviewIssues(
    getIssues(data).filter(
      (issue) => !(issue.kind === 'claimReview' && groupByClaim.has(issue.id))
    ),
    data.reviewItems ?? [],
    mergeGroups
  );
}
