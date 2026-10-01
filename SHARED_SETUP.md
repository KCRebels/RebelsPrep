# RebelsPrep shared portals — setup pending

This code is prepared, but no shared project is configured or live. Keep HotB untouched.

1. Create a **new Firebase project for RebelsPrep**. Register a Web app. Copy its public `firebaseConfig` object into `shared-config.mjs`, replacing `null`. These public settings are not an admin credential; never put a service account or password in the repository.
2. Enable Authentication → Email/Password → **Email link (passwordless sign-in)**. Add `kcrebels.github.io` as an authorized domain. Coach emails already enabled: Recruiting@rebelssoftball.org, chrisolsen@finditds.com, halley.rindom@gmail.com, dmayhugh425511@gmail.com. Miles waits for his email. Verified email sign-in is required to activate or control practices.
3. Create Cloud Firestore in production mode. Publish the supplied `firestore.rules` in this new project only. Or use `firebase deploy --only firestore:rules --project YOUR_REBELSPREP_PROJECT_ID`. Never run this against the HotB project.
4. Before production: verify rules in the Firebase emulator/Rules Playground. Enabled verified coach may read/write team registry; unverified/other users may not. Anonymous users may get a single random portal/clock ID, may not list collections, and may not write anything. No deletes allowed. The supplied rules passed an isolated emulator test, including independent portal listener updates and denied unauthorized writes. They still need deployment and live project verification.
5. Publish the configured app. Sign in as Dan. Build and review a small test practice. Activate once. Open one player and one coach portal in separate browsers/devices. Test Start, Pause, Resume, Skip, Done, reload, and reconnect. Verify that excluded players see No active practice and that links remain the same on the next activation. Do not distribute links before this test passes.

## Behavior

Build remains a local draft. Activate commits every person's filtered assignment and one shared clock atomically. An unfinished active practice must be ended before another is activated. All roster players and coaches receive permanent random portal links (guests supported too). Open Portal buttons are available to signed-in coaches after activation. Portals do not need email or SMS login; anyone with that person's link can view that person's assignments. Treat links as private. Tokens live in the protected team directory, never hard-coded in source.

Start/Pause/Resume/Skip/Done use transactions against the shared clock. Portals watch the same clock and assignment documents. Device time is used for countdown display; cross-device clock skew must be checked in live testing. Cached snapshots display Reconnecting. Done immediately hides the active schedule; permanent links remain.

The rules and a shared listener were verified in an isolated emulator. The live Firebase connection, authentication delivery, deployed rules, and multi-device live synchronization cannot be verified until configuration is supplied. Shared RSVP, roster editing permissions, and drill submission remain separate work.

## Repeat validation

Run `npm install`, `npm test`, and `npm run test:rules` (Java 17+ for the pinned emulator CLI). The rules check uses demo-rebelsprep and never accesses a production project.
