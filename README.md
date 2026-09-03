# CloudNet, Frontend

Expo (React Native) app. Web comes later via `react-native-web`.

This is the **Phase 0 foundation**: toolchain, design system, money primitives,
API boundary and router shell. Feature screens are built on top of it in Phases 1-5.

---

## Getting started

```bash
npm install
npx expo install --fix     # aligns native deps to the installed Expo SDK
cp .env.example .env
npm start
```

The app runs **fully without a backend**. `EXPO_PUBLIC_USE_MOCK_API=true` routes
every service call to the in-memory mock in `src/api/mock/`, including a working
wallet ledger. Flip it to `false` once real endpoints exist.

Mock sign-in accepts any non-empty email and password. Mock OTP code is `4321`.

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # eslint, zero warnings allowed
npm test             # money + ledger invariants
```

---

## The rules that matter

**1. Screens never call `fetch`.**
`screen → feature hook → service → api client`. ESLint blocks direct `fetch` calls.
Swapping backends means editing `src/api/services/` and nothing else.

**2. Money is never a plain number.**
It is `{ minor: number, currency }` where `minor` is an integer in the smallest
unit, ₦300.00 is `{ minor: 30000, currency: 'NGN' }`. `0.1 + 0.2 !== 0.3` in
JavaScript, and applied to a wallet that is a real financial defect. Read
`src/lib/money.ts` before writing anything that touches a price.

**3. The server owns the balance.**
The client displays it and never predicts it. No optimistic wallet updates, a
wrong number on a money screen destroys trust faster than a spinner does.

**4. Every money request carries an idempotency key.**
Created when the user forms the intent to pay, reused across every retry. See
`src/features/wallet/hooks/usePurchase.ts`.

**5. Purchase is a state machine, not a boolean.**
`idle → confirming → pending → entitled | failed | insufficient_funds`.
`pending` is real: PSP confirmation is asynchronous and the UI must say so honestly.

**6. Entitlement is server-decided.**
The client asks "may I watch this?" and obeys. It never unlocks content locally.

**7. Every screen implements four states.**
Loading, empty, error, content. Use `<StateView />`. A screen missing one is not done.

**8. No magic numbers, no hardcoded copy.**
Theme tokens from `src/ui/theme`, strings from `src/copy`.

---

## Layout

```
app/                    Expo Router, routing and layout ONLY, no logic
  (onboarding)/         pre-auth
  (auth)/               sign-in, sign-up, OTP, password
  (tabs)/               Home · Shorts · Upload · Library · Profile (guarded)
  title/[id]            detail + buy
  watch/[id]            player
  wallet/               balance, fund, transactions

src/
  api/                  THE backend boundary
    client.ts           transport: auth, retry, idempotency, zod validation
    errors.ts           ApiError + stable error codes
    schemas/            zod, every response validated at the boundary
    services/           the only thing hooks may call
    mock/               full in-memory backend incl. wallet ledger
  features/             feature-first: api, components, hooks, types per domain
  ui/                   design system primitives + theme tokens
  lib/                  money, storage, idempotency, formatting
  store/                zustand: session, player, upload queue
```

If a file in `app/` passes ~120 lines, its logic belongs in a feature hook.

---

## Notes carried over from the prototype

Three defects from the previous codebase were fixed rather than ported:

- **OTP logic was inverted**, code `1111` was rejected and every other code
  accepted. Verification now happens behind the service boundary; the client is
  never told the expected value.
- **The `orange` palette was a rose ramp.** `orange-600` was `#e11d48` (pink), so
  every hover state went pink. `src/ui/theme/colors.ts` has a correct ramp
  generated around the brand hue `#F2702D`.
- **`app.json` hardcoded a LAN IP** for the WebView shell. Replaced by a typed,
  env-driven `app.config.ts`. The WebView architecture is gone.

---

See `cloudnet-frontend-architecture.md` and `cloudnet-api-contract.md`.
