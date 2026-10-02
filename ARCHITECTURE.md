# RebelsPrep account and access architecture

Status: adopted 2026-10-02. New account/check-in work must follow this model. Existing planner, scheduling, shared clock, roster, and practice-building behavior should be preserved unless migration requires a compatibility adapter.

## Identity model

RebelsPrep uses authenticated identities, not bearer portal links, as the long-term access boundary.

- Each player has one permanent player account and one stable player record. A player can open RebelsPrep directly from anywhere; a facility QR is never required to enter her account.
- Each coach has one permanent coach account.
- Firebase Auth UID is the authentication identity. Application records map that UID to a stable RebelsPrep player or coach ID.
- A player may belong to one or more teams without duplicating her player record.
- Combined/virtual groups such as All Nationals are roster groupings, not duplicate player identities.
- The current organization has 284 actual players when the combined All Nationals grouping is excluded. No schema, query, transaction, or UI limit should treat 284 as a maximum.

## Authorization model

Roles are explicit data, not a hard-coded email allowlist.

- organization admin/organization coach: access to every team and player in the organization.
- team coach: access only to explicitly assigned team IDs. A coach may have multiple team assignments without organization-wide access.
- player: read only her own private player data and permitted shared/public resources.
- Multiple coaches may work simultaneously.
- Coach-authored feedback records store immutable author UID, coach ID/name snapshot, and timestamps so authorship is retained.

Authorization must be enforced by Firestore rules as well as UI. Hiding a screen is not authorization.

## Player area

The permanent player account is the destination for player-facing information, including:
- My Focus and coach comments
- recommended drills / drill library
- practice information and assignments
- development/progress information
- other approved player-facing HotB information

HotB remains the coaching/game-analysis engine. RebelsPrep must not recreate HotB game-analysis logic. HotB will eventually publish selected player-facing outputs into the player's RebelsPrep data.

Recommended data boundary:
- organizations/{orgId}
- organizations/{orgId}/members/{uid}: role and team access
- players/{playerId}: stable non-secret player identity/profile
- players/{playerId}/private/*: player-visible private material
- teams/{teamId}: team metadata
- teams/{teamId}/coaches/{uid}: team assignment
- practices/{practiceId}: practice/session metadata
- practices/{practiceId}/assignments/{playerId}: player assignment
- facilities/{facilityId}: facility/check-in context
- feedback/{feedbackId} or player-scoped feedback: includes playerId, authorUid, authorCoachId/name snapshot, createdAt, updatedAt
- publishedFromHotB/*: player-facing snapshots/outputs; source metadata identifies HotB and source version/time

Exact collection names may evolve during migration, but these access boundaries may not.

## Facility QR and check-in

A facility QR identifies only the facility/check-in context. It does not identify a player and does not grant player-account access.

Required flow:
1. Player is already authenticated in her own RebelsPrep account.
2. Player taps Scan / Check In.
3. RebelsPrep opens the camera/scanner.
4. Player scans a facility QR (Barn, Shed, etc.).
5. The app now combines authenticated player identity with facility identity.
6. The app lists appropriate upcoming/active practice sessions at that facility for that player/team.
7. Player selects the session and checks in.

The QR payload should contain a stable facility identifier or opaque facility token only. It must not contain a player ID, player portal token, or private player data.

Check-in writes must derive player identity from request.auth.uid / membership mapping. The client must not be trusted to choose another player's identity.

## Migration / compatibility

Do not throw away working planner functionality.

Existing rpTeams, rpPortals, rpClocks, rpCheckinSessions, rpCheckinLocations and rpCheckins may remain temporarily as compatibility collections while the authenticated account model is introduced.

However:
- do not extend rpPortals bearer-token links as the new player-account system;
- do not make facility QR pages display a roster and ask the scanner to choose a player;
- do not persist a chosen player in localStorage as proof of identity;
- new player-private features must use authenticated player identity;
- existing shared practice activation can continue as a compatibility publisher while account-aware practice/assignment documents are added.

## Build order

1. Stabilize coach authentication and live Firestore deployment.
2. Add account/membership/role schema and security rules.
3. Provision coach permissions: org-wide vs assigned teams.
4. Provision permanent player accounts mapped to stable player IDs.
5. Add authenticated player shell/home area.
6. Convert facility QR/check-in to authenticated player + facility context.
7. Publish practice assignments into account-aware player data while preserving current planner/clock.
8. Add Focus, comments, drills and development surfaces.
9. Add HotB -> RebelsPrep publishing contract; keep analysis in HotB.
10. Retire legacy bearer player portals only after replacement behavior is verified.
