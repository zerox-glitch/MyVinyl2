# Vynyl Record — native Android (Kotlin + Jetpack Compose)

A native port of the web prototype in `../src`, with the same screens, copy, colours and fonts.

## Build
1. Open the `android/` folder in Android Studio (Ladybug or newer). Use JDK 17.
2. On first sync, Android Studio offers to create the Gradle wrapper (`gradlew` + jar). Accept it, or run `gradle wrapper --gradle-version 8.9`.
3. Run the `app` configuration on a device or emulator with API 26 or higher.

This code was written without an Android SDK, so it has **never been compiled**. The first build will probably show a few compile errors. Paste them back here and I'll fix them.

## Structure
- `audio/`: presets, the offline vinyl DSP, synthesized music beds, recorder, live preview mixer (stems), WAV player
- `data/RecordStore.kt`: local storage (JSON metadata plus WAV/JPEG files in app storage, no server)
- `pro/Pro.kt`: free/pro limits plus Google Play Billing (subscriptions `monthly` and `yearly`, in-app `lifetime`). Restore asks Play what the signed-in account owns.
- `ui/`: Studio, Master Vault, Player (OpenGL turntable), Paywall, shared components
- `turntable/`: GL ES 3 renderer

## Google Play setup
In Play Console, create subscriptions `monthly` and `yearly` (each needs a base plan) and an in-app product `lifetime`. Billing only works on builds installed from a Play testing track, with a license-tester account.
