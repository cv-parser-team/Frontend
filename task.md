# Implementation Plan: Issues Section & Coalescence Table View

Implementation plan to transform issues retrieved from `GET /api/candidates/me/claims/merge-candidates` into the Coalescence table view and resolve them using `POST /api/candidates/me/claims/resolve-batch`.

---

## 1. API Layer Updates ([candidateApi.js](file:///root/workspace/Frontend/src/api/candidateApi.js))
* **Fetch Candidates**: Add `getMyClaimMergeCandidates()` calling `GET /api/candidates/me/claims/merge-candidates` (returns `ClaimMergeCandidateListResponse` with `data: ClaimMergeProposal[]`).
* **Batch Resolution**: Add `resolveMyClaimBatch(actions)` calling `POST /api/candidates/me/claims/resolve-batch` with `ClaimBatchResolutionRequest` containing a single `ClaimBatchMergeAction` for the selected claim:
  ```json
  {
    "actions": [
      {
        "action": "merge_claims",
        "leftClaimId": "<uuid>",
        "rightClaimId": "<uuid>",
        "leftVersion": 1,
        "rightVersion": 1,
        "survivorClaimId": "<uuid>",
        "values": { ... },
        "current": false
      }
    ]
  }
  ```
* *(Optional)* Add `markMyClaimsDifferent(payload)` calling `POST /api/candidates/me/claims/different` (`RecordClaimsDifferentRequest`).

---

## 2. Data Mapping (from [openapi.yml](file:///root/workspace/luminaCV/api-specifications/openapi.yml#L2027-L2085))
Map each `ClaimMergeProposal` into the UI:
* **Header / Context**:
  * Sources: `left` and `right` ([ClaimVersionReference](file:///root/workspace/luminaCV/api-specifications/openapi.yml#L1856)) provide document labels (`Resume.pdf` vs `LinkedIn export`) and version numbers.
  * Status: `requiresCandidateChoice` triggers the `Needs choices` badge; `survivorClaimId` / `survivorReason` designates the default survivor.
* **Table Rows (`fields` map)**:
  * `same`: Identical values $\rightarrow$ auto-matched with green checkmarks (e.g., `Employer`, `End date`, `Location`).
  * `conflict` / `compatible` / `warning`: Marked with `SOURCE_DIFFERENCE` pill $\rightarrow$ interactive radio buttons to choose Source A or Source B.
  * `enrichment` (e.g., array fields like `skills`): Combines unique items with a **"Combine both"** action button.
* **Resolved Column**: Dynamically displays chosen value + resolution status tag (`Auto-matched`, `From Source A`, `From Source B`, `Combined unique skills`).

---

## 3. Component Architecture

1. **Issues List Item** ([IssuesSection.jsx](file:///root/workspace/Frontend/src/components/profile/sections/IssuesSection.jsx))
   * Render candidate cards (e.g. `Work experience · Scale AI`, conflicting fields indicator, `Open comparison` button).
   * Badge issue count in sidebar (`Issues: 14`).
2. **Coalescence Modal / Drawer** (`CoalescenceModal.jsx` / `FieldComparisonTable.jsx`)
   * **Header & Banner**: Title, breadcrumb (`Profile / Issues & resolution`), subtitle, and instruction banner (*"Choose Source A or Source B for every conflicting scalar field..."*).
   * **Comparison Table (4 Columns)**:
     1. **`FIELD`**: Field name, required asterisk `*`, and `SOURCE_DIFFERENCE` badge.
     2. **`SOURCE A · <DOC_A>`**: Radio button / checkmark + value.
     3. **`SOURCE B · <DOC_B>`**: Radio button / checkmark + value.
     4. **`RESOLVED VALUE`**: Resulting value + origin status pill.
   * **Footer**:
     * Endpoint note (`POST /api/candidates/me/claims/resolve-batch`).
     * Primary action: **"Merge selected values"** (disabled until all `unresolvedFields` have a selection).

---

## 4. Progress Tracker & Implementation Steps

- [x] **Step 1: API Client** — Add `getMyClaimMergeCandidates()` and `resolveMyClaimBatch()` to [candidateApi.js](file:///root/workspace/Frontend/src/api/candidateApi.js).
- [x] **Step 2: Comparison Table Component** — Create `FieldComparisonTable.jsx` to render the 4-column layout with radio selection and array merge capabilities.
- [x] **Step 3: Coalescence Modal & State** — Create `CoalescenceModal.jsx` handling banner, selection state, form validation, and payload formulation (`ClaimBatchMergeAction`).
- [x] **Step 4: Issues Section Integration** — Update [IssuesSection.jsx](file:///root/workspace/Frontend/src/components/profile/sections/IssuesSection.jsx) to load merge candidate issues and trigger modal opening on "Open comparison".
- [x] **Step 5: Mutation & Invalidation** — Dispatch `resolveMyClaimBatch` on "Merge selected values", handle success/conflict errors, close modal, and refresh profile and candidates list.
- [x] **Step 6: UI Polish & Verification** — Verify visual alignment with provided mock (fonts, purple selection highlights, pill tags, badges).