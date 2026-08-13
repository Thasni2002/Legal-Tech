# Implementation Plan - Exclude Client Name from eCourts CNR Fetch

Prevent the eCourts CNR lookup from auto-filling the `clientName` field in the Client Details section of the Add Case form (`AddCaseForm.jsx`).

## User Review Required

> [!IMPORTANT]
> Currently, fetching a 16-character CNR number automatically populates case information along with `clientName` (set to the petitioner's name from eCourts, e.g., "Statess of Kerala"). 
> With this change, eCourts CNR fetch will continue auto-populating case parameters (Case Title, Court Name, Court Type, Case Type, Case No, Next Hearing Date, Facts, State, and District) but **will leave the Client Name (`clientName`) untouched** so advocates can manually enter or select their client.

## Open Questions

> [!NOTE]
> 1. Should `clientState` and `clientDistrict` continue auto-populating from eCourts court location data, or should all client location fields also be excluded from auto-fill? *(Default plan: exclude only `clientName` as requested).*

## Proposed Changes

### Frontend - Case Management Component

#### [MODIFY] [AddCaseForm.jsx](file:///c:/Marketbytes/development%20works/legal-tech/frontend/src/views/UI/CaseManagement/AddCaseForm.jsx)

- Update `handleFetchFromECourts` function:
  - Preserve `prev.clientName` when setting form state during eCourts lookup, preventing `data.petitioner` from populating `clientName`.
  - Update `cleanFacts` generation to reference `data.petitioner` directly for facts summary string if necessary, without assigning it to `formData.clientName`.

---

## Verification Plan

### Manual Verification
1. Navigate to Add New Case (`/case-management/add`).
2. Type or paste a valid 16-digit CNR number (e.g. `KLTR040042222021`).
3. Click **Fetch from eCourts** or let auto-fetch trigger.
4. Verify that:
   - Case title, court name, case type, facts, next hearing date, etc., are successfully auto-populated.
   - The **Client Name** field under **Client Details** remains empty (or keeps whatever user manually typed) and is **not** overwritten with petitioner name (e.g. "Statess of Kerala").
