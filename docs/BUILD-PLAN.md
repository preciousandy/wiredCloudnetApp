# CloudNet, Build Plan

**Owner:** Engineering
**Status:** Frontend complete. Steps 1 to 9 built, step 10 handed to the backend engineer, step 11 blocked on the API.
**Supersedes:** the phase list in `cloudnet-frontend-architecture.md`

---

## Why this document replaces the old roadmap

The original six phase plan was written in the first hour, before we understood
what CloudNet actually is. Measured against it, the app is "nearly done". Measured
against the product, it is roughly a third built.

What exists today is a **complete skeleton**: every tab is real, the money path
works end to end, and nothing is faked behind the API boundary. What does not
exist is the depth that makes people pay and stay.

This plan is ordered by dependency, not by preference. Each step unblocks the
next, so working out of order means building some things twice.

---

## Where we actually are

| Area | State |
|---|---|
| Architecture, API boundary, money primitives | Solid, not expected to change |
| Auth, 7 screens | Complete |
| Home, catalogue, search | Skeleton, thin |
| Wallet, purchase, entitlement | Complete for card and transfer only |
| Verticals | Strongest surface in the app |
| CloudIt | Works, poorly designed, single screen |
| Player | **Proof of concept. Cannot even scrub.** |
| Profile, settings, notifications | Complete but shallow |
| Series, live, crypto, creator earnings | **Do not exist** |

---

# The steps

## Step 1, UI system foundations  DONE

**Goal:** stop hand rolling the same components inside feature screens.

There is no toast in this app. `Banner` is inline only, so nothing can confirm an
action without pushing layout around. There are four modals total, each built
from scratch. There is no slider, which is why the player has a decorative
progress bar instead of a scrub bar.

**Contains**

- Toast system with a queue and a `useToast` hook, one provider at the root
- Confirmation dialog, for destructive and money actions
- Reusable `BottomSheet` primitive, with `CommentsSheet` and `PurchaseSheet` moved onto it
- `Slider` built on Gesture Handler and Reanimated, precise enough to scrub a 2 hour film
- `usePaginatedQuery` plus infinite scroll, since every list currently loads once and stops
- Standard empty, error and offline states applied to the thin screens

**Unblocks:** Steps 2, 4, 5, 8. The player needs the slider. Everything needs toasts.

**Needs from you:** nothing.

**Size:** Medium. One focused session.

---

## Step 2, The player  DONE

**Goal:** the thing people paid for should feel worth paying for.

This is the largest single gap and the highest risk to the product. A viewer who
cannot scrub through a film they bought will not buy a second one.

**Contains**

- Draggable scrub bar with time preview while dragging
- Fullscreen and orientation lock, landscape by default for films
- Quality selection, honouring the data saver preference we already store
- Subtitle and audio track selection, wired to the `subtitles` array the ticket already returns
- Playback speed
- Gestures: vertical drag for brightness on the left and volume on the right, double tap to seek
- Buffering, stall and network drop handling with a retry that does not lose position
- Resume prompt on open: continue from 12:04, or start over
- Next episode and autoplay next, honouring the preference
- Lock controls, so a pocket tap does not seek
- Proper audio focus and background behaviour
- Watch through analytics events

**New dependencies:** `expo-screen-orientation`, `expo-brightness`, `react-native-gesture-handler` (already present).

**Unblocks:** Step 3, which needs next episode.

**Needs from you:** whether films default to landscape or respect the phone's rotation lock.

**Size:** Large. This is a phase on its own.

---

## Step 3, Series and episodes  DONE

**Goal:** `kind: 'series'` currently renders as a single film. It is a lie in the data.

**Contains**

- Season and episode data model, schemas, mock and service
- Title detail becomes tabbed: Episodes, About, More like this
- Episode list with per episode progress and duration
- Purchase model for series
- Continue watching points at the right episode, not the series
- Next episode handoff in the player

**Needs from you, and this blocks the step:** do people buy a series per episode,
per season, or as a whole? It changes the entitlement model and it is expensive to
change afterwards.

**Size:** Medium to large.

---

## Step 4, Payments, the rest of the wallet document  DONE

**Goal:** finish what your wallet proposal actually specified. I built the spine
and stopped.

**Contains**

- **Crypto deposits via Kimbipay.** Currently a greyed out row. Needs address or
  invoice display, network selection, confirmation tracking, and a genuinely
  different pending model since blockchain confirmation is slower and noisier
  than a card
- PSP redirect handoff and deep link return, so a hosted checkout comes back into the app cleanly
- Creator withdrawals, gated behind 2FA
- Refunds and reversals, with the ledger already built to support them
- Promo codes, cashback, referral rewards, welcome bonus surfaced properly
- Receipts, shareable and exportable
- Multi currency, if that is the decision

**Needs from you:** which PSP, naira or dollar as primary, and whether purchases
are permanent or timed rentals. All three are still open and all three affect code.

**Size:** Large.

---

## Step 5, Creator economy  DONE

**Goal:** creators are half this platform and currently get one badly designed form.

**Contains**

- **CloudIt rebuilt.** Multi step instead of one long scroll, saved drafts,
  thumbnail selection from video frames, per step validation
- Upload verticals, not only full titles. The vertical feed has no way to post to it
- Creator dashboard: views, watch through rate, revenue by title
- Earnings and payout history, with the commission split we already display at upload time
- Manage content: edit metadata, unpublish, delete, see moderation status and rejection reasons
- Creator onboarding, for the become a creator path

