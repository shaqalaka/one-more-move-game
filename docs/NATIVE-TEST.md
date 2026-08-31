# Native Android Test Record

## Environment

- Android Studio: 2026.1.3.8
- Java: OpenJDK 21.0.12.1
- Android SDK compile/target: 36
- Emulator: medium phone, Android 16 / API 36, ARM64 Google Play image
- App ID: `io.github.shaqalaka.onemoremove`
- Version: `0.1.0` (`versionCode 1`)

## Automated results

- `npm run check`: passed
  - deterministic generator and canonical solvability
  - move, Undo, Hint, Daily, Last Spark, reload recovery, stale-Daily expiry
  - modal focus and mobile overflow
  - production test-helper removal
  - revisioned service worker, route-safe caching, and offline shell
  - production dependency audit: zero vulnerabilities
- `./gradlew test lint assembleDebug bundleRelease`: passed
- `./gradlew :app:connectedDebugAndroidTest`: one test passed on Android 16
- Android lint: zero current errors

The aggregate root `connectedDebugAndroidTest` task also attempts instrumentation-test builds for generated Capacitor library modules and encounters duplicate Kotlin test dependencies in `capacitor-cordova-android-plugins`. The app-scoped task above is the relevant application test and passes.

## Native runtime checks

The debug APK was installed on the API 36 emulator. Wi-Fi and mobile data were disabled before launch.

Verified:

- cold launch from bundled assets while offline
- tutorial and portrait layout render correctly
- board exposes 25 individually labelled native accessibility nodes
- first rotation reduced the move counter from 17 to 16
- force-stop and relaunch displayed **Continue where you stopped**
- Continue restored the same board with 16 moves and 25 tile nodes
- package assertion passed in the instrumented test

Local evidence:

- `artifacts/android-16-first-launch.png`
- `artifacts/android-16-restored-game.png`

## Still required on publisher-owned hardware

- real Android phone testing for haptics, audio focus, TalkBack, font scaling, insets, battery/process pressure, and touch feel
- signed upload-key AAB after Play Console and Play App Signing enrollment
- Google Play pre-launch report and closed testing cohort
