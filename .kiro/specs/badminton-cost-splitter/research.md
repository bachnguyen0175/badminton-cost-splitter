# Research & Design Decisions — Badminton Cost Splitter

## Summary
- **Feature**: badminton-cost-splitter
- **Discovery Scope**: New Feature (greenfield PWA)
- **Key Findings**:
  - React + Vite + vite-plugin-pwa provides the most mature offline-first PWA development experience with minimal configuration
  - Dexie.js v4 over IndexedDB delivers a clean async API with reactive queries (useLiveQuery) ideal for real-time UI updates
  - Net-balance greedy algorithm is sufficient for optimal debt simplification in small groups (≤20 players)

## Research Log

### PWA Framework Selection
- **Context**: Greenfield project requiring offline-first PWA with mobile-first responsive design, fast load times (<2s), and real-time UI updates
- **Sources Consulted**: Vite documentation, React PWA guides, vite-plugin-pwa documentation, Workbox documentation
- **Findings**:
  - React 18+ with Vite offers fast HMR, optimized builds, and broad ecosystem support
  - vite-plugin-pwa (powered by Workbox) provides automatic service worker generation, precaching, and runtime caching with minimal config
  - Svelte/SolidJS are lighter but have smaller ecosystems; React's maturity and tooling outweigh the small bundle size difference for this app
  - Vite's build output is tree-shaken and code-split, supporting the <2s load target
- **Implications**: React + Vite + TypeScript as the core framework; vite-plugin-pwa for service worker and installability

### Local Database / Offline Storage
- **Context**: App requires persistent local storage for players, sessions, and history with no remote server dependency
- **Sources Consulted**: Dexie.js v4 documentation, IndexedDB API specification, localForage comparison
- **Findings**:
  - IndexedDB is the only browser storage API with sufficient capacity and structure for relational-like data
  - Dexie.js v4 provides a clean Promise-based API, schema versioning, compound indexes, and `useLiveQuery` hook for React integration
  - `useLiveQuery` enables automatic UI re-renders when underlying data changes — ideal for real-time settlement recalculation
  - localStorage/sessionStorage are too limited (5MB, string-only); localForage lacks reactive queries
- **Implications**: Dexie.js v4 as the IndexedDB wrapper; schema versioning for future migrations

### Debt Simplification Algorithm
- **Context**: Requirement 6.5 mandates minimizing total number of transfers to settle all debts
- **Sources Consulted**: Splitwise engineering blog, algorithm literature on minimum cash flow problem
- **Findings**:
  - The "minimum transfers" problem is NP-hard in the general case, but for small groups (≤20) a greedy net-balance approach is optimal
  - Algorithm: (1) compute net balance per participant (amount paid minus fair share), (2) iteratively match the largest creditor with the largest debtor, (3) settle the minimum of the two amounts, repeat until all balances are zero
  - This greedy approach produces optimal results for most practical cases and runs in O(n²) time
  - Rounding to nearest 1,000 VND must be applied after settlement calculation, with exact amounts preserved for display
- **Implications**: Implement greedy net-balance algorithm; handle VND rounding as a display concern with exact amounts as sub-text

### VND Currency Handling
- **Context**: Requirement 6.2 specifies rounding to nearest thousand VND; 6.3 requires showing exact amounts
- **Sources Consulted**: Vietnamese currency conventions, JavaScript number precision
- **Findings**:
  - VND has no decimal subdivisions (smallest unit is 1 VND); practical transactions use 1,000 VND increments
  - JavaScript `Math.round(amount / 1000) * 1000` is sufficient for rounding; no floating-point precision issues since amounts are integer VND
  - Intl.NumberFormat with locale `vi-VN` and currency `VND` handles formatting
- **Implications**: Store all amounts as integer VND; round only for display; use Intl.NumberFormat for locale-aware formatting

### Clipboard API for Settlement Sharing
- **Context**: Requirement 7.1 requires one-tap copy of settlement summary to clipboard
- **Sources Consulted**: Clipboard API documentation, browser compatibility data
- **Findings**:
  - `navigator.clipboard.writeText()` is supported in all modern mobile browsers (Chrome 66+, Safari 13.1+, Firefox 63+)
  - Requires secure context (HTTPS or localhost) — satisfied by PWA deployment
  - Fallback via `document.execCommand('copy')` for older browsers is deprecated but available
- **Implications**: Use Clipboard API as primary; no fallback needed given PWA target audience

### Mobile-First UI Approach
- **Context**: Requirements 10.1-10.4 mandate mobile-first responsive design with thumb-zone optimization
- **Sources Consulted**: Material Design touch target guidelines, Tailwind CSS documentation
- **Findings**:
  - Tailwind CSS provides utility-first approach with built-in responsive breakpoints (sm:640px, md:768px, lg:1024px, xl:1280px)
  - Minimum 44x44px touch targets align with both Apple HIG and Material Design guidelines
  - Single-screen design achievable with scrollable sections and sticky header/footer
  - CSS `scroll-behavior: smooth` and `overscroll-behavior: contain` improve mobile feel
- **Implications**: Tailwind CSS for styling; design all interactive elements with minimum 44x44px tap targets

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Feature-based modules | Group by feature (players, session, history) with shared core | Clear ownership, parallel development, simple mental model | Slight duplication of patterns across features | Best fit for small-to-medium PWA |
| Layered architecture | Strict layers (UI → hooks → services → data) | Clean separation of concerns, testable | Over-engineering for a local-only app | Useful as internal structure within features |
| Hybrid feature + layered | Feature modules internally organized as UI → logic → data | Combines benefits: feature isolation + clean layers | Slightly more directory structure | Selected approach |

