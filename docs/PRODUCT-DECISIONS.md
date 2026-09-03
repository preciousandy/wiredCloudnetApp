# CloudNet, open product decisions

**Owner:** Creative director and engineering, together
**Status:** Discussion. Nothing here is built yet.

Everything raised in review, written down so none of it gets lost. Ordered by
how much it changes the code, not by how it was raised.

---

## 1. How a shorts feed is actually ranked

Worth understanding properly, because it decides what the app has to measure.

### The two stage shape

Every one of these systems is two stages, never one:

1. **Candidate generation.** From everything on the platform, cheaply pick a few
   hundred a person might like. Follows, hashtags, past behaviour, what is
   trending near them.
2. **Ranking.** Score those few hundred expensively and order them.

The score is a weighted sum of *predicted probabilities*, not of past counts:

```
score = w1·P(watches to end)
      + w2·P(replays)
      + w3·P(likes)
      + w4·P(comments)
      + w5·P(shares)
      + w6·P(follows the creator)
      - w7·P(skips in the first 2 seconds)
      - w8·P(taps not interested)
```

Shares and follows carry the heaviest weights, because they predict the person
comes back. Likes are cheap and weakly predictive. A skip inside two seconds is
the strongest negative in the system.

### Four pieces of maths that matter for us specifically

**Bayesian smoothing.** This is the one that matters immediately, and the one
small platforms always get wrong. A clip with 1 like from 1 view is not better
than one with 800 likes from 1000 views, but the naive ratio says it is. Shrink
towards the platform average until there is enough data to trust:

```
smoothed_rate = (likes + alpha * prior_rate) / (views + alpha)
```

`alpha` is roughly "how many views before I trust this number", around 50 to
200. At CloudNet's launch volume, without this the feed is pure noise.

**Duration normalised completion.** Finishing a 10 second clip is not worth the
same as finishing a 60 second one. Rank on completion rate *and* absolute watch
time together, otherwise the feed collapses into nothing but 5 second clips:

```
value ~= completion_rate * log(1 + duration_seconds)
```

**The cold start ladder.** This is what gives a new creator a fair shot, and it
is the single biggest reason creators stay on a platform. Every new clip gets a
small guaranteed audience. Beat a threshold and it graduates:

```
300 impressions -> 3k -> 30k -> 300k -> ...
```

Graduation is judged on smoothed engagement against the median for that
category, not on raw counts. Formally this is a multi armed bandit; practically
it is a ladder with percentile gates.

**Time decay.** Shorts are perishable. Multiply the score by `e^(-lambda * age_hours)`
with a half life somewhere between 24 and 48 hours. Without decay the same
winning clip dominates for weeks and the feed dies.

**Diversity.** A hard constraint, not a weight: never two clips from the same
creator inside any window of five. Without it, one creator eats the feed.

### What this means for us, honestly

**We cannot build the ranking. It is a backend system and it needs data we do
not have yet.** At launch, with a small catalogue, plain recency plus the
diversity rule plus Bayesian smoothing will be indistinguishable from something
cleverer.

**But we must build the telemetry now,** because the model can only ever learn
from events that were recorded. If we do not emit them from day one, the data
does not exist retroactively and the algorithm starts from zero whenever the
backend is ready.

Per vertical view, the frontend needs to emit:

| Event | Why it matters |
|---|---|
| `impression` | the denominator for every rate |
| `watch_ms` and `duration_ms` | completion rate |
| `completed` | the strongest positive |
| `replays` | stronger than a like |
| `skip_at_ms` | a skip under 2s is the strongest negative |
| `like`, `unlike`, `save`, `share`, `comment` | the classic positives |
| `follow_from_vertical` | the highest value action there is |
| `not_interested`, `report`, `block` | explicit negatives |
| `source` | did this come from the feed, a profile, search or a share link |

That last one is quietly important: engagement on a clip someone sought out is
not evidence the feed chose well.

**This is a real frontend deliverable and it should be built before the backend
exists.** Events queue locally and post in batches, exactly like the upload
queue already does.

