# WorkPlace front door — native app (Expo / React Native)

Demonstration shell for iOS and Android. It shares the language and content core (`../lib/i18n.ts`, `../lib/content.ts`) with the web pathway and staff console and calls the same API (`/api/services`, `/api/requests`), so one validation, consent and language model serves every channel.

```
npm install
EXPO_PUBLIC_API_URL=https://<demo-domain> npx expo start   # scan with Expo Go
npx tsc --noEmit
```
Production builds run in a WorkPlace-owned GitHub Actions pipeline (`eas build --local`); push goes directly through APNs and FCM. No Expo subscription is required.

## Handoff: run, build, distribute

1. **Deploy the web app first** (see ../README.md). Its URL is the API the app calls.
2. Set `EXPO_PUBLIC_API_URL` in `eas.json` (both profiles) to that URL.
3. **Try it now, no accounts needed:** `npm install && EXPO_PUBLIC_API_URL=https://<demo-url> npx expo start`, then scan the QR code with Expo Go (iOS or Android).
4. **Android test build (APK, shareable link):** `npx eas-cli login && npx eas-cli build -p android --profile preview`. Needs a free Expo account.
5. **iOS TestFlight:** needs an Apple Developer Program membership ($99/yr). `npx eas-cli build -p ios --profile production`, then `npx eas-cli submit -p ios`. Add testers in App Store Connect > TestFlight (internal testers get it immediately; external testers wait for a short beta review).
6. Bundle ID / package: `com.kodekinetics.frontdoordemo`. Label it a demonstration build; it uses sample data.
