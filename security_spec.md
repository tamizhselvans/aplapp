# Security Spec for FieldPulse

## 1. Data Invariants
- A `Response` cannot exist without a valid `Prediction` ID.
- A user can only access and modify their own profile.
- Prediction outcomes and match data are read-only for clients.
- `fanPower` can only be incremented via valid actions (conceptual, server-side in real app, here we guard immutability).

## 2. The "Dirty Dozen" Payloads (Deny Cases)
1. Creating a User profile for a different UID.
2. Manually updating `fanPower` to a billion.
3. Updating a Prediction's `correctOption`.
4. Deleting a Match document.
5. Creating a Response for another user.
6. Updating a Response after it has been created (immutability).
7. Injecting 1MB of text into a Match's `id`.
8. Reading another user's PII (if any).
9. Creating a Match as a regular user.
10. Skipping a Prediction's status from `open` to `resolved` without the correct keys.
11. Spoofing `createdAt` with a client-side timestamp.
12. Listing all Responses for all predictions (query must be targeted).

## 3. The Test Plan
Verify that writing to `/matches/any` fails for non-admins.
Verify that `allow list` on `/users` fails without a specific `uid` filter.
Verify that `isValidUser` checks schema keys strictly.
