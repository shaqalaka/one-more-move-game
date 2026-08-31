# Google Play Release Plan

## Current state

The game, PWA, native build output, and Capacitor Android project are prepared. Android Studio 2026.1.3.8, Java 21, SDK/API 36, platform tools, and build tools are installed. Gradle unit tests, lint, `assembleDebug`, and `bundleRelease` pass. The debug APK and unsigned release AAB are stored locally under `release/`. A Play Console account, Play App Signing enrollment, private upload key, physical-device checks, and signed AAB are still required.

## 1. Enrolment

Create a Google Play Console personal developer account using the future publisher's real legal identity. Google currently charges US$25 once; verify the displayed Australian amount, identity requirements, and policy at enrollment.

Official enrollment help: https://support.google.com/googleplay/android-developer/answer/6112435

New personal accounts created after 13 November 2023 generally must complete a closed test with at least 12 testers continuously opted in for 14 days, then apply for production access. Recruit more than 12 to protect against dropouts and verify the requirement shown in the actual Console:

https://support.google.com/googleplay/android-developer/answer/14151465

## 2. Install and verify Android tooling

Install the current stable Android Studio for macOS, its recommended JDK, and the SDK/platform requested by the pinned Capacitor release. The generated project currently targets the values supplied by Capacitor 8.4.2; re-check Google's rolling target-API requirement before submission:

- Capacitor Android requirements: https://capacitorjs.com/docs/android
- Play target API policy: https://support.google.com/googleplay/android-developer/answer/11926878

Then run:

```bash
npm install
npm run check
npm run cap:sync
npm run android:open
```

Use Android Studio to run a debug build on an emulator and at least one real low/mid-range Android phone.

## 3. Test the native wrapper

Verify:

- Cold launch and splash art
- Portrait layout, status/navigation insets, back behavior, and font scaling
- Tile touch targets and rapid taps
- Sound mute, Android audio focus, haptics, pause/resume, and process recreation
- Save after every move, active-game resume, Reset progress, and app-data clearing
- Airplane-mode play and no external gameplay requests
- TalkBack focus/order and reduced motion
- Clean install and upgrade over an earlier build
- No unexpected permissions or SDK traffic in the merged manifest

The Capacitor template currently includes the INTERNET permission for its local WebView runtime. The game code has no remote gameplay endpoint. Confirm actual release traffic and Data safety rather than relying solely on source intent.

## 4. Signing

Use Play App Signing. Generate a dedicated upload keystore locally and keep it outside the repository. Never commit `.jks`, passwords, `keystore.properties`, service-account JSON, or API keys.

Store two encrypted offline backups of the upload key, certificate fingerprint, alias, and recovery steps. Configure release signing through private Gradle properties or protected CI secrets.

Official guide: https://developer.android.com/studio/publish/app-signing

## 5. Build the Android App Bundle

Increment `versionCode` for every uploaded artifact. Build an `.aab`, not only an APK:

https://developer.android.com/guide/app-bundle

Record the source commit, lockfile, version code/name, AAB SHA-256, signing certificate, and build environment. Inspect the final bundle and merged manifest before upload.

## 6. Complete the Play listing

Use `store/listing.md` as the draft. Before submission provide:

- Confirmed app name and permanent package ID
- Real developer/support identity and public email
- Public HTTPS privacy policy
- 512×512 PNG icon (`store/icon-512.png`)
- 1024×500 feature graphic
- Phone screenshots
- Content rating questionnaire
- Target audience/content declaration
- Ads declaration: No for v0.1
- App access: all functionality available without login
- Data safety based on the final artifact audit

For a genuinely offline build with local-only settings/progress and no analytics, ads, accounts, crash SDK, cloud save, or third-party transmission, the Data safety form will normally indicate no user data collected or shared. Confirm using Google's definitions and the final binary:

https://support.google.com/googleplay/android-developer/answer/10787469

## 7. Test tracks

1. Internal testing for rapid artifact/device checks.
2. Closed testing with more than 12 recruited testers.
3. Keep at least 12 opted in continuously for the required 14 days.
4. Collect structured feedback on understanding, completion, replay intent, crashes, layout, battery/audio, and accidental input.
5. Upload fixes with a higher versionCode; retest.
6. Apply for production access when the Console gate is satisfied.
7. Release using a small staged rollout and monitor Android vitals, reviews, and support reports.

Track documentation: https://support.google.com/googleplay/android-developer/answer/9845334

## 8. Tester brief

Ask testers to play at least five random puzzles and three Daily attempts across the period. Record:

- Could they explain the objective after the tutorial?
- Did any board look impossible?
- First-attempt wins and move surplus
- Hint/undo/Last Spark usage
- Whether they immediately chose another puzzle
- Any accidental double taps or hidden controls
- Device model, Android version, crashes, audio/inset/layout problems

Friends alone are useful for defects but weak evidence of market demand. Seek candid testers who enjoy casual puzzles.

## Monetization after validation

Do not add ads to the first closed test. First establish tutorial completion, repeat play, and daily return behavior. If retention is promising, the least intrusive first offer is a one-time full-theme/level unlock. Digital purchases in the Play app must use Google Play Billing under then-current rules:

https://developer.android.com/google/play/billing

Ads, analytics, billing, and crash reporting are separate dependency and privacy decisions. Each requires an updated manifest/network audit, privacy notice, Data safety answers, store declarations, and testing.
