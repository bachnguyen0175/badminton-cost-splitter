# Implementation Plan

- [ ] 1. Project Setup and Core Infrastructure
- [x] 1.1 Scaffold the project with Vite, React 18, TypeScript, Tailwind CSS 3, and React Router v6
  - Initialize a Vite 5 project with the React TypeScript template
  - Install and configure Tailwind CSS with mobile-first defaults and production purge
  - Install React Router v6 and set up a basic two-route structure: `/` (main session screen) and `/history` (placeholder)
  - Verify the dev server runs, hot module replacement works, and the production build succeeds
  - _Requirements: 9.2, 10.1_

- [x] 1.2 Set up the Dexie database with schema for players and sessions tables
  - Install Dexie.js v4 and create the database instance with version 1 schema
  - Define `players` table with `id` primary key (string, not auto-increment) and unique `name` index
  - Define `sessions` table with `id` primary key and `date` index for sorted queries
  - Use `crypto.randomUUID()` for ID generation in the service layer (not Dexie auto-increment)
  - Define shared TypeScript types for Player, SessionRecord, CostItem, PayerEntry, Transfer, and the Result discriminated union
  - _Requirements: 1.1, 8.1, 12.1, 12.2_

- [x] 2. Settlement Engine
  - Implement the settlement calculation as a pure function with no side effects or external dependencies
  - Compute net balance per participant (amount paid minus fair share of total cost)
  - Use a greedy algorithm that iteratively matches the largest creditor with the largest debtor to minimize total transfers
  - Round each transfer independently to the nearest 1,000 VND using `Math.round(exactAmount / 1000) * 1000`
  - Preserve exact amounts alongside rounded amounts in each transfer result
  - Handle the solo-session edge case (single participant) by returning an empty transfer list with `isSoloSession: true`
  - Write unit tests covering: 1 player (solo), 2 players, 5 players, 10 players, single payer, multiple payers, VND rounding edge cases (amounts ending in 500), and symmetrical debt scenarios
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 3. Player Management
- [x] 3.1 (P) Implement the player service with CRUD operations and validation
  - Add a player: trim the name, reject empty/whitespace-only names, reject duplicates via case-insensitive comparison, generate UUID, persist to database
  - Edit a player: validate the new name with the same rules, update the record in the database
  - Delete a player: remove the player from the database (does not affect historical sessions which store name snapshots)
  - Return `Result<T, E>` discriminated union for all operations to enable exhaustive error handling at call sites
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 3.2 (P) Implement the reactive player list hook using Dexie's `useLiveQuery`
  - Wrap `db.players.toArray()` in `useLiveQuery` to provide a live-updating player array
  - Components consuming this hook re-render automatically when players are added, edited, or deleted
  - _Requirements: 1.1, 2.1_

- [x] 3.3 Build the player management modal UI
  - Display a list of all players with options to edit name inline and delete each player
  - Provide an input field and button to add a new player
  - Show inline validation errors for empty names and duplicate names
  - Open as a modal overlay on the main session screen only (not accessible from history)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 4. Session Form State Management
- [x] 4.1 Implement the session form hook managing all form state and mutation actions
  - Track selected participant IDs, cost items array, session note, selected payer IDs, payer entries, `isCopied` flag, and `isPersisted` flag
  - Accept the live player list as a parameter for active session reconciliation
  - Provide actions: toggle player, select/deselect all, add/update/remove cost item (enforce max 10 items), toggle payer, update payer amount, set session note, reset session, mark copied, mark persisted
  - When a single payer is selected, auto-fill their amount with the total cost; when an additional payer is added, clear auto-fill and show individual fields
  - Ensure `selectedPayerIds` is always a subset of `selectedPlayerIds` — deselecting a participant also removes them from payers
  - Reset `isCopied` to false on any input modification; reset `isPersisted` to false on any input modification after persistence
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.7, 4.1, 4.2, 5.1, 5.2, 5.3, 5.7_

