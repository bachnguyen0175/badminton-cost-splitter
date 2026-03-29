# Badminton Cost Splitter — Requirements

## Introduction
A Progressive Web App (PWA) for splitting badminton session costs among players. Built with a "single-screen design" philosophy, the app targets completing a full cost-splitting session in under 10 seconds. The main flow covers four steps: select participants, enter itemized costs, select who paid, and view real-time settlement results. Auxiliary features include player management (one-time setup) and session history with master-detail navigation.

## Requirements

### Requirement 1: Player Management
**Objective:** As a user, I want to manage a persistent list of players, so that I can quickly select participants for each session without re-entering names.

#### Acceptance Criteria
1. When the user adds a new player name, the App shall persist the player to the local database and display the player in the player list.
2. When the user edits an existing player's name, the App shall update the player record in the local database and reflect the change across all views.
3. When the user deletes a player, the App shall remove the player from the local database and remove the player from the player list.
4. If the user attempts to add a player name that already exists, the App shall display a duplicate-name warning and prevent the duplicate entry.
5. If the user attempts to add an empty or whitespace-only player name, the App shall display a validation error and prevent the entry.

### Requirement 2: Player Selection for Session
**Objective:** As a user, I want to select which players participate in the current session, so that costs are split only among active participants.

#### Acceptance Criteria
1. The App shall display all players from the local database as selectable items (chips/buttons) optimized for thumb-zone tapping.
2. When the user taps a player chip, the App shall toggle that player's participation status and update the active participant count immediately.
3. When the user selects at least one participant, the App shall enable the cost input area.
4. If the user has not selected any participants and attempts to enter costs, the App shall display a message "Please select players before calculating" and prevent cost entry.
5. The App shall provide a Select All / Deselect All toggle to quickly select or deselect all players.

### Requirement 3: Multi-Item Cost Input
**Objective:** As a user, I want to enter multiple cost line items (e.g., court fee, shuttlecocks, drinks), so that the total session cost is accurately captured.

#### Acceptance Criteria
1. The App shall provide an initial cost line-item input field with a label/description and an amount field.
2. When the user taps the "Add More" button, the App shall append an additional cost line-item input row.
3. When the user enters or modifies any cost line-item amount, the App shall recalculate and display the auto-summed total cost in real time.
4. When the user removes a cost line item, the App shall recalculate and display the updated total cost immediately.
5. If the user enters a zero or negative amount for a cost line item, the App shall display a validation error on that field and exclude the invalid item from the total until corrected.
6. The App shall accept only numeric values greater than zero for cost amounts.
7. The App shall support a maximum of 10 cost line items per session. When the limit is reached, the App shall hide the "Add More" button.

### Requirement 4: Session Note
**Objective:** As a user, I want to optionally attach a free-text note to the session, so that I can record context (e.g., location, occasion) for future reference.

#### Acceptance Criteria
1. Where the session note feature is included, the App shall display an optional free-text input field alongside the cost input area.
2. When the user enters a session note, the App shall persist the note with the session record.

### Requirement 5: Who-Paid Assignment
**Objective:** As a user, I want to specify which player(s) paid and how much each paid, so that the settlement calculation is accurate.

#### Acceptance Criteria
1. The App shall display all selected session participants as selectable payers.
2. When the user selects exactly one payer, the App shall auto-fill that payer's amount with the total session cost.
3. When the user selects two or more payers, the App shall display individual amount input fields for each selected payer.
4. While multiple payers are selected, when the user modifies any payer's amount, the App shall recalculate the sum of all payer amounts in real time.
5. If the sum of payer amounts does not equal the total session cost, the App shall display a prominent red warning indicating the mismatch and disable the settlement result view and copy button.
6. If any payer amount is zero or negative, the App shall display a validation error on that field and disable the settlement result view and copy button.
7. When the user selects an additional payer after a single payer was auto-filled, the App shall clear the auto-filled amount and display individual input fields for all selected payers.

### Requirement 6: Real-Time Settlement Calculation
**Objective:** As a user, I want to see instantly who owes whom and how much, so that I can settle debts right after the session.