## Design Decisions

### Decision: React + Vite + TypeScript
- **Context**: Need a modern, fast-building PWA framework with strong typing and ecosystem
- **Alternatives Considered**:
  1. Vue 3 + Vite — Good DX, smaller community for PWA patterns
  2. Svelte + SvelteKit — Smallest bundle, less mature PWA tooling
  3. React + Vite — Largest ecosystem, excellent PWA plugins, strong TypeScript support
- **Selected Approach**: React 18 + Vite + TypeScript with vite-plugin-pwa
- **Rationale**: Broadest ecosystem support, excellent TypeScript integration, vite-plugin-pwa provides zero-config service worker generation
- **Trade-offs**: Slightly larger bundle than Svelte, but tree-shaking and code splitting keep it within performance budget
- **Follow-up**: Verify vite-plugin-pwa configuration for offline-first caching strategy

### Decision: Dexie.js v4 for Local Storage
- **Context**: Need structured local storage with reactive queries for real-time UI updates
- **Alternatives Considered**:
  1. Raw IndexedDB API — Too verbose, no reactive queries
  2. localForage — Simple KV store, no structured queries or reactivity
  3. Dexie.js v4 — Structured IndexedDB wrapper with useLiveQuery for React
- **Selected Approach**: Dexie.js v4 with useLiveQuery hook
- **Rationale**: Only option providing both structured queries and React-native reactivity; schema versioning supports future migrations
- **Trade-offs**: Additional dependency (~40KB gzipped), but eliminates boilerplate for IndexedDB operations
- **Follow-up**: Define schema versions upfront; plan migration strategy for v2+ schemas

### Decision: Greedy Net-Balance Algorithm for Debt Simplification
- **Context**: Need to minimize number of settlement transfers (Req 6.5)
- **Alternatives Considered**:
  1. Pairwise settlement — Simple but produces maximum transfers
  2. Greedy net-balance — Optimal for small groups, O(n²)
  3. Graph-based minimum flow — Optimal for all cases but complex to implement
- **Selected Approach**: Greedy net-balance algorithm
- **Rationale**: Optimal for group sizes typical in badminton sessions (2-20 players); simple to implement and verify
- **Trade-offs**: Not provably optimal for all edge cases, but practically optimal for expected group sizes
- **Follow-up**: Unit test with various group sizes to confirm optimality

### Decision: Clipboard Text Format and Fallback Strategy
- **Context**: Settlement summary must be "human-readable" for sharing via Zalo/Messenger (Req 7.1); Clipboard API may fail in in-app browsers
- **Alternatives Considered**:
  1. Freeform text — each developer invents their own format
  2. Structured template with emoji markers — scannable, consistent, Vietnamese-friendly
  3. JSON/structured data — not human-readable for messaging
- **Selected Approach**: Fixed Vietnamese template with emoji section markers (🏸💰👥💸) and a fallback selectable-text modal when Clipboard API fails
- **Rationale**: Emojis provide visual anchors in chat apps; fixed template prevents inconsistency across implementations; fallback modal covers in-app browsers (Zalo, Facebook) that lack secure context
- **Trade-offs**: Template is opinionated; no user customization. Acceptable for MVP scope.
- **Follow-up**: Validate template rendering in Zalo and Messenger in-app browsers

### Decision: Tailwind CSS for Styling
- **Context**: Need mobile-first responsive styling with minimal overhead
- **Alternatives Considered**:
  1. CSS Modules — Scoped but verbose for responsive design
  2. Styled-components — Runtime overhead, less ideal for performance targets
  3. Tailwind CSS — Utility-first, built-in responsive, no runtime overhead
- **Selected Approach**: Tailwind CSS v3+
- **Rationale**: Zero runtime overhead, built-in responsive breakpoints, utility classes enable rapid mobile-first development
- **Trade-offs**: HTML can become verbose with many utility classes; mitigated by component extraction
- **Follow-up**: Configure Tailwind purge for minimal production bundle

## Risks & Mitigations
- **IndexedDB storage limits on mobile** — Modern browsers allow 50MB+ for PWAs; badminton session data is minimal (<1MB for thousands of sessions). Mitigation: monitor storage usage, implement optional history cleanup.
- **Service worker caching conflicts during updates** — Stale cache can serve outdated app versions. Mitigation: vite-plugin-pwa provides `prompt` update strategy; implement update notification toast.
- **Clipboard API permission on iOS Safari** — May require user gesture. Mitigation: copy action is always triggered by explicit tap, satisfying gesture requirement.
- **VND rounding discrepancies** — Rounding each transfer independently can cause total mismatch. Mitigation: apply rounding after all transfers are calculated; show exact amounts as sub-text.

## References
- Vite documentation — Build tool and dev server configuration
- vite-plugin-pwa documentation — Service worker generation and PWA manifest
- Dexie.js v4 documentation — IndexedDB wrapper API and React hooks
- Tailwind CSS documentation — Utility-first CSS framework
- Clipboard API (MDN) — Browser clipboard access
- Minimum Cash Flow Problem — Algorithm foundation for debt simplification
