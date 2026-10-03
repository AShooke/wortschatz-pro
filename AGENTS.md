# WortSchatz Pro Engineering Guide

## Product Direction

WortSchatz Pro is a mobile-first PWA for Russian speakers learning German. The interface language is Russian. German is the target study language, including vocabulary, example content, and practice prompts.

## Architecture Constraints

- The application is a standalone client-side PWA. Do not add a backend, Python runtime, network API, or server-side persistence.
- The frontend is React + Vite + TypeScript with strict TypeScript enabled, Tailwind CSS, and PWA support.
- Keep vocabulary, SRS, game, and statistics rules in testable TypeScript modules and persist user state in browser `localStorage`.
- Design and test the primary mobile viewport at 390x844px. Touch targets must be comfortable for mobile use.

## SRS Leitner Rules

Use six Leitner stages, numbered 0 through 5. A successful review advances the word by one stage, capped at stage 5. The target intervals are:

| Stage | Interval |
| --- | --- |
| 0 | 4 hours |
| 1 | 1 day |
| 2 | 3 days |
| 3 | 7 days |
| 4 | 14 days |
| 5 | 30 days |

Review quality is an integer from 0 to 3:

- Quality `0` resets the word to stage `0` and increments its mistake count.
- Quality `1`, `2`, or `3` advances the word by one stage, capped at `5`.
- The next review timestamp must be calculated from the resulting stage interval.

## UI and Language Rules

- All interface labels, buttons, validation messages, alerts, and empty states are Russian.
- German words and German learning content remain in German; use Russian for explanations and controls.
- Do not ship English placeholder copy in the user interface.