**Needs from you:** the payout policy numbers. I used 70/30 as a placeholder and
it is currently visible to creators at upload time.

**Size:** Large.

---

## Step 6, Live events  DONE

**Goal:** `kind: 'live'` exists in the data with a badge and nothing behind it.

**Contains**

- Live player, low latency configuration, differs meaningfully from on demand
- Ticketed access, pay to attend, wired to the wallet
- Live chat during the stream
- Pre show countdown and lobby
- Replay availability after the event

**Needs from you:** whether live is a launch feature or a fast follow. It is
sizeable and cuttable.

**Size:** Large.

---

## Step 7, Social and safety  DONE

**Goal:** things that stop being optional the moment real users arrive.

**Contains**

- Share sheet with deep links that open the right screen
- Report and block, for both content and users
- Comments on titles, not only on verticals
- Ratings and reviews
- Follower notifications properly wired to the toggles that already exist

**Note:** report and block are effectively required by both app stores for
user generated content. This is not a nice to have.

**Size:** Medium.

---

## Step 8, Discovery depth  DONE

**Goal:** the catalogue is browsable at 12 titles and breaks at 200.

**Contains**

- Search filters, recent searches, suggestions, empty and no result states
- See all and browse screens, which the home rows currently link into thin air
- Pagination everywhere, every list is currently single page
- Recommendation rails, more like this, because you watched
- Genre and category landing pages

**Size:** Medium.

---

## Step 9, Support and legal surfaces  DONE

**Goal:** several rows in settings and the menu currently do nothing.

**Contains**

- Help centre and FAQ
- Contact support
- Terms, Privacy and Community Guidelines as real screens
- **Account deletion**, which both stores require and we do not have

**Size:** Small to medium.

---

## Step 10, Production readiness  HANDED OVER

**Crash reporting, analytics and push are the backend engineer's, by agreement.**
What remains on the frontend: a performance pass on a low end Android device, an
accessibility sweep, and an opaque square app icon for iOS.

**Goal:** everything that makes the difference between a demo and something you
can put in front of paying users.

**Contains**

- Crash reporting with Sentry. **A crash in production is currently invisible to us**
- Analytics, funnel from vertical to purchase, watch through, drop off
- Push notifications, device token registration behind the toggles that already exist
- Performance pass on a low end Android device, the phone most of the market holds
- Accessibility pass, screen reader labels, contrast, tap target sizes
- Store assets, including the opaque iOS icon we still cannot ship with
- Localisation scaffolding, copy is already centralised so this is cheaper than usual

**Size:** Medium, and genuinely not skippable.

---

## Step 11, Backend integration

**Goal:** swap the mock for the real API.

**Contains**

- Reconcile the real endpoints against `cloudnet-api-contract.md`
- Replace the mock adapter, one folder
- Real auth, token refresh and session expiry against a live server
- Error mapping and edge cases the mock never produced
- Load and latency testing on real infrastructure

**Blocked on:** the backend engineer.

**Size:** Medium if the contract was followed, large if it was not.

---

## Running alongside, the design pass

Not a step. You will send corrections continuously and I will apply them between
steps. CloudIt is first in that queue.

---

## Decisions still open, and what they block

| Decision | Status |
|---|---|
| Wallet currency | **Settled.** One currency per wallet, from the user's country. Naira at launch. |
| Series pricing | **Settled.** Per episode. Unreleased episodes cannot be sold. |
| Payment methods | **Settled.** Wallet, debit card, bank transfer, crypto. |
| Crypto | **Settled.** USDT on BNB Chain only. Converted on arrival, never held. |
| PSP | **Settled.** Flutterwave. |
| Creator payout split | **Settled.** 70 to the creator, 30 to CloudNet. |
| Purchase permanent or timed rental | Still open, affects nothing built so far |
| Live at launch, or fast follow | Still open, blocks Step 6 |

---

## The broadcast boundary

The creator live flow is built: schedule, green room, go live, live dashboard,
chat, end event. All of it runs today and is verified.

The camera to viewers pipeline is the one piece that is not, and it cannot be.
It needs native code, so it cannot run in Expo Go under any SDK. It sits behind
one module, `src/features/live/broadcast/`, which every screen talks to and
nothing bypasses.

The stub is not a no-op. It runs the real state machine on real timers, including
connecting, reconnecting, degraded uplink and hard failure, so the screens handle
those paths now rather than discovering them the first time a creator loses a
paid event.

**To make it real:** a development build, then one file changes.
`broadcast/index.ts` picks the implementation, exactly like
`EXPO_PUBLIC_USE_MOCK_API` picks the API adapter. No screen changes.

**Open, and it belongs with the backend decision:** which broadcast service.
Amazon IVS, LiveKit and Mux all fit the interface as written.

---

## Where we are

Steps 1 to 9 are built and verified. Step 10 is split: crash reporting, analytics
and push notifications belong to the backend engineer; the frontend part is a
device performance pass and store assets. Step 11 waits on the real API.

The frontend is feature complete against this plan. Next is correction and design
work driven by the creative director.

## Suggested order of attack

1, 2, 3 are the product. Do them in order, they build on each other.

4 can start as soon as the currency and PSP decisions land, and can run alongside 3.

5, 7, 9 can be done in any order once 1 is finished.

6 is the one to cut if you want to ship sooner.

10 must happen before any public release, and 11 whenever the backend is ready.
