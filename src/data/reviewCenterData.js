
export const reviewSummary = [
  {
    id: "decision",
    title: "Needs your decision",
    count: 5,
    color: "purple",
    filters: [
      { label: "Conflicts", count: 2 },
      { label: "Low confidence", count: 4 },
      { label: "Duplicates", count: 1 },
    ],
  },
  {
    id: "information",
    title: "Needs information",
    color: "orange",
    filters: [
      { label: "Missing", count: 3 },
      { label: "Invalid links", count: 1 },
    ],
  },
  {
    id: "processing",
    title: "Processing problems",
    count: 3,
    color: "red",
    filters: [
      { label: "Extraction", count: 2 },
      { label: "Validation errors", count: 1 },
    ],
  },
];

export const reviewIssues = [
  {
    id: 1,
    title: "Two different end dates",
    field: "Last job end date",
    type: "Conflict",
    source: "Resume_v1.pdf, LinkedIn",
    priority: "High",
    status: "Needs decision",
    action: "Review",
    category: "Conflicts",
    reviewType: "conflict",
    currentValue: "None accepted",
    sourceA: {
      value: "December 2023",
      document: "Resume_v1.pdf",
      confidence: "Medium",
    },
    sourceB: {
      value: "March 2024",
      document: "LinkedIn",
      confidence: "High",
    },
    note: 'Automatic example: "Newer source preferred" for this field, recorded in History.',
  },

  {
    id: 2,
    title: "Date format unclear",
    field: "Education end date",
    type: "Low confidence",
    source: "Resume_Photo.jpg",
    priority: "Medium",
    status: "Needs review",
    action: "Review",
    category: "Low confidence",
    reviewType: "lowConfidence",
    extractedValue: "06/05",
    document: "Resume_Photo.jpg",
    confidence: "Low",
    reason:
      "Unclear date format (day/month or month/year).",
    evidence:
      '"...University of Sample, B.Sc., 06/05..." page 1, left column',
    currentValue: "",
  },

  {
    id: 3,
    title: "Phone number not found",
    field: "Phone",
    type: "Missing (required)",
    source: "All sources",
    priority: "High",
    status: "Needs review",
    action: "Add",
    category: "Missing",
    reviewType: "missing",
    importance: "Required",
    recommendation: "Recommended",
    currentValue: "",
  },

  {
    id: 4,
    title: "Possible duplicate role",
    field: "Experience",
    type: "Duplicate",
    source: "Resume_v1.pdf, LinkedIn",
    priority: "Medium",
    status: "In review",
    action: "Compare",
    category: "Duplicates",
    reviewType: "duplicate",
    currentValue: "Backend Developer",
    sourceA: {
      value: "Backend Developer",
      document: "Resume_v1.pdf",
    },
    sourceB: {
      value: "Backend Developer",
      document: "LinkedIn",
    },
  },

  {
    id: 5,
    title: "Link cannot be opened",
    field: "Portfolio URL",
    type: "Invalid link",
    source: "Resume_v1.pdf",
    priority: "Low",
    status: "Needs review",
    action: "Fix",
    category: "Invalid links",
    reviewType: "invalidLink",
    currentValue: "http://amina-haddad.dev/work",
  },

  {
    id: 6,
    title: "Text partly unreadable",
    field: "Summary",
    type: "Extraction issue",
    source: "Resume_Photo.jpg",
    priority: "Medium",
    status: "Processing issue",
    action: "Retry",
    category: "Extraction",
    reviewType: "extraction",
    currentValue: "",
  },
];

export const reviewFilters = {
  types: [
    "All",
    "Conflict",
    "Low confidence",
    "Missing (required)",
    "Duplicate",
    "Invalid link",
    "Extraction issue",
  ],

  statuses: [
    "All",
    "Needs decision",
    "Needs review",
    "In review",
    "Processing issue",
    "Resolved",
    "Dismissed",
  ],

  priorities: ["All", "High", "Medium", "Low"],

  sources: [
    "All",
    "Resume_v1.pdf",
    "Resume_Photo.jpg",
    "LinkedIn",
  ],
};

export const initialSelectedIssueId = 1;
