# RevenueCat setup

Quippr uses [@revenuecat/purchases-capacitor](https://github.com/RevenueCat/purchases-capacitor) for subscriptions.

## Dashboard

1. Create products in **App Store Connect** and **Google Play Console**
2. In RevenueCat, create an **Entitlement** named `premium`
3. Attach your monthly and yearly products to that entitlement
4. Create a **Current Offering** with `$rc_monthly` and `$rc_annual` packages (or custom identifiers containing `month` / `year`)

## App configuration

API keys are in `.env.example` (or hardcoded fallbacks in `src/lib/revenuecat/config.ts`):

- iOS: `VITE_REVENUECAT_IOS_API_KEY`
- Android: `VITE_REVENUECAT_ANDROID_API_KEY`

After installing the plugin, sync native projects:

```bash
npm run cap:sync:ios
npm run cap:sync:android
```

## Code

| File | Purpose |
|------|---------|
| `src/lib/revenuecat/config.ts` | API keys, entitlement id |
| `src/lib/revenuecat/purchases.ts` | Configure, purchase, restore |
| `src/lib/revenuecat/premium.ts` | Entitlement check, free-tier limits |
| `src/contexts/PremiumContext.tsx` | React hook `usePremium()` |

Check premium status:

```typescript
import { hasPremiumEntitlement } from "@/lib/revenuecat/premium";
// or in components:
const { isPremium } = usePremium();
```

## Free tier limits

- **3 conversations** total
- **Neutral scenario** only
- **1 hint** and **1 feedback** per conversation

Premium unlocks all of the above.