#### Acceptance Criteria
1. When all inputs are valid (participants selected, costs entered, payer amounts matching total), the App shall calculate and display settlement transfers in real time without page navigation.
2. The App shall display all settlement amounts rounded to the nearest thousand VND (e.g., 167,000 instead of 166,667).
3. Where a rounding difference exists between the displayed amount and the exact amount, the App shall show the original exact amount as a subtle sub-text or tooltip beneath the rounded figure.
4. When only one participant is in the session, the App shall display a friendly message (e.g., "Solo session — no debts to settle") instead of settlement transfers.
5. The App shall minimize the total number of transfers required to settle all debts (optimal debt simplification).

### Requirement 7: Copy Settlement to Clipboard
**Objective:** As a user, I want to copy the settlement summary as human-readable text with one tap, so that I can easily share it via messaging apps.

#### Acceptance Criteria
1. When the user taps the copy button, the App shall generate a friendly, human-readable text summary of the settlement and copy it to the system clipboard.
2. When the copy action succeeds, the App shall display a brief confirmation feedback (e.g., toast notification).
3. While settlement results are invalid or incomplete, the App shall disable the copy button.

### Requirement 8: Session Persistence and History
**Objective:** As a user, I want to view past sessions and their details, so that I can review previous cost splits and settlements.

#### Acceptance Criteria
1. When the user triggers a save action (via the Copy button, or "Save & Copy"/"Save Only" from the reset dialog) with valid settlement results, the App shall persist the full session record (participants, cost items, payers, settlement results, note, date) to the local database if not already persisted.
2. When the user taps the history icon in the header, the App shall display a history screen showing session cards sorted by date (newest first).
3. The App shall display each session card with the date, total cost, and list of participants.
4. When the user taps a session card, the App shall display the session detail view showing all cost line items, payer breakdown, settlement results, and session note (if any).
5. When the user performs a swipe-to-delete gesture or taps a delete button on a session card, the App shall remove the session from the local database after confirmation.

### Requirement 9: Performance
**Objective:** As a user, I want the app to load and respond quickly, so that cost splitting feels instant and frictionless.

#### Acceptance Criteria
1. The App shall complete the standard flow (select 3 existing players, enter 1 cost item, select 1 payer, copy result) in under 10 seconds of user interaction time.
2. The App shall load and become interactive within 2 seconds on a standard mobile connection.
3. While the user modifies any input field, the App shall update all derived values (auto-sum, settlement results) within 100 milliseconds.

### Requirement 10: Mobile-First Responsive Design
**Objective:** As a user, I want the app to be optimized for mobile use, so that I can comfortably split costs on my phone right after a badminton session.

#### Acceptance Criteria
1. The App shall render a mobile-first responsive layout that adapts to screen sizes from 320px to 1440px width.
2. The App shall display all interactive elements (buttons, chips, input fields) with touch-friendly sizing optimized for thumb-zone interaction (minimum 44x44px tap targets).
3. The App shall complete all cost-splitting operations on a single screen without page navigation (single-screen design).
4. The App shall render smoothly without jank or layout shifts during user interaction on mobile devices.

### Requirement 11: New Session / Reset
**Objective:** As a user, I want to start a new cost-splitting session quickly after finishing the current one, so that I can handle consecutive sessions without reloading the app.

#### Acceptance Criteria
1. The App shall display a "New Session" button accessible from the main screen.
2. When the user taps "New Session", the App shall clear all current inputs (cost items, payer selections, session note, settlement results) and reset to the initial participant selection state while preserving the player list in the local database.
3. If the current session has valid settlement results that have not yet been persisted, the App shall prompt the user with options to "Save & Copy" (persist and copy to clipboard), "Save Only" (persist without clipboard), "Discard" (lose data), or "Cancel" (dismiss dialog) before resetting.

### Requirement 12: Offline Support
**Objective:** As a user, I want the app to work fully without an internet connection, so that I can split costs at any venue regardless of connectivity.

#### Acceptance Criteria
1. The App shall function fully without an internet connection, including creating sessions, calculating settlements, viewing history, and managing players.
2. The App shall store all data locally and not depend on any remote server for core functionality.
3. The App shall be installable as a PWA and launchable from the home screen while offline.
