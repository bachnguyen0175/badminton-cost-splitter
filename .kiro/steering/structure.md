# Project Structure

## Organization Philosophy

Hybrid feature-based + layered architecture. Each feature module (players, session, history) is internally organized as UI → hooks → services → data. A shared core provides the database instance, types, and utility functions.

## Directory Patterns

### Core (shared infrastructure)
**Location**: `src/core/`
**Purpose**: Database instance, shared types, pure utility functions (settlement engine, clipboard service)
**Example**: `db.ts`, `types.ts`, `settlementEngine.ts`, `clipboardService.ts`

### Feature Modules
**Location**: `src/features/{feature}/`
**Purpose**: Self-contained feature with its own UI components, hooks, and services
**Example**: `src/features/players/`, `src/features/session/`, `src/features/history/`

### Pages (route-level components)
**Location**: `src/pages/`
**Purpose**: Top-level route components that compose feature modules
**Example**: `MainScreen.tsx`, `HistoryScreen.tsx`

### Tests
**Location**: `src/test/` for setup; co-located `*.test.ts(x)` for unit tests
**Purpose**: Test infrastructure and test files alongside source

## Naming Conventions

- **React components**: `PascalCase.tsx` (e.g., `PlayerSelector.tsx`, `CostInputPanel.tsx`)
- **Hooks**: `camelCase.ts` prefixed with `use` (e.g., `useSessionForm.ts`, `usePlayerList.ts`)
- **Services**: `camelCase.ts` suffixed with `Service` (e.g., `playerService.ts`, `sessionService.ts`)
- **Pure functions**: `camelCase.ts` (e.g., `settlementEngine.ts`)
- **Types**: `PascalCase` for interfaces/types, exported from `types.ts`
- **Constants**: `UPPER_SNAKE_CASE`
- **Test files**: `{name}.test.ts(x)` co-located with source

## Import Organization

```typescript
// 1. React/external libraries
import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

// 2. Core/shared modules
import { db } from '@/core/db';
import type { Player, Result } from '@/core/types';

// 3. Feature-local imports
import { PlayerService } from './playerService';
```

## Code Organization Principles

- **Service/Hook boundary**: Services are async imperative operations (CRUD). Hooks wrap `useLiveQuery` for reactive UI reads. Components use hooks for reads and services for writes.
- **Pure functions extracted**: Settlement engine and formatting utilities are pure functions in `src/core/` for testability.
- **No cross-feature imports**: Features communicate through shared core types only. A feature should never import from another feature's internal modules.
- **Single-screen philosophy**: The session flow stays on `/` with no page navigation. History is a separate lazy-loaded route at `/history`.

---
_Document patterns, not file trees. New files following patterns shouldn't require updates_