- [x] 4.2 Implement the derived values hook computing totals and settlement in real time
  - Compute auto-summed total cost from all valid cost items
  - Compute payer total and validate it matches the session total cost
  - Determine settlement validity: participants selected, costs entered, payer amounts matching total
  - Call the settlement engine to produce transfer results when all inputs are valid
  - Use `useMemo` with full form state as dependency to ensure recomputation within 100ms on any change
  - _Requirements: 3.3, 5.4, 5.5, 6.1, 9.3_

- [x] 4.3 Implement active session reconciliation when a player is deleted
  - Watch the live player list via `useEffect` and intersect with current selected participant and payer IDs
  - If reconciliation removes the last participant, reset to no participants and disable cost input
  - If reconciliation removes the last payer, reset payer state and disable settlement
  - If reconciliation reduces payers from multiple to exactly one, auto-fill the remaining payer's amount with total cost
  - Display a brief toast notification when reconciliation alters the session state
  - _Requirements: 1.3, 2.2_

- [ ] 5. Session UI Components
- [x] 5.1 (P) Build the player selector with chip-based toggle selection
  - Display all players from the database as tappable chips optimized for thumb-zone interaction (minimum 44x44px)
  - Toggle participation status on tap and update active participant count immediately
  - Provide a Select All / Deselect All toggle button
  - When no participants are selected, disable the cost input area and show "Please select players before calculating"
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 10.2_

- [x] 5.2 (P) Build the cost input panel with multi-item support and auto-sum
  - Render an initial cost line item with label/description and amount input fields
  - "Add More" button appends additional rows; hide the button when 10 items are reached
  - Accept only numeric values greater than zero; show field-level validation error for zero or negative amounts
  - Display auto-summed total cost in real time, excluding invalid items
  - Allow removing individual cost line items with immediate total recalculation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 5.3 (P) Build the session note input field
  - Display an optional free-text input alongside the cost input area
  - Persist the note value in the session form state for inclusion in the session record
  - _Requirements: 4.1, 4.2_

- [x] 5.4 (P) Build the payer panel with single and multiple payer logic
  - Display selected session participants as selectable payer chips
  - When exactly one payer is selected, auto-fill their amount with the total session cost
  - When multiple payers are selected, display individual amount input fields for each
  - Validate that each payer amount is positive; show field-level error for zero or negative values
  - Display a prominent red warning when the sum of payer amounts does not match the total cost
  - Disable settlement display and copy button while payer amounts are invalid or mismatched
  - When an additional payer is selected after single-payer auto-fill, clear the auto-fill and show individual fields
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [x] 5.5 Build the settlement display showing transfer results
  - Render the list of settlement transfers with rounded amounts (nearest 1,000 VND)
  - Show exact amounts as subtle sub-text beneath each rounded figure
  - Display "Solo session — no debts to settle" when only one participant is in the session
  - Only display when all inputs are valid (no page navigation required — single-screen design)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 10.3_

- [ ] 6. Clipboard, Copy, and Session Persistence
- [x] 6.1 (P) Implement the clipboard service with formatted text generation
  - Format settlement transfers as human-readable Vietnamese text following the defined template (date, note, total with item breakdown, participant count, transfer results)
  - Format all amounts with `Intl.NumberFormat('vi-VN')` and VND rounding
  - Use `navigator.clipboard.writeText()` for clipboard access; catch errors and return `{ success: false, text }` on failure
  - Always return the formatted text alongside the success status so the UI can use it for fallback display
  - _Requirements: 7.1, 7.2_

- [x] 6.2 (P) Implement the session service for persisting and querying session records
  - Save a full session snapshot (participants, cost items, total cost, payers, transfers, note, date) as a denormalized document in IndexedDB
  - Query all sessions sorted by date descending for the history list
  - Retrieve a single session by ID for the detail view
  - Delete a session by ID
  - Implement a reactive `useSessionList` hook wrapping `useLiveQuery` for live-updating session list in the history UI
  - _Requirements: 8.1, 8.2_

