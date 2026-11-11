# Coach roster management verification

Development branch: `feature/coach-roster-management`; draft PR: https://github.com/KCRebels/RebelsPrep/pull/5

## Implemented in this continuation

- Shared one roster module instance across practice builder, team lists, coach Player Focus and roster management.
- Applied Firestore snapshots to individual and combined practice rosters, including empty teams and removed/transferred players.
- Preserved refreshed memberships when sending players into the practice worker.
- Added organization coach/admin transfer controls with a named destination selector and confirmation. Transfers retain player ID/history and atomically update both team directories using the existing store transaction.
- Made edits transactional so a concurrent transfer cannot leave an edit operating on a former team membership.
- Prevented late roster responses from overwriting a newer team selection and disabled controls during saves.
- Let organization coaches see active roster members in Player Focus even without assigned team IDs.
- Explicitly rejected inactive profiles in the player portal.
- Added cache/worker regressions, a synthetic Firestore lifecycle test using the production store, and browser interaction tests.
- Added dependency lockfile, browser CI checks, and Windows-compatible emulator command quoting.

## Verification scope

`npm test`: 59 tests passed locally. Browser suite: 3 passed locally in headless Chrome, with synthetic account/store responses. These browser tests cover roster add/edit/transfer/remove, failed-save recovery and assigned-team coach controls; they do not constitute a browser-to-Firestore end-to-end test.

CI for intermediate commit `70e3fd0` passed, including Firestore rules and the production-store synthetic lifecycle test. The final revision must also pass CI before release. The lifecycle test now additionally checks live membership authorization after a transfer and denial after removal, despite stale account team IDs.

Local Firestore emulator execution is blocked by missing Java. CI installs Java 21. No connected Firebase tools were exposed in this desktop session, so production collections, deployed rules and real coach account permissions were not independently inspected.

## Release gate

No merge, hosting deployment, Firebase rules deployment, production roster writes, account activation or seed/migration was performed. Production Build 420, actual players (including Maleah and Katelyn), and HotB data were not changed.

A browser-to-Firestore end-to-end test now runs inside the synthetic Firestore emulator job, using the production UI and store with emulator-only authentication. It verifies add/edit/transfer/remove against actual emulator documents. Its final CI result is required.

Before release: verify final CI (including the browser-to-Firestore test), verify real coach/account assignments (including Maryann) through authorized Firebase access, and compare deployed rules with the reviewed rules. Use synthetic players only. Production deployment remains deferred until those checks succeed.
