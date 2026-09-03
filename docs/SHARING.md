# Sharing CloudNet with the team

**Owner:** Engineering
**Audience:** the builder, who runs these commands

---

## The short version

There is no link that can be generated from the code alone. A shareable preview
comes from an Expo account, and the commands below have to run on the machine
that holds the project.

Two routes. Use the second one.

---

## Why the easy route is closed

The obvious answer would be "publish it and send an Expo Go link". That path no
longer exists for this project:

- **EAS Update dropped SDK 54 on 1 May 2026.** `eas update` now fails with
  `sdkVersion 54.0.0 is not supported`. We are on SDK 54.
- **Expo Go from the app stores only ever supports the newest SDK.** SDK 57
  shipped on 30 June 2026. Anyone installing Expo Go today gets the SDK 57
  build, and it will refuse to open an SDK 54 project.

So even the teammate who does everything right ends up staring at a version
error. This is not a thing to work around, it is a signal: Expo Go was always
scaffolding, and we have reached the point where it stops carrying us.

---

## Route 1, tunnel, for right now

Only useful for someone who already has a working Expo Go on this SDK. Realistically
that is FEMS and the builder, nobody else.

```bash
npx expo start --tunnel
```

Prints an `exp://` URL and a QR code that work from any network, not just the
office wifi. Costs nothing and takes ten seconds.

**The catch:** it lives only while that terminal is open, on that machine. Close
the laptop and every tester's link dies. Fine for "look at this now", useless for
"have a play this week".

---

## Route 2, a real installable build, the one to use

This produces a permanent link and a QR code. Testers install CloudNet as an app
on their phone. No Expo Go, no SDK matching, no dependency on anyone's laptop
being awake.

### One time setup, already done

```bash
npm install -g eas-cli
eas init
```

Both are done. The project exists at
`https://expo.dev/accounts/innovatemie/projects/cloudnet`.

**You do not need `eas login`.** `EXPO_TOKEN` is set in the environment, so EAS
authenticates with that and the login command refuses to run. That is correct
behaviour, not a fault. Leave it alone.

**PowerShell note:** `&&` is not a statement separator in Windows PowerShell 5.
Run commands on separate lines, or use `;` between them.

### Two problems that came up, both fixed

**1. `Cannot read properties of undefined (reading 'CommonJS')`**

Our `tsconfig.json` forced `"module": "commonjs"` and `"moduleResolution": "node"`.
Expo's own base config sets `customConditions: ["react-native"]`, which is only
legal under `bundler` resolution, so the two were in direct conflict. TypeScript
had been reporting this all along as error TS5098; EAS hit the same conflict
inside its config loader and failed with a less helpful message.

Both overrides are gone. Resolution is now `bundler` with `module: preserve`,
which is what Expo expects. Typecheck is still clean at zero errors.

**2. `Cannot automatically write to dynamic config`**

EAS cannot edit a config file that is code rather than JSON, so it printed the
project id and gave up. That part is by design and there is nothing to fix. The
id is now written by hand into `extra.eas.projectId`.

The config was also moved from `app.config.ts` to `app.config.js`. External
tools read this file in their own process before any of our tooling exists;
making forty lines of static data depend on a transpiler is risk with no payoff.
The JSDoc type annotation keeps editor checking.

### Worth tidying

`eas init` ran three times and reported a different project id on the first run
(`2c0587b5...`) than on the last (`2f577b2c...`). Open
`https://expo.dev/accounts/innovatemie/projects` and delete any duplicate
CloudNet projects. If the surviving one does not show `2f577b2c-5c9d-4050-8028-ddff2e04ed38`,
copy its real id into `extra.eas.projectId` in `app.config.js`.

### If EAS offers to install expo-updates, say no

The build prompts:

> The build profile "preview" specifies the channel "preview", but the
> "expo-updates" package is missing. Would you like to install it?

**Answer n.** Channels exist to route over the air updates, and EAS Update does
not support SDK 54. Saying yes installs a package that cannot be used and runs a
configure step that may fail.

The `channel` keys have been removed from every profile in `eas.json`, so the
prompt will not appear again. Over the air updates come back on the table when we
move off SDK 54, not before.

### Before every build, without exception

```bash
npm run prebuild:check
```

Runs three things: typecheck, our native and asset check, and expo-doctor. All
three must be green. An EAS build takes fifteen minutes and comes out of a
monthly allowance; this takes thirty seconds and catches the failures we have
actually hit.

**Verify a risky change locally first, for free:**

```bash
npx expo run:android --variant release --device
```

Same release binary EAS produces, built on your own machine, costing nothing.
The first run downloads the Android NDK and is slow. Every run after is fast,
and it is the difference between burning a build allowance on a guess and
knowing before you spend.

### Now run the build

```bash
eas build --profile preview --platform android
```

### iOS

Harder, and Apple's rule rather than Expo's. Two options:

- **Ad hoc:** every tester's device UDID has to be registered first
  (`eas device:create`), then `eas build --profile preview --platform ios`.
  Capped at 100 devices.
- **TestFlight:** no UDIDs, up to 10,000 testers, but it needs a paid Apple
  Developer account at 99 USD a year and a review pass for external testers.

For a first round of feedback, Android only is the sensible call.

---

## What the team will be looking at

Worth saying in the message you send them, so the feedback comes back useful:

- **All data is mock.** Films, wallet balances, transactions, live events,
  everything is generated on the device. Nothing is saved and nothing is shared
  between two people's phones.
- **Payments do not move money.** The whole flow is real down to the ledger, but
  it settles against a mock, not Flutterwave.
- **Live broadcasting has no camera yet.** Schedule, green room, go live,
  dashboard and end event all work. The camera pane says so on screen.
- **Uploads go nowhere.** They run the real validation and progress, then stop at
  the boundary.

Ask for design and flow reactions. Bugs in the mock data are not bugs.

---

## The thing worth deciding

Route 2 builds a development build in the same breath as a preview build. That is
the same build the live camera needs.

So the cost of "let the team preview it" and the cost of "make broadcasting real"
are now the same cost, paid once. If we are doing one, we should do both.

---

## Sources

- [EAS Update dropping SDK 54](https://github.com/expo/expo/issues/45276)
- [Expo Go and the App Store, May 2026](https://expo.dev/changelog/expo-go-and-app-store-may-2026)
- [Expo SDK 56 changelog](https://expo.dev/changelog/sdk-56)
- [Internal distribution builds](https://docs.expo.dev/build/internal-distribution/)
- [Create and share an internal distribution build](https://docs.expo.dev/tutorial/eas/internal-distribution-builds/)
