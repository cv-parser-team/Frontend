// The claim IDs a merge group covers: a two-claim proposal, or a larger group
// built by groupMergeProposals.
export function groupClaimIds(group) {
  if (Array.isArray(group?.claims) && group.claims.length > 0) {
    return group.claims.map((claim) => claim.claimId);
  }
  return [group?.left?.claimId, group?.right?.claimId].filter(Boolean);
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
