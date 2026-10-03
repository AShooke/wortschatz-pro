# Architecture

## Overview

WortSchatz Pro is a standalone React/Vite PWA. The initial vocabulary is bundled in `frontend/src/data/words.ts`; the browser-local repository persists vocabulary and learner progress in `localStorage`.

## Data Flow

```text
React PWA -> local TypeScript repository -> browser localStorage
```

The versioned rating-based scheduling rule set is implemented in `frontend/src/lib/scheduling.ts` and applied by the local repository layer.

## API Areas

- Vocabulary CRUD and filtering are local operations.
- Reviews update dynamic scheduling locally from `Again`, `Hard`, `Good`, or `Easy` ratings.
- `frontend/src/lib/studySession.ts` builds a mixed queue from due vocabulary and eligible activities.
- The Today dashboard is `/`; the focused study session is `/study`. `/games` is a legacy route that returns to Today.

## Boundaries

- `frontend/src/api/client.ts` is a local repository facade retained as the page-facing boundary.
- Browser storage is the persistence layer.
- UI copy is Russian; German appears as study content.
