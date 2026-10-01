# RebelsPrep next build

Independent of HotB. GitHub Pages remains the host. Preserve approved white-frame-v5 icon and Option 3 header logo.

This milestone implements a coach-side local practice-builder pilot. It must clearly disclose local-device storage. Do not claim shared RSVPs, authentication, permissions, submission delivery, or a synchronized player clock before an independent backend is configured.

Defaults: KC Rebels Nationals, The Barn, 17:30, 180 minutes, 12-minute blocks including one minute rotation. Other block options 10/15. Other facilities are listed but not configured. Only Hitting enabled.

Group Warm Up first without tees; opening group Tee Work is removed. All drill stations 3–4 hitters. Machine lane 1; shared tunnel 1 Live OR 2 Front Toss lanes. Warm pitching outside tunnel, four concurrent pitcher/human pairs. Live player catcher preferred, 9Square fallback; coaches never catch Live. Pitchers must complete pitching warm-up before Live unless coach marks no warm-up. Pitching/catching Live max 3 blocks per player. Front Toss and Machine can repeat; other hitting drills cannot repeat. Every hitter needs Machine and Front Toss. Prioritize Live; explain shortfalls and let coach choose replacement/extension/adjustments without silently changing rules. Do not print.

Shared QR, email-password auth, protected roster management (Dan/Olsen), submissions to Dan, builder permissions and shared clock are outstanding backend work.

Implemented: confirmed 45-player image-and-written roster; manual attendance; local guest players; arrival/departure and role adjustments; independent drill snapshot; group-size/resource/no-repeat validation; explicit Live replacements and acceptance of role shortfalls; worker-based builder; individual coach/player assignment views; local Start/Pause/Resume/Skip/Done and history.

Checked with Node tests: 10/12/15-minute blocks within 180 minutes; 12/20/32/45 attendees; corrected roles; late arrivals and early departures; warm-up exemptions; invalid station and coach conflicts. Browser checks: setup, written roles, full/small-group builds, Adjust save, clock controls and reload persistence.

Limitations: heuristic search may fail even when a feasible schedule exists, and does not prove global optimality. Additional equipment is coach-confirmed by drill selection; no automatic inventory beyond the fixed Barn capacities. Shared responses/auth, permanent roster editing, guest coaches, drill submission/review, shared player views remain unimplemented. Voice announcements use device speech synthesis and are not verified on the user's iPhone. The local clock is a preview, not a published team practice.

Guided flow milestone: team Home, team-scoped drafts, fixed Home/Setup/Attendance/Drills/Build menu, step validation, final review, 39 searchable cards (Basic Tee Work removed) and selected Front Toss/Machine variants with instructions. New Practice alone clears attendance, coaches, guests, adjustments and drills; date/time edits and Home retain choices. Tee drills are selectable at any attendance size. After selections require more than six tees, an advisory equipment warning reports needed, available, and shortfall; selections remain intact. Concurrent scheduled stations still respect the six-tee inventory. Suggested additional-drill counts use a validated example, not a mathematical minimum. Selected drills that do not fit are identified on the plan.

Equipment correction: Basic Tee Work is removed from the picker and opening schedule. Clear All clears library selections and focus dropdowns, including search/category state. No attendance-based drill restrictions remain.