---

## 2. Channels, and the double follow problem

The problem as raised: if a user can follow a creator *and* follow their
channel, that is two relationships meaning almost the same thing, and nobody
will understand the difference.

Correct. Two buttons that both mean "I like this person" is a design failure.

### What a channel is on the app it came from

A WhatsApp channel is **broadcast only**. One to many, no conversation, only
reactions. It is deliberately not a group chat. Its value is that it is a
separate, quiet, opt in place, not mixed in with everything else.

### Three ways this can go

**A. A channel is just the profile.** Following a creator is following their
channel. One button, nothing to create. This is YouTube's model, where the
channel *is* the account.
Simple and impossible to misunderstand, but it throws away the idea entirely.

**B. A channel is a broadcast layer on top of following.** Following means
their videos reach your feed. The channel is a separate space where the creator
posts *announcements*: "new film Friday", behind the scenes photos, polls,
links. You cannot join a channel without following first, so it is an upgrade,
never a duplicate.

**C. A channel is fully independent.** A creator can run a channel with no
videos, a viewer can join without following. Maximum flexibility, maximum
confusion, and exactly the double follow problem we are trying to avoid.

### SETTLED: B, with one strict rule

**Following is the base relationship. The channel is an upgrade to it.**

- **Follow** - their verticals and films appear in your feed and Following tab
- **Join channel** - additionally, you receive their broadcast posts and get
  notified when they publish

You cannot join a channel you do not follow. Unfollowing leaves the channel
automatically. There is one relationship with two levels, not two relationships.

The industry already solved this shape: it is the follow button plus the
notification bell. We are giving the bell somewhere real to live.

### "What if the creator has not created a channel?"

Then **the button does not exist.** Not greyed out, not disabled with a
tooltip. Absent. A disabled control the user can never enable is noise on every
profile that will never have one.

- Viewer looking at a creator with no channel: no channel button at all
- Creator looking at their own profile with no channel: a **Create your
  channel** call to action, which is the only place it should appear
- Only accounts that have published something can create a channel, otherwise
  the platform fills up with empty channels

### Still open

Whether a channel post can be **paid or subscriber only**. That turns channels
into a second revenue line and it is a much bigger build. My instinct is to
ship free channels first and see whether anyone uses them before pricing them.

---

## 3. Search

Should cover creators, films and series, verticals, live events and hashtags,
with tabbed results and a sensible All tab.

### Music on verticals

Clarified: the goal is that a creator can put music under a vertical, the way
Facebook and TikTok allow, including clips built from still images or slides
with music playing underneath.

Two separate features usually get conflated here, and they should be built
separately:

1. **Sounds.** An audio track attached to a clip, which is tappable and
   reusable by other people.
2. **Photo mode.** Building a vertical from still images plus a sound, instead
   of filming.

**Where the music comes from is the hard part, and it is legal, not technical.**

| Source | Cost | Realistic for us |
|---|---|---|
| **Original sound**, the clip's own audio, reusable by others | none | **yes, now** |
| **Curated library**, royalty free or commissioned tracks | moderate, per track | yes, later |
| **Commercial catalogue**, real records by real artists | label and publisher deals, very large | no |

TikTok and Meta pay enormous sums for the third. That is not available to a
startup, and letting users upload commercial music we have not licensed makes
CloudNet liable, not the uploader. In Nigeria the collecting societies are COSON
and MCSN.

**Staged plan:**

- **Stage 1, free and legal, build first.** Every vertical's own audio
  automatically becomes a reusable sound, credited "Original sound, @handle".
  Tapping it shows every clip using it, with a **Use this sound** button that
  opens the composer with it attached. This costs nothing, is covered by the
  rights confirmation we already collect at upload, and it is the actual engine
  behind copy culture on every shorts platform. Most TikTok sounds are exactly
  this.
- **Stage 2.** A small curated CloudNet library, perhaps 100 to 300 tracks from
  Nigerian producers, commissioned or licensed per track. This is business
  development work, not engineering.
