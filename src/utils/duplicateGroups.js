// The claim IDs a merge group covers: a two-claim proposal, or a larger group
// built by groupMergeProposals.
export function groupClaimIds(group) {
  if (Array.isArray(group?.claims) && group.claims.length > 0) {
    return group.claims.map((claim) => claim.claimId);
  }
  return [group?.left?.claimId, group?.right?.claimId].filter(Boolean);
}

// A key for a merge group that does not depend on which object holds it.
export function mergeGroupKey(group) {
  return [...groupClaimIds(group)].sort().join(':');
}

// One issue per fact: review items (extracted values awaiting review) that may
// state the same fact as each other, or as saved claims, are shown together,
// by the same rules that find duplicate claims.
//
// - Items that belong with a merge group are counted on that group's card and
//   reviewed there; they get no card of their own.
// - Other items that state one fact get one card, for their most complete
//   item. It lists every item as a copy and says whether the fact is already
//   in the profile, so the copies can be dismissed together.
//
// Returns the issues to show and, by merge group key, how many review items
// each merge group card stands for.
export function groupReviewIssues(issues, reviewItems, mergeGroups) {
  const parents = new Map();
  const find = (node) => {
    const parent = parents.get(node) ?? node;
    if (parent === node) return node;
    const root = find(parent);
    parents.set(node, root);
    return root;
  };
  const union = (left, right) => {
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parents.set(rightRoot, leftRoot);
  };

  for (const group of mergeGroups) {
    const [first, ...rest] = groupClaimIds(group);
    for (const claimId of rest) union(`claim:${first}`, `claim:${claimId}`);
  }
  const itemsById = new Map(reviewItems.map((item) => [item.reviewItemId, item]));
  for (const item of reviewItems) {
    const node = `review:${item.reviewItemId}`;
    for (const claimId of item.possibleDuplicates?.claimIds ?? []) union(node, `claim:${claimId}`);
    for (const otherId of item.possibleDuplicates?.reviewItemIds ?? []) union(node, `review:${otherId}`);
  }

  const mergeGroupByRoot = new Map(
    mergeGroups.map((group) => [find(`claim:${groupClaimIds(group)[0]}`), mergeGroupKey(group)])
  );
  const reviewsByMergeGroup = new Map();
  const reviewIssuesByRoot = new Map();
  const claimRoots = new Set();
  for (const item of reviewItems) {
    for (const claimId of item.possibleDuplicates?.claimIds ?? []) claimRoots.add(find(`claim:${claimId}`));
  }

  for (const issue of issues) {
    if (issue.kind !== 'review' || !itemsById.has(issue.id)) continue;
    const root = find(`review:${issue.id}`);
    const groupKey = mergeGroupByRoot.get(root);
    if (groupKey) {
      reviewsByMergeGroup.set(groupKey, (reviewsByMergeGroup.get(groupKey) ?? 0) + 1);
      continue;
    }
    reviewIssuesByRoot.set(root, [...(reviewIssuesByRoot.get(root) ?? []), issue]);
  }

  // The item stating the most fields stands for its copies.
  const completeness = (issue) => Object.keys(itemsById.get(issue.id)?.fields ?? {}).length;
  const shown = new Set();
  const grouped = [];
  for (const issue of issues) {
    if (issue.kind !== 'review' || !itemsById.has(issue.id)) {
      grouped.push(issue);
      continue;
    }
    const root = find(`review:${issue.id}`);
    const copies = reviewIssuesByRoot.get(root);
    if (!copies || shown.has(root)) continue;
    shown.add(root);
    const inProfile = claimRoots.has(root);
    if (copies.length === 1 && !inProfile) {
      grouped.push(issue);
      continue;
    }
    const best = copies.reduce((left, right) => (completeness(right) > completeness(left) ? right : left));
    grouped.push({
      ...best,
      copies: copies.map((copy) => copy.id),
      inProfile,
      text: inProfile
        ? `Already in your profile · ${copies.length} ${copies.length === 1 ? 'copy' : 'copies'} from your documents`
        : `${copies.length} copies from your documents · ${best.text}`,
    });
  }

  return { issues: grouped, reviewsByMergeGroup };
}

// The merge group each claim belongs to, by claim ID.
export function indexGroupsByClaim(groups) {
  const byClaim = new Map();
  for (const group of groups) {
    for (const claimId of groupClaimIds(group)) {
      byClaim.set(claimId, group);
    }
  }
  return byClaim;
}

// Shows entries the system suspects are copies of each other as one entry
// until the candidate merges them. Nothing is merged here: the first entry
// stands for the group, lists every copy's sources, and carries the group so
// it can open the comparison. `allItems` holds the copies that the current
// filter hides, so the count and sources stay complete while searching.
export function collapseDuplicates(items, groupByClaim, allItems = items) {
  const shownGroups = new Set();
  const collapsed = [];

  for (const item of items) {
    const group = groupByClaim.get(item.id);
    if (!group) {
      collapsed.push(item);
      continue;
    }
    if (shownGroups.has(group)) continue;
    shownGroups.add(group);

    const claimIds = new Set(groupClaimIds(group));
    const copies = allItems.filter((entry) => claimIds.has(entry.id));
    // Copies still awaiting approval are not listed here, so a group may have
    // a single listed entry; it is shown as it is.
    if (copies.length < 2) {
      collapsed.push(item);
      continue;
    }
    collapsed.push({
      ...item,
      sources: [...new Set(copies.flatMap((entry) => entry.sources ?? []))],
      duplicates: { group, count: copies.length },
    });
  }

  return collapsed;
}
