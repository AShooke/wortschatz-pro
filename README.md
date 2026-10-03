# WortSchatz Pro

WortSchatz Pro is a mature, mobile-first vocabulary acquisition app for Russian-speaking learners of German. It combines a focused daily study flow, a browsable German–Russian dictionary, adaptive review scheduling, and German text-to-speech in an installable Progressive Web App.

The interface is in Russian, while German is used for vocabulary and study content. The app is client-side: starter vocabulary is bundled with the frontend, and learner data is stored locally in the browser. No account or application backend is required.

## Features

- **Daily Flow:** One unified session mixes active recall, Taboo-style explanation prompts, article practice (`der`, `die`, `das`), and German–Russian matching.
- **Adaptive review:** Rate a response as `Again`, `Hard`, `Good`, or `Easy`. Scheduling adapts the next interval to the rating and stores review history, difficulty, stability, repetitions, and lapses. Existing Leitner data is migrated when stored words are read.
- **German pronunciation:** Uses the browser Speech Synthesis API with the `de-DE` locale and prefers an installed German voice. Voice loading is handled asynchronously when required by the browser.
- **Today dashboard:** See words due for review, today’s progress, and start a session from the main screen.
- **Dictionary:** Search German and Russian, filter by topic, inspect examples and scheduling details, and add personal vocabulary.
- **Progress insights:** Review due words, learning/mastered vocabulary, lapse count, daily reviews, and average memory stability.
- **Offline-first PWA:** Vocabulary and progress are persisted in `localStorage`; the Vite PWA plugin generates the web manifest and service worker.

## Tech Stack

- React and TypeScript with strict compiler checks
- Vite 8 for development and production builds
- Tailwind CSS 3 for responsive styling
- `vite-plugin-pwa` for manifest and service-worker generation
- Vitest for unit tests
- `lucide-react` for interface icons

## Requirements

- Node.js `^20.19.0` or `>=22.12.0` (required by the installed Vite version)
- npm
- A modern browser; German voice availability depends on the browser and installed system voices

## Getting Started

From the repository root, install the frontend dependencies:

```bash
npm ci --prefix frontend
```

Start the development server:

```bash
npm run dev
```

Vite prints the local URL, normally `http://localhost:5173`.

Run the test suite and production build:

```bash
npm test --prefix frontend
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

The root npm scripts forward `dev`, `build`, and `preview` to `frontend/`. Tests are run directly through the frontend package.

## Application Routes

- `/` — Today dashboard
- `/study` — focused mixed study session
- `/dictionary` — vocabulary search and management
- `/stats` — learning and scheduling insights

Legacy `/games` visits return to the Today dashboard. Study activities now run inside the unified session.

## Architecture and Data

The application is a static, client-side PWA with no server API:

```text
React views -> local repository -> browser localStorage
```

- `frontend/src/api/client.ts` provides the vocabulary and review repository interface.
- `frontend/src/api/storage.ts` handles versioned local storage and legacy data migration.
- `frontend/src/lib/scheduling.ts` contains the rating-based scheduling algorithm.
- `frontend/src/lib/studySession.ts` creates a mixed queue from due words and eligible activities.
- `frontend/src/lib/useLearnerData.ts` keeps active views synchronized after local repository updates.
- `frontend/src/data/words.ts` contains the bundled starter vocabulary.

Learner data is specific to the browser profile and device. Clearing site data removes local vocabulary and progress. The current scheduling algorithm is a dynamic rating-based implementation; it is not an FSRS implementation.

## Production Deployment

Build the frontend with `npm run build`. The deployable static site is generated in `frontend/dist`. For Vercel, configure the project to build the Vite frontend and publish that directory; ensure the host serves the SPA entry point for client-side routes. Serve the deployed app over HTTPS for service-worker registration and PWA installation support.

The PWA manifest and service-worker integration are configured in `frontend/vite.config.ts`. No environment variables or backend deployment are required.