- **Stage 3.** Photo mode: pick images, pick a sound, set timing per slide.
- **Stage 4.** Commercial catalogue. Only ever with real label deals.

**Required either way:** a takedown path. Our existing report and moderation
flow becomes the mechanism, but it has to actually reach a human and actually
remove audio.

---

## 4. Wallet, closed loop

**Decided.** Removing withdraw and redeem from the viewer balance page. Only
creators withdraw, and only from the creator dashboard.

This is the right call, and the main reason is bigger than the UX.

### Why it matters more than it looks

**Regulation.** If a user can put money in and take the same money out, you are
operating money transmission. In Nigeria that means CBN licensing as a payment
service provider or mobile money operator, with the capital requirements and
compliance that follow.

If deposits are **non refundable credit, only spendable on CloudNet**, you are
selling prepaid credit for your own goods and services. A completely different
and far lighter regime.

**Laundering.** Deposit then withdraw is the textbook laundering path. A closed
loop removes it.

So this is a licensing decision that happens to also be a product decision.

### What it means in the ledger

**Two balances, never one.**

| Balance | Source | Can spend in app | Can withdraw |
|---|---|---|---|
| **Spendable** | deposits, promos, refunds, welcome credit | yes | **never** |
| **Earnings** | sales of your own content, ticket sales | yes | yes |

The rule is a **one way valve**: earnings may move into spendable, spendable may
never move into earnings. A creator can spend what they earned. Nobody can ever
convert a deposit back into cash.

This is a real change to the money model we already built, but a clean one: it
is one extra field on the wallet and one guard in the ledger.

### SETTLED: earnings are withdraw only, and live in the creator dashboard

Confirmed model, simpler than the version drafted above:

- **Add money** is the only way credit enters a viewer wallet, and it can never
  come back out
- **Earnings** exist only for people who publish. They appear in the creator
  dashboard, not on the viewer balance screen, and withdrawal happens there
- Becoming a creator is therefore the only route by which money ever leaves
  CloudNet

This removes the spend order question entirely: there is nothing to choose
between, because the viewer wallet only ever holds deposited credit.

**One consequence to confirm.** As specified, a creator who has earned 50,000
naira still has to deposit money to buy someone else's film, because earnings
are withdraw only. That is coherent and easy to explain. The alternative would
be letting earnings be spent in app as well, which is friendlier but reopens the
spend order question. Currently building it as withdraw only.

---

## 5. Blocking

Raised correctly: there is a blocked accounts list in settings, and no way to
block anyone. The list is currently a room with no door.

### How it works everywhere else

Blocking lives on **the overflow menu of the thing you are looking at**, never
in settings. Settings is only ever the place you *review and undo* it.

Entry points we need:

- Vertical, the existing more sheet: **Block this creator**
- Creator profile header: overflow with **Block** and **Report**
- A comment: long press or overflow, **Block this person**
- Live chat: same

### What blocking does

- Their content vanishes from your feeds, search and recommendations
- They cannot see your profile, content or comments
- Any follow in either direction is removed
- They are never told

**Block and Report must be separate and adjacent.** Block is about me and takes
effect instantly. Report is about the platform and goes to moderation. Merging
them makes people report things when they only wanted them gone, which poisons
the moderation queue.

---

## 6. Creator earnings, and why the dashboard is one page

The question was fair. **They should not be one page.** They answer three
different questions asked at different moments:

| Screen | Question | Content |
|---|---|---|
| **Overview** | how am I doing | views, watch through, followers, trend |
| **Earnings** | what have I made | gross, commission, net, per title, pending vs available |
| **Payouts** | where did my money go | withdrawal history, status, bank details |

They belong in one **section** with tabs, because a creator thinks of it as "my
business", but not on one scrolling page. This is the shape YouTube Studio and
Spotify for Artists both landed on, and they landed there from the same mistake.

### The earnings maths, and what we are currently missing

```
gross        = sum(price * units sold)
commission   = gross * 0.30
net          = gross * 0.70
```

