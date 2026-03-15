# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Badminton Tracker is a zero-dependency PWA for tracking badminton doubles matches and player scores. Built with vanilla HTML/JS and Tailwind CSS (via CDN). All data persists in browser localStorage.

## Running the App

No build step. Serve the files with any HTTP server:
```bash
python3 -m http.server
# or
npx http-server
```
Then open in browser. No package.json, no tests, no linter.

## Architecture

Single-page app with three files that matter:

- **`index.html`** — Layout and structure, uses Tailwind CSS from CDN
- **`app.js`** — All application logic: state management, event handlers, rendering
- **`sw.js`** — Service worker for offline caching

### Data Flow

User actions → event handlers in `app.js` → update state → `save()` to localStorage → `render()` rebuilds DOM.

### State Shape (localStorage key: `"badminton_tracker"`)

```javascript
{
  players: { "Name": score },  // score is integer, can go negative
  matches: [{
    teamA: [player1, player2],
    teamB: [player3, player4],
    scoreA: number | null,     // null = quick win (no score recorded)
    scoreB: number | null,
    winner: "A" | "B",
    points: 1 | 2              // 2 if loser scored < 10
  }]
}
```

### Key Business Rules

- Matches are 2v2 doubles (exactly 4 players selected)
- Winning team gets 1 point; **2 points** if losing team scored < 10
- Losing team gets points deducted
- Deleting a match reverses its point changes
- `selected` array (in-memory only) tracks current player selection for forming teams
