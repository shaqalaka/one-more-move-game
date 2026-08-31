# One More Move

A polished, mobile-first circuit puzzle built with plain HTML, CSS, and JavaScript. Rotate tiles to connect the source to the beacon before the move budget runs out. Every generated board has a known solvable route.

## Included in v0.1

- Seeded, guaranteed-solvable 5×5 puzzles
- Random play and a deterministic UTC Daily Circuit
- Last Spark: exactly one extra move after the normal budget expires
- Hint and undo controls
- Local best score, wins, daily streak, and active-puzzle resume
- Generated sound effects, haptics where available, mute, and reduced-motion support
- Semantic DOM grid, keyboard navigation, accessible labels, and visible focus
- Offline-first PWA shell with no accounts, ads, analytics, or remote game dependencies
- Capacitor Android project with bundled native web assets
- Custom store icon and Android launch artwork
- Headless-browser tests over 250 generated puzzles

## Play locally

Open `index.html`, or serve the folder over HTTPS/localhost to exercise the service worker and installable PWA behavior.

```bash
npm install
npm run check
npm run build
```

`npm run build` creates:

- `dist/pwa` — hosted build with manifest and service worker
- `dist/native` — Capacitor build with no service-worker registration

## Android project

The generated Android package ID is `io.github.shaqalaka.onemoremove`. Treat this as permanent once an app is created in Play Console. Change it before publication if a different publisher identity is required.

```bash
npm run cap:sync
npm run android:open
```

A current Android Studio/JDK/SDK toolchain is not installed on this machine yet, so the Gradle project is generated and synchronized but an `.aab` cannot be compiled until Android Studio installs the required toolchain. See `docs/PLAY-STORE.md`.

## Privacy

The game stores progress and settings locally. Version 0.1 contains no account, ads, analytics, tracking SDK, cloud save, or gameplay data transmission. The public web host will still process ordinary HTTP request metadata when serving files. See `privacy.html` and re-audit the final Android dependencies/network behavior before completing Google Play Data safety.

## Testing

`npm run check` performs:

- JavaScript syntax and static asset checks
- Source/PWA/native/Android build synchronization
- 250-seed generation invariants
- Canonical-route solvability checks
- Real Chromium gameplay test
- Rotation/move accounting
- Undo and hint behavior
- Local active-game resume
- Win/results behavior
- Daily restart determinism
- Mobile overflow and remote-request checks
- Production dependency audit

## Important release boundaries

- Do not add ads, analytics, billing, or third-party SDKs without revisiting privacy, Play disclosures, permissions, testing, and consent requirements.
- Keep upload keystores, passwords, service-account JSON, and signing properties outside this repository.
- Do not load replacement executable game code remotely into the Android app.
- Confirm the game name and branding do not conflict with existing trademarks before store publication.