That much exists. What does not:

**Pending versus available.** Money must not be withdrawable the instant a sale
happens. There is a refund window and a settlement delay from the payment
provider. So every sale is `pending` for N days, then becomes `available`. Ours
treats every naira as instantly withdrawable, which is wrong and would cost real
money the first time someone refunds.

**A minimum payout threshold.** Bank transfer fees make a 200 naira payout cost
more than it moves. A floor of around 5,000 naira is normal.

**Who pays the transfer fee.** Platform or creator. A decision, not a detail.

**Tax withholding.** Nigeria applies withholding tax to certain payments. This
needs an accountant, not an engineer, but the ledger has to be able to represent
it or retrofitting is painful.

---

## 7. Reset preferences

A fair challenge. Today it clears data saver, autoplay and captions back to
defaults, and the label tells the user none of that.

Two honest options:

- **Make it explicit.** Rename to "Reset app settings", and confirm with a
  dialog that lists exactly what changes *and* states plainly that it does not
  touch your account, wallet, purchases or uploads. That last reassurance is the
  entire point; the fear is what stops people tapping it.
- **Remove it.** It is low value and every setting can be changed individually.

I lean towards making it explicit, because the reassurance is genuinely useful
when something feels broken and someone wants a clean slate.

---

## 8. Loading and error states everywhere

The primitives exist: `StateView`, toasts, `Banner`, skeletons. Coverage is
inconsistent, which is worse than not having them, because the app feels
unreliable in exactly the places it is working hardest.

The standard, applied to every screen without exception:

**Every read needs three states plus content:** skeleton that matches the shape
of the real content, an error with a retry that actually retries, and an empty
state that says what to do next rather than "no data".

**Every write needs four:** the button shows pending and cannot be pressed
twice, success confirms with a toast, failure says what went wrong in plain
words *and what to do about it*, and anything touching money says clearly
whether it happened.

**Offline is its own state,** not an error. "You are offline" with automatic
retry when the connection returns.

**Error copy rule:** never show a code or a stack. Say what happened, and say
what to do. "Could not load your wallet. Check your connection and try again"
beats "NETWORK_ERROR" every time.

This is an audit and a sweep, not a feature. It is also the difference between
an app that feels solid and one that feels like a prototype.

---

## 9. Dark mode  SETTLED: last

Switch on the profile page, three options: system, light, dark. System should be
the default, because the phone already knows.

**Honest sizing: this is the largest item on this list.** Not conceptually, but
mechanically. Colours are currently written as literal Tailwind classes
(`bg-white`, `text-neutral-900`, `border-neutral-200`) across every screen. Dark
mode means replacing them with semantic tokens:

| Now | Becomes |
|---|---|
| `bg-white` | `bg-surface` |
| `bg-neutral-50` | `bg-surface-muted` |
| `text-neutral-900` | `text-primary` |
| `text-neutral-500` | `text-secondary` |
| `border-neutral-200` | `border-subtle` |

Plus the hardcoded hex values passed to icons and gradients, which have to read
from a theme hook instead of a constant.

Several hundred replacements across every file. Mostly mechanical, but it must
be done in one pass or the app ends up half themed, which looks worse than not
having it at all.

The player and the verticals feed are already dark and stay dark in both modes.
That is correct and normal.

---

## Suggested order

Ordered by dependency and by what unblocks the most.

1. **Wallet closed loop.** Touches the ledger. Everything about money sits on
   top of it, so it should move first.
2. **Blocking entry points.** Small, and currently a hole in a feature that
   claims to exist.
3. **Creator hub split.** Overview, Earnings, Payouts, plus pending versus
   available.
4. **Loading and error sweep.** Best done before more surface area is added.
5. **Vertical telemetry.** Must exist before the backend can ever rank anything.
6. **Channels.** Once the model is agreed.
7. **Search depth.** Depends on the music decision.
8. **Dark mode.** Last, deliberately. It touches every file, so doing it before
   the others means doing it twice.