- [x] 6.3 Build the copy button with the persist-then-copy flow
  - Enable only when settlement results are valid and complete
  - Deduplication guard: if session is already persisted, skip persistence and only attempt clipboard copy
  - Execution order: (1) persist session via session service and mark as persisted, (2) attempt clipboard copy
  - Show toast "Saved & Copied" on full success, "Copied" if already persisted, or "Session saved" if clipboard fails
  - On clipboard failure, open the clipboard fallback modal with the formatted text
  - _Requirements: 7.1, 7.2, 7.3, 8.1_

- [x] 6.4 Build the clipboard fallback modal for manual copy
  - Display the settlement summary text in a read-only, selectable textarea so users can manually select-all and copy
  - Provide a "Close" button to dismiss the modal
  - Triggered when the clipboard service returns `{ success: false }`
  - _Requirements: 7.1, 7.2_

- [ ] 7. Session History Feature
- [x] 7.1 Build the history list displaying session cards sorted by date
  - Display session cards with date, total cost, and list of participant names, sorted newest first
  - Use the reactive session list hook for live updates when sessions are added or deleted
  - Implement swipe-to-delete gesture or delete button on each card
  - Show a confirmation dialog before deleting a session
  - _Requirements: 8.2, 8.3, 8.5_

- [x] 7.2 Build the session detail view with full session data
  - Display all cost line items with labels and amounts
  - Display payer breakdown showing who paid and how much
  - Display settlement transfer results with rounded and exact amounts
  - Display the session note if one was recorded
  - Navigate back to the history list via browser back button
  - _Requirements: 8.4_

- [x] 8. New Session Reset with Unsaved Data Guard
  - Display a "New Session" button accessible from the main screen
  - When tapped, check if current session has valid settlement results that have not been persisted
  - If unsaved: show a dialog with three options — "Save & Copy" (persist + clipboard), "Save Only" (persist without clipboard), and "Discard" (lose data), plus "Cancel" to dismiss
  - On reset: clear all inputs (cost items, payer selections, session note, settlement results, `isCopied`, `isPersisted`) and return to the initial participant selection state
  - Preserve the player list in the local database (do not clear players on reset)
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 9. Main Screen Integration and Routing
- [x] 9.1 Compose the main session screen with all session components wired together
  - Integrate player selector, cost input panel, session note input, payer panel, settlement display, copy button, and new session button into a single-screen layout
  - Wire the session form hook and derived values hook to all components
  - Include the player management modal accessible from the header
  - Ensure all components share form state and derived values correctly
  - _Requirements: 10.3, 9.1_

- [x] 9.2 Set up React Router with lazy-loaded history route and header navigation
  - Configure `/` route for the main session screen and `/history` for the history screen
  - Lazy-load the history screen route for code splitting
  - Build the header with navigation icons for history and player management
  - Ensure browser back-button support from history and session detail views
  - _Requirements: 8.2, 9.2_

- [ ] 10. PWA, Offline Support, and Mobile Polish
- [x] 10.1 Configure PWA manifest and service worker via vite-plugin-pwa
  - Install and configure vite-plugin-pwa with Workbox precaching and prompt update strategy
  - Create the PWA manifest with app name, icons, theme color, and standalone display mode
  - Ensure the app is installable from the home screen and launchable while offline
  - Verify all core functionality works without an internet connection (session creation, calculation, history, player management)
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 10.2 Apply mobile-first responsive design and performance optimization
  - Ensure responsive layout adapts from 320px to 1440px screen width
  - Verify all interactive elements meet minimum 44x44px touch target size
  - Optimize for smooth rendering without jank or layout shifts on mobile devices
  - Validate the standard flow completes in under 10 seconds of user interaction
  - Verify initial load is interactive within 2 seconds (Lighthouse audit)
  - Ensure derived values update within 100ms of input changes
  - Apply Vite code splitting and Tailwind CSS purge for minimal production bundle
  - _Requirements: 9.1, 9.2, 9.3, 10.1, 10.2, 10.3, 10.4_

