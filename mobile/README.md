# WorkPlace front door — native app (Expo / React Native)

Demonstration shell for iOS and Android. It shares the language and content core (`../lib/i18n.ts`, `../lib/content.ts`) with the web pathway and staff console and calls the same API (`/api/services`, `/api/requests`), so one validation, consent and language model serves every channel.

```
npm install
EXPO_PUBLIC_API_URL=https://<demo-domain> npx expo start   # scan with Expo Go
npx tsc --noEmit
```
Production builds run in a WorkPlace-owned GitHub Actions pipeline (`eas build --local`); push goes directly through APNs and FCM. No Expo subscription is required.
