# One More Move — MVP Design

## Core loop

A 5×5 circuit contains one guaranteed path from a fixed source on the left to a beacon on the right. Tapping a tile rotates it 90 degrees clockwise and consumes one move. Reciprocal connectors carry visible energy. The puzzle resolves a win before evaluating a zero-move loss, so the final normal move can win.

If the circuit is still incomplete at zero moves, the player receives one free **Last Spark** rotation. There is no timer, advertising, currency, or purchase attached to this rescue.

## Generation guarantee

A seeded PRNG creates a non-self-intersecting route across the board. Its canonical connector masks are saved before all tiles are scrambled. The canonical clockwise restoration cost is measured with straight-tile symmetry respected. The displayed move budget equals that measured cost plus four moves for Daily or five for random play. Starts with fewer than six required turns or an already complete connection are regenerated.

Automated browser tests generate 250 independent seeds, reject initial wins, assert required cost does not exceed budget, restore every canonical path mask, and verify the resulting board connects.

## Session features

- Random circuits for endless short play
- UTC-date-seeded Daily Circuit shared across devices
- Two hints that identify an incorrectly oriented canonical-path tile
- Undo that restores the last orientation and move count
- Last Spark final rotation
- Score based on remaining moves, rotations, hints, and unassisted completion
- Local wins, best score, daily result/streak, settings, and unfinished-circuit resume

## Accessibility

- DOM buttons rather than a canvas
- 5×5 semantic grid with row/column and connector labels
- Arrow-key spatial navigation; Enter/Space activates a tile
- Visible focus rings and 44px-plus controls
- Powered routes differ through brightness and glow, not hue alone
- Live status copy, mute, and reduced-motion handling
- No countdown, swipe-only action, long press, or audio-only state

## Future design work after playtesting

The current MVP intentionally optimizes shippability. If testers understand and replay it, version 0.2 can move toward a connected spanning-tree network in which every active tile must be powered, then introduce authored tutorial micro-boards, relays, difficulty bands, anti-double-tap rotation locks, counter-clockwise controls, one-use rewind, and star ratings.

Do not add complexity until measured testing shows that the source-to-beacon loop is understood, satisfying, and worth replaying.
