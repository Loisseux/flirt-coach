# Google Sign In — Supabase setup

Quippr uses Supabase OAuth for Google Sign In. A **400 error** almost always means a redirect URL is missing from Supabase or Google Cloud Console.

## 1. Supabase Dashboard

### Enable Google provider
1. **Authentication → Providers → Google**
2. Enable Google and add your **Client ID** and **Client Secret** from Google Cloud Console (see below).

### Redirect URLs
1. **Authentication → URL Configuration**
2. Add every URL below to **Redirect URLs**:

```
https://flirt-coach-ten.vercel.app/app
http://localhost:5173/app
com.quippr.app://auth/callback
```

3. Set **Site URL** to: `https://flirt-coach-ten.vercel.app`

The app uses:
- **Web:** `{origin}/app` (or `VITE_APP_URL/app` in production)
- **iOS/Android:** `com.quippr.app://auth/callback` (deep link back into the app)

## 2. Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**
2. Create or edit an **OAuth 2.0 Client ID** (type: **Web application**)
3. Under **Authorized redirect URIs**, add:

```
https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback
```

Replace `<YOUR_PROJECT_REF>` with your Supabase project reference (from `VITE_SUPABASE_URL`).

4. Copy **Client ID** and **Client Secret** into Supabase → Google provider settings.

> **Note:** The redirect URI above is Supabase's callback URL, not your app URL. Google sends the user to Supabase first; Supabase then redirects to your app.

## 3. Rebuild native apps

After updating `Info.plist` / `AndroidManifest.xml` for the deep link:

```bash
npm run cap:sync:ios
npm run cap:sync:android
```

Then rebuild in Xcode or Android Studio.

## 4. Verify

- **Web:** open `/app`, tap **Continue with Google**, complete sign-in, land back on `/app` signed in.
- **Native:** OAuth opens in the system browser, then returns to the app via `com.quippr.app://auth/callback`.
