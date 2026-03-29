# Product Overview

Badminton Cost Splitter — a local-first Progressive Web App for splitting badminton session costs among players. Designed for recreational badminton groups who need to quickly settle expenses (court fees, shuttlecocks, drinks) immediately after a game.

## Core Capabilities

- **Single-screen cost splitting**: Complete a full session in under 10 seconds — select players, enter costs, assign payers, view results
- **Optimal debt settlement**: Greedy algorithm minimizes the number of transfers needed to settle all debts
- **Offline-first**: All data stored locally via IndexedDB; no server dependency, works at any venue regardless of connectivity
- **Session history**: Browse and review past sessions with master-detail navigation
- **One-tap sharing**: Copy human-readable settlement summary to clipboard for sharing via Zalo/Messenger

## Target Use Cases

- Post-game cost splitting at the badminton court (primary)
- Reviewing past sessions to verify outstanding debts
- Sharing settlement results in group chats

## Value Proposition

- **Speed**: Sub-10-second flow from app open to result copy
- **Simplicity**: No accounts, no cloud, no setup — just open and split
- **Mobile-first**: Thumb-zone optimized for on-the-go use at the venue
- **VND-aware**: Rounding to nearest 1,000 VND with exact amount transparency

## Business Rules

- All amounts in VND only (no multi-currency)
- Settlement transfers rounded to nearest 1,000 VND; exact amounts shown as sub-text
- Sessions are immutable after persistence — stored as point-in-time snapshots with player name copies
- Player names must be unique (case-insensitive)
- Maximum 10 cost line items per session

---
_Focus on patterns and purpose, not exhaustive feature lists_
