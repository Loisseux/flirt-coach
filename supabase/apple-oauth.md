# Sign in with Apple — Supabase setup

Quippr uses Supabase OAuth for Apple Sign In. Complete these steps in [Apple Developer](https://developer.apple.com) and the [Supabase Dashboard](https://supabase.com/dashboard).

## 1. Apple Developer

### App ID
1. **Certificates, Identifiers & Profiles → Identifiers → App IDs**
2. Select `com.quippr.app` (or create it).
3. Enable **Sign in with Apple** and save.

### Services ID (for web OAuth)
1. **Identifiers → + → Services IDs**
2. Description: `Quippr Web Auth`
3. Identifier: e.g. `com.quippr.app.web` (must be unique)
4. Enable **Sign in with Apple → Configure**
5. **Primary App ID:** `com.quippr.app`
6. **Domains and Subdomains:** your Supabase project host, e.g. `abcdefghijklmnop.supabase.co`
7. **Return URLs:**  
   `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
8. Save and note the **Services ID** (Client ID for Supabase).

### Sign in with Apple key
1. **Keys → +**
2. Name: `Quippr Sign in with Apple`
3. Enable **Sign in with Apple**, configure with Primary App ID `com.quippr.app`
4. Register, download the `.p8` file (one-time download), and note the **Key ID**
5. Note your **Team ID** (top-right of Apple Developer account)

## 2. Supabase Dashboard

### Enable Apple provider
1. **Authentication → Providers → Apple**
2. Enable Apple
3. Fill in:
   - **Client ID (Services ID):** `com.quippr.app.web`
   - **Secret Key:** generate a client secret JWT (see below)
4. Save

#### Generate the client secret JWT

Apple requires a signed JWT as the OAuth client secret. Use the included script (no extra dependencies):

```bash
npm run apple:client-secret -- \
  --team-id YOUR_TEAM_ID \
  --key-id YOUR_KEY_ID \
  --client-id com.quippr.app.web \
  --key-file ./AuthKey_XXXXXXXXXX.p8
```

Or set `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_CLIENT_ID`, and `APPLE_PRIVATE_KEY_PATH` in `.env` and run:

```bash
npm run apple:client-secret
```

Copy the printed JWT into **Secret Key** in the Supabase Apple provider settings. The JWT expires after 180 days by default — regenerate and update Supabase before it expires.

Some Supabase versions also accept the raw `.p8` contents with separate **Key ID** and **Team ID** fields instead of a JWT. If your dashboard shows those fields, you can paste the `.p8` file directly and skip the script.

### Redirect URLs
1. **Authentication → URL Configuration**
2. Add these **Redirect URLs**:
   - `https://flirt-coach-ten.vercel.app` (production)
   - `http://localhost:5173` (local dev)
   - Any other deployment URLs you use
3. **Site URL:** `https://flirt-coach-ten.vercel.app`

The app passes `redirectTo` from `VITE_APP_URL` (see `.env.example`). Ensure that URL is listed above.

## 3. Environment

```env
VITE_APP_URL=https://flirt-coach-ten.vercel.app
```

After OAuth, Supabase redirects to this URL with the session in the URL hash; the app picks it up automatically.

## 4. Verify

1. Deploy the latest web build (or run `npm run dev` locally).
2. Open the auth screen and tap **Continue with Apple**.
3. Complete Apple sign-in and confirm you land back in the app signed in.

## App Store note

Apple requires Sign in with Apple when other third-party sign-in options (e.g. Google) are offered. The auth screen shows **Continue with Apple** above **Continue with Google** to meet this guideline.