- [ ] 11. Testing
- [x] 11.1 Write unit tests for PlayerService
  - Test add player: valid name, empty name rejection, whitespace-only rejection, duplicate name (case-insensitive) rejection
  - Test edit player: valid rename, duplicate name rejection, not-found error
  - Test delete player: successful deletion, not-found error
  - Verify Result<T, E> return values for all error paths
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 11.2 Write unit tests for useSessionForm and useSessionDerived hooks
  - Test state transitions: toggle player, add/update/remove cost items, toggle payer, set note
  - Test derived values: auto-sum total, payer total validation, settlement validity
  - Test single-payer auto-fill and multi-payer transition (clear auto-fill on second payer)
  - Test `isCopied` resets to false on any input modification after copy
  - Test `isPersisted` resets to false on any input modification after persistence
  - Test reset flow: guard condition `hasValidSettlement && !isPersisted`, full state clear
  - Test `selectedPayerIds` is always a subset of `selectedPlayerIds`
  - Test active session reconciliation: delete last participant, delete last payer, multi-to-single payer auto-fill, delete sole auto-filled payer
  - _Requirements: 2.1-2.5, 3.1-3.7, 5.1-5.7, 11.1-11.3_

- [x] 11.3 Write unit tests for VND formatting utility
  - Test rounding to nearest 1,000 VND (Math.round)
  - Test locale formatting with `Intl.NumberFormat('vi-VN')`
  - Test exact vs rounded amount display logic
  - Test edge cases: amounts ending in 500 (round-half boundary), very small amounts, zero
  - _Requirements: 6.2, 6.3_

- [x] 11.4 Write integration tests for core flows
  - Full session flow: select players → enter costs → select payer → verify settlement → copy → verify persistence in IndexedDB
  - Player management flow: add player → verify appears in selector → delete → verify removed from selector and active session
  - History flow: complete session → navigate to history → verify card data → open detail → verify all fields
  - _Requirements: 1.1-1.3, 2.1, 6.1, 7.1, 8.1-8.4_

- [x] 11.5 Write E2E tests for critical paths
  - Happy path: 3 players, 1 cost item, 1 payer, copy result (verify under 10 seconds interaction)
  - Multiple payers with amount mismatch: verify red warning and disabled settlement/copy
  - New session reset with unsaved data: verify 4-option prompt dialog behavior
  - History navigation: main screen → history → session detail → back button
  - Offline: complete full flow while disconnected (PWA service worker active)
  - _Requirements: 9.1, 5.5, 11.3, 8.2, 8.4, 12.1_

## Requirements Coverage

| Requirement | Task(s) |
|-------------|---------|
| 1.1, 1.2, 1.3, 1.4, 1.5 | 3.1, 3.2, 3.3, 4.3, 11.1, 11.4 |
| 2.1, 2.2, 2.3, 2.4, 2.5 | 4.1, 5.1, 11.2, 11.4 |
| 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7 | 4.1, 4.2, 5.2, 11.2 |
| 4.1, 4.2 | 4.1, 5.3 |
| 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7 | 4.1, 4.2, 5.4, 11.2, 11.5 |
| 6.1, 6.2, 6.3, 6.4, 6.5 | 2, 5.5, 11.3, 11.4 |
| 7.1, 7.2, 7.3 | 6.1, 6.3, 6.4, 11.4 |
| 8.1, 8.2, 8.3, 8.4, 8.5 | 6.2, 6.3, 7.1, 7.2, 9.2, 11.4, 11.5 |
| 9.1, 9.2, 9.3 | 1.1, 4.2, 9.1, 9.2, 10.2, 11.5 |
| 10.1, 10.2, 10.3, 10.4 | 1.1, 5.1, 5.5, 9.1, 10.2 |
| 11.1, 11.2, 11.3 | 8, 11.2, 11.5 |
| 12.1, 12.2, 12.3 | 1.2, 10.1, 11.5 |
