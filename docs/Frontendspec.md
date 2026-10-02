# Frontend Spec - Mediate MR Mobile App (Audit, Repair and Build Guide)

Place this file at `mr-mobile/docs/frontend-spec.md`. It is the 7th context file. It does not replace prd, architecture, rules, design, task or memory. It tells the agent exactly how to audit, repair and finish the mobile app while keeping the current UI look.

Important: this spec was written from the project documents (task.md, CHANGELOG.md, memory.md, openapi.json and the context files). The source code was NOT available. Every finding in section 1 is evidence from documents and must be verified against the code. Never treat a finding as proven until the audit confirms it.

## 0. How the agent must use this file
1. Read order: memory.md, task.md, rules.md, this file, then design.md, prd.md, architecture.md as needed.
2. Do the work in the order of section 6 (repair plan). Do not start new features before the repair steps R0 to R5 are finished.
3. UI preservation (section 2) applies to every change.
4. The backend is not part of this work. The contract is `openapi.json` only. If a needed endpoint is missing from the contract, write it in docs/audit/missing-endpoints.md and stop for that screen; never guess field names.
5. Never mark anything done without evidence: command output, screenshot or device test note.
6. If you find a mistake in earlier work, say so plainly and fix it.

## 1. Findings from the documents (verify each one)
| ID | Finding | Evidence | Likely impact | How to verify |
|---|---|---|---|---|
| FND-01 | The shared openapi.json is a Phase 0 export: only /health, /ready, /api/v1/health, /api/v1/ready. memory.md says Phase 5 was exported on 2026-10-02 | openapi.json has 4 paths | Types for auth, users, customers, attendance, DCR, approvals, tour, expense, leave cannot come from it. Screens may use hand-written types or mock data. Wrong URLs or field names show up as screens that do not load | Count paths in src/api/generated/schema.ts; grep hand-written interfaces in src/features/**/types; get the real Phase 5 openapi.json from the backend repo |
| FND-02 | Native library log in memory.md lists only Phase 0 libraries, all "pending dev build". Later phases clearly need more native modules: location (P3), image picker (P1 photo, P5 receipt), maps (P2 LocationCard) | memory.md native library log; CHANGELOG | A native module added after the installed dev build was made is missing in that build. Result: red screen "Cannot find native module", blank screens, features that crash only on the phone | Compare native dependencies in package.json with the date of the installed dev build; read Metro and logcat errors; rebuild the dev build and test again |
| FND-03 | Demo or simulated code exists: Login has a "role quick-selector for demo logins"; expenses have "receipt attachment simulation" | CHANGELOG Phase 1 and Phase 5 | Fake paths hide real failures; receipts are not really uploaded | Grep: demo, mock, simulate, fake, quick, TODO |
| FND-04 | Several features are built as Modals launched from dashboard tiles: TourPlannerModal, ExpenseListModal, AddExpenseModal, LeaveListModal, ApplyLeaveModal, DcrFormModal, DoctorDetailModal | CHANGELOG | Android back button misbehaves, no deep links from notifications (needed in Phase 6), state lost on close, hard to test, layout bugs inside modals | Grep Modal; test back button on each |
| FND-05 | task.md marks many mobile tasks done that the CHANGELOG never mentions (see section 4 evidence column "T") | task.md vs CHANGELOG | "Done" is not trustworthy; missing screens are reported as finished | Section 4 matrix audit |
| FND-06 | Screens in design.md not mentioned anywhere in CHANGELOG: Manager Home, Team, Admin Home, Users screens, Hospitals, Territories, EntityPicker, Nearby, Attendance history, Geofence settings, Post-call, Follow-ups tabs, Customer timeline, Approval matrix, My Requests, offline outbox use | CHANGELOG vs design.md | Tabs probably still show Coming Soon placeholders | Open every tab for every role |
| FND-07 | memory.md contradicts itself: database named mediate_mr_db (D-14) and mediate_healthcare (Environment); Python 3.14.6 while rules B-01 says 3.12; no git tags although G-03 requires one per phase; Dependencies table stale; session log stops at Phase 0 | memory.md | Wrong assumptions in future sessions. Python 3.14 can break wheels such as pyodbc, argon2, pydantic-core (backend risk, check later) | Read memory.md; run git tag |
| FND-08 | Definition of Done not evidenced: no jest results and no real-phone test notes recorded for Phases 1-5, although task.md ticks real-phone tests | task.md, memory.md | Unknown real quality | Run npm test, typecheck, lint now; do the device test list in section 7 |
| FND-09 | The Admin Home requirement (live field activity of all MRs with photo, calls, doctors) is in none of prd.md, design.md, task.md | design.md section 6 | Admin Home will be built wrong or skipped | Section 8.2 defines it |
| FND-10 | Backend files are not part of this upload and will come later | owner message | Mobile must be contract-first, never guess | Section 5 rules |

## 2. UI preservation rules (the current look must stay)
The owner likes the current UI. Repair it, do not redesign it.
1. Before touching any screen, take a device screenshot and save it to `docs/ui-baseline/<route>-before.png`. After the change, save `<route>-after.png`. The two must look the same unless the change fixes a visible bug.
2. Frozen: colour tokens, typography, spacing scale, radius and the shared component look in design.md section 2 and 3. Only add props or variants to shared components. Never restyle them.
3. Allowed UI changes: fix overflow, clipping, safe-area, keyboard covering inputs, small-screen layout (360 dp), missing loading/empty/error states, touch targets under 44 pt, converting a Modal to a stack screen with the same visuals.
4. Not allowed without owner approval: new colours, new fonts, new layout, new icon set, reordering tabs, renaming screens that users see.
5. If new Stitch designs are supplied later, they go to `docs/ui/<screen>.png` and become the target for that screen only after the owner says "use this design".

## 3. Target structure
### 3.1 Folder structure (src)
```
src/
  app/                     # App.tsx, providers (Query, Toast, ErrorBoundary, Auth bootstrap)
  navigation/
    RootNavigator.tsx      # Splash -> AuthStack | MainNavigator
    AuthStack.tsx
    RoleTabNavigator.tsx   # tabs per role (design.md section 4)
    stacks/                # one stack per tab: HomeStack, PlanStack, CustomersStack, ...
    routes.ts              # ROUTE NAME constants (single source of truth)
    types.ts               # typed param lists for every route
  api/
    client.ts              # Axios + refresh interceptor
    generated/schema.ts    # from openapi.json only
    errors.ts              # maps server error {detail, code, errors} to friendly text
  theme/                   # tokens (frozen)
  store/                   # auth, settings, sync status
  offline/                 # sqlite, outbox, sync engine, cache repos
  mocks/                   # dev-only fixtures (see 5.4); never imported by production code paths
  shared/
    components/ hooks/ utils/ strings/
  features/<feature>/
    api/ hooks/ screens/ components/ schemas/ types/ index.ts
```
Feature folders: auth, profile, users, masters, territories, customers (doctors, hospitals, chemists, stockists), attendance, planning, dcr, followups, approvals, tours, expenses, leaves, tasks, notifications, meetings, joint-working, dashboard, reports, maps, products, promo-items, inventory, edetailing, orders, sync.

### 3.2 Navigation rules
- Every user-facing screen is a registered stack screen with a route name from `routes.ts` and typed params in `types.ts`.
- Modal presentation is allowed only for real dialogs: confirm dialogs, bottom sheets (filters, pickers, reject-comment), image preview. Full forms and lists are screens.
- Dashboard tiles navigate with `navigation.navigate(ROUTES.X)`; they never toggle local `visible` state.
- Android back button must go to the previous screen and never close the app from a nested screen.
- Tabs per role (frozen from design.md): MR = Home, Plan, Customers, Tasks, More. MANAGER = Home, Team, Approvals, Tasks, More. ADMIN = Home, Users, Masters, Reports, More.
- A tab or More item whose feature is not built yet shows a ComingSoon screen that names the phase. No tab may crash or be blank.
- Notification deep links (Phase 6) resolve through one `linking` config that uses ROUTES.

### 3.3 Screen state contract (every screen)
Loading skeleton, empty state, error state with Retry, pull-to-refresh on lists, offline banner, Pending sync chip for outbox items, role gating by permission code, keyboard-safe forms, safe-area padding, works at 360 x 640 dp and on large phones.

## 4. Screen matrix (target app)
Evidence column: E = named in CHANGELOG, T = ticked in task.md only, - = nothing found. Status after audit: PASS, FAIL, MISSING. Expected endpoints come from the project guide; the real contract is openapi.json.

### 4.1 Common
| ID | Route | Screen | Must show | Main API (verify) | Phase | Evidence |
|---|---|---|---|---|---|---|
| S01 | Splash | Splash | Session restore, version | /auth/me | P1 | T |
| S02 | Login | Login | Employee code or email, password, errors; demo role selector only in dev flag | /auth/login | P1 | E |
| S03 | ChangePassword | Change password | Old, new, confirm; forced mode | /auth/change-password | P1 | T |
| S04 | Profile | Profile | Photo upload, details, manager info, logout, logout-all | /profile, /profile/photo, /auth/logout | P1 | E |
| S05 | Notifications | Notification center | List, unread badge, mark read, deep link | /notifications | P6 | - |
| S06 | SyncStatus | Sync status | Pending, failed, last sync | local + /sync | P9 | - |
| S07 | ConflictReview | Conflict review | Mine vs server | /sync/push result | P9 | - |
| S08 | NeedsAttention | Needs attention | Rejected offline items | local | P9 | - |
| S09 | More | More menu | Role based list, logout | - | P1 | T |

### 4.2 MR
| ID | Route | Screen | Must show | Main API (verify) | Phase | Evidence |
|---|---|---|---|---|---|---|
| S10 | MrHome | MR Home | Greeting, check-in card, progress, next up, quick actions, alerts | /attendance/today, /planned-visits/daily | P4 | E |
| S11 | CheckIn | Check-in / out flow | LocationCard, accuracy, work type, offline pending | /attendance/check-in, /check-out | P3 | E |
| S12 | AttendanceHistory | Attendance history | Month view, list, hours | /attendance/history | P3 | T |
| S13 | TodayPlan | Today's plan | Week strip, timeline cards, Start visit | /planned-visits/daily | P4 | E |
| S14 | PlanVisit | Plan visit | EntityPicker, purpose, priority, date | /planned-visits | P4 | E |
| S15 | Customers | Customers (tabs Doctors, Hospitals, Chemists, Stockists) | Search, filters, cards, Nearby | /doctors, /hospitals, /chemists, /stockists | P2 | E (no hospitals) |
| S16 | CustomerDetail | Customer detail (4 types) | Contact, map, history, Start visit | /{entity}/{id} | P2 | E (doctor only) |
| S17 | CustomerForm | Add / edit customer | Use current location, validation | /{entity} | P2 | T |
| S18 | Nearby | Nearby customers | Distance sorted list | /{entity}/nearby | P2 | T |
| S19 | DcrList | Visit report history | Filters, status chips | /dcr | P4 | T |
| S20 | DcrForm | Visit report (steps) | Customer, location verify, products (disabled until P8), remarks, review, drafts | /dcr | P4 | E |
| S21 | PostCall | Post-call analysis | Outcome, response, follow-up | /dcr/{id}/post-call | P4 | T |
| S22 | FollowUps | Follow-ups | Pending, Overdue, Done, complete, reschedule | /follow-ups | P4 | T |
| S23 | TourList | Tour plans | List, status chips | /tours | P5 | E |
| S24 | TourPlanner | Tour planner | Dates, days, customers, overlap error | /tours | P5 | E |
| S25 | ExpenseList | Expenses | Monthly totals, list, rejected comment | /expenses | P5 | E |
| S26 | ExpenseAdd | Add expense | Type, amount, receipt camera or gallery (real upload) | /expenses, /files | P5 | E (simulated) |
| S27 | LeaveList | Leaves | Balances, history, cancel | /leaves | P5 | E |
| S28 | LeaveApply | Apply leave | Type, dates, half day, balance check | /leaves | P5 | E |
| S29 | MyRequests | My requests | Tour + expense + leave with status | the three lists | P5 | T |
| S30 | Tasks | Tasks list | Pending, Completed, Overdue | /tasks | P6 | - |
| S31 | TaskDetail | Task detail + chat | Status, messages | /tasks/{id}/messages | P6 | - |
| S32 | Meetings | Meetings | Upcoming, create, respond | /meetings | P6 | - |
| S33 | MyStock | My stock | Balances, history | /inventory/my-stock | P8 | - |
| S34 | Products | Product catalog | Search, detail, media | /products | P8 | - |
| S35 | EDetailing | E-detailing viewer | Slides, offline package | /presentations | P8 | - |
| S36 | Orders | Orders list, create, detail, PDF | Product picker, status | /orders | P8 | - |
| S37 | MyPerformance | My dashboard | Visits vs target, coverage | /dashboard/mr | P7 | - |
| S38 | Reports | Reports + export | Filters, export | /reports/{name} | P7 | - |
| S39 | MyRouteMap | My route map | Markers, polyline | /maps/mr/{id}/route | P7 | - |

### 4.3 Manager
| ID | Route | Screen | Must show | Main API (verify) | Phase | Evidence |
|---|---|---|---|---|---|---|
| S40 | ManagerHome | Manager Home | KPI cards, needs attention, team performance | /dashboard/manager | P7 | - |
| S41 | TeamList | Team (My MRs) | MR cards with status | /managers/{id}/mrs | P1 | T |
| S42 | TeamAttendance | Team attendance | Present, absent, late | /attendance/team | P3 | T |
| S43 | TeamMap | Team map | Pins, bottom sheet | /maps/team-locations | P7 | - |
| S44 | MrDetail | MR detail | Visits, plan, stock | several | P6 | - |
| S45 | ApprovalsInbox | Approvals inbox | Pending, History, badge, approve, reject with comment | /approvals/pending | P5 | E |
| S46 | ApprovalDetail | Approval detail | Request, receipts, timeline | /approvals/{id} | P5 | T |
| S47 | TaskAssign | Assign task | MR picker, due date | /tasks | P6 | - |
| S48 | JointWorking | Joint working form | Observation, feedback | /joint-working | P6 | - |
| S49 | Targets | Targets | Monthly per MR | /targets | P7 | - |

### 4.4 Admin
| ID | Route | Screen | Must show | Main API (verify) | Phase | Evidence |
|---|---|---|---|---|---|---|
| S50 | AdminHome | Admin Home: Live Field Activity | See section 8.2 | /dashboard/admin | P7 (UI shell earlier, see 8.2) | - |
| S51 | UsersList | Users | Search, filters, active toggle | /users | P1 | T |
| S52 | UserForm | User detail / create / edit | Role, manager, status | /users/{id} | P1 | T |
| S53 | AssignManager | Assign manager | MR to manager with history | /users/{id}/assign-manager | P1 | T |
| S54 | Masters | Masters | State, city, area, specialization, category, priority, dropdowns | /masters/{type} | P2 | E (state, city, area only) |
| S55 | Territories | Territories and assignments | Hierarchy, assign | /territories | P2 | T |
| S56 | CustomersAdmin | Customers admin + Excel import | Row-wise result | /{entity}/import | P2 | - |
| S57 | ApprovalMatrix | Approval matrix | Module tabs, step cards, conditions, preview | /approvals/workflows | P5 | T |
| S58 | GeofenceSettings | Geofence settings | Radius per type | /settings/geofence | P3 | T |
| S59 | ProductsAdmin | Products admin | CRUD, media | /products | P8 | - |
| S60 | StockAllocation | Stock allocation | Allocate, return, adjust | /inventory | P8 | - |
| S61 | Presentations | Presentations admin | Slides order | /presentations | P8 | - |
| S62 | Broadcast | System alert | Send to users | /notifications | P6 | - |
| S63 | AdminReports | Reports and export | Filters, export | /reports | P7 | - |

## 5. Data layer rules for the frontend
### 5.1 Contract first
- `src/api/generated/schema.ts` is generated by `npm run gen:api` from the latest backend `openapi.json`. Copy the backend file into the path used by the script before running it.
- After every regeneration run `npm run typecheck`. Every error is a real mismatch: fix it in the feature `api/` layer, never with `any` or casts.
- Delete hand-written API types once the generated ones cover them.

### 5.2 Feature API and hooks
- `features/<f>/api/*.ts`: plain functions that call Axios and return generated types.
- `features/<f>/hooks/*.ts`: TanStack Query hooks. Query key convention: `[feature, resource, params]`. Mutations invalidate the related keys.
- Errors: `api/errors.ts` maps `{ detail, code, errors }` to friendly text. Screens show only the friendly text.
- Screens never import Axios.

### 5.3 Auth and permissions
- Tokens only in SecureStore. One refresh at a time. Refresh failure logs out.
- `/auth/me` gives role and permission codes. Hook `usePermission("users:write")`. Hide actions in the UI; the server still enforces.

### 5.4 Mock policy
- Mock data is allowed only when the backend endpoint does not exist yet, only in `src/mocks/`, only behind `EXPO_PUBLIC_USE_MOCKS=true`, and each mock must list the missing endpoint in docs/audit/missing-endpoints.md.
- Production code paths must never import from `src/mocks/`. A release build has the flag off.
- Demo login role selector: only when `EXPO_PUBLIC_DEV_LOGIN=true`.

### 5.5 Offline
- Offline-capable actions: attendance, planned visits, DCR, follow-ups, expense drafts (later orders and detailing). Each writes an outbox row with `client_uuid`, updates the local cache and shows a Pending sync chip.
- Never claim offline support for a screen unless airplane-mode test passed.

## 6. Repair plan (do in this order)
| Step | Name | Do | Exit criteria |
|---|---|---|---|
| R0 | Freeze and baseline | Create git branch `repair/mobile-1` and tag `pre-repair`. Run expo-doctor, `npx expo install --check`, typecheck, lint, jest and save outputs in docs/audit/commands.md. Take baseline screenshots of every screen that opens | Tag exists; audit files saved; no code changed |
| R1 | Environment and native modules | List all native dependencies. Compare with the installed dev build. Update the native library log in memory.md. Rebuild the dev build if any native module is missing or unsure. Clear Metro cache (`npx expo start -c`). Fix package version mismatches with `npx expo install --fix` | App opens on the real phone with no red screen on startup; log updated |
| R2 | Contract sync | Get the latest backend openapi.json, run gen:api, run typecheck, fix every mismatch in the api layer, remove hand-written API types | typecheck clean with generated types only |
| R3 | Auth and session | Put demo login behind the dev flag. Verify login, refresh, logout, logout-all, forced password change with real tokens. Verify role tabs for ADMIN, MANAGER, MR | Three real logins work; token expiry test passes |
| R4 | Navigation refactor | Create routes.ts and types.ts. Convert every modal-as-screen (FND-04) into a stack screen with the same visuals. Replace blank tabs with named ComingSoon screens. Fix back button | Every screen reachable by route; back button correct; screenshots unchanged |
| R5 | Screen audit and fix | For every screen in section 4 with evidence E or T, run the checklist in section 7 and record PASS or FAIL in docs/audit/screens.md. Fix FAILs one screen at a time, smallest first. After each fix run typecheck, lint, jest, and compare screenshots | All claimed screens PASS or marked MISSING |
| R6 | Build the missing screens | Build screens marked MISSING for phases whose backend is finished (P1 to P5 first). Follow section 4 and design.md. Use real endpoints only | Each new screen PASS on device |
| R7 | Device test pass | Run the device test list (section 7.2) on a real Android phone | Results written in docs/audit/device-tests.md |
| R8 | Close out | Correct task.md, memory.md, CHANGELOG.md (section 10). Tag `mobile-repair-1` | Docs match reality |
After R8 continue the normal phases P6 to P9 using the mobile prompts in the guide and the specs in section 8.

## 7. Checklists
### 7.1 Per screen (R5)
- [ ] Opens from its route with no red screen or warning
- [ ] Uses real API through generated types (or documented mock)
- [ ] Loading skeleton, empty, error with Retry, pull-to-refresh
- [ ] Safe area correct; no clipping at 360 x 640 dp; no horizontal scroll
- [ ] Keyboard does not cover inputs; submit disabled while saving
- [ ] Role gating correct (try each role)
- [ ] Android back button correct
- [ ] Friendly error text only
- [ ] Offline behaviour matches section 5.5
- [ ] Screenshot after equals baseline (except fixed bug)

### 7.2 Device test list (R7)
1. Fresh install, login as ADMIN, MANAGER and MR; each sees its own tabs.
2. Wait for the access token to expire, then use the app; it refreshes silently.
3. Location permission denied, GPS off, poor accuracy; messages are clear.
4. Check-in, check-out, second check-in same day is refused.
5. Plan a visit, start a DCR, submit, post-call, follow-up created.
6. Airplane mode: check-in, plan and DCR queue as Pending; reconnect; no duplicates.
7. Expense with real receipt photo; leave apply with balance; tour overlap error.
8. Manager approves and rejects (reject needs comment); MR sees the result.
9. Rotate the phone, small screen, large font setting: no broken layouts.
10. Kill the app during a form; draft is still there.

## 8. Specs for the next frontend work
### 8.1 Phase 6 to 9 screens
Follow section 4 and the mobile prompts of the build guide. Key frontend rules for these phases:
- Tasks and chat: polling only while the screen is focused and the app is in the foreground; use a transport hook so WebSocket can replace it later.
- Notifications: register Expo push token after login, remove on logout, deep links through the single linking config.
- Maps: one MapView wrapper with permission handling and fallback; team map uses check-in and visit points only.
- E-detailing: slides cached for offline; tracks seconds per slide.
- Orders and DCR stock lines: queue offline; if the server later rejects with INSUFFICIENT_STOCK, show the item in Needs Attention.

### 8.2 Admin Home: Live Field Activity (owner requirement)
The first thing an Admin sees is the live state of all MRs in the field. Style: like the MR Buddy admin panel, with the current app tokens.
Layout (top to bottom):
1. Header: greeting, date chip (Today), notification bell with badge.
2. Summary strip (horizontal scroll): MRs in field (for example 38/52), Total calls, Doctors visited, Chemists visited, Attendance %, Not checked in.
3. Section "Live Field Activity" with a List | Map toggle, search, filter chips: All, Visiting, Checked in, Idle, Not checked in, On leave.
4. MR cards: round profile photo with a status ring (green active, amber idle 2+ hours, grey not checked in), name, employee code, territory, check-in time, stat pills (Calls, Doctors, Chemists, Samples), thin progress bar (calls vs target), line "Last activity: Visited <customer>, <time> (<n> min ago)" with a Verified or Not verified chip, map-pin button to open the MR location.
5. Pending approvals card with a small donut by type (Tour, Expense, Leave) and View all.
6. Quick links row: Users, Masters, Territories, Approval Matrix, Geofence Settings, Stock Allocation.
Rules:
- "Live" means last activity from check-in and visit events. No continuous background tracking (D-12, S-05). If the owner later wants moving dots, that is a new decision with MR consent.
- Data needs a backend endpoint (suggested: GET /dashboard/admin/live-activity with per-MR check-in time, today counts, last activity, target, status). Record it in memory.md Dependencies and in the backend P7 task list. Until it exists, build the UI with a mock adapter under src/mocks (section 5.4) and flag it clearly.
- Paginate or virtualize the list (FlatList). Pull-to-refresh; auto refresh every 60 seconds only while the screen is focused.
- Tapping a card opens MrDetail (S44). Scope: Admin sees all MRs.

## 9. Prompts for the agent (copy and paste, one at a time)
### Prompt A: Audit only (do this first)
```
ROLE: You are auditing the existing mr-mobile project. DO NOT change any source code in this task. Only create files under docs/audit/.

READ FIRST: memory.md, task.md, rules.md, docs/frontend-spec.md (sections 1 to 5), design.md.

DO:
1. Run and save raw results: npx expo-doctor, npx expo install --check, npm run typecheck, npm run lint, npm test. Save command, result and the first 40 error lines of each in docs/audit/commands.md.
2. List every dependency that contains native code. Compare with the native library log in memory.md and with the date of the installed development build. Write docs/audit/native-libs.md: library, used by which feature, in dev build yes/no/unknown.
3. Count the API paths in src/api/generated/schema.ts. Find hand-written API types under src/features/**/types and any mock, demo, simulated or fake code (grep: demo, mock, simulate, fake, quick, TODO, ComingSoon). Write docs/audit/contract-and-mocks.md.
4. List every file in src/features/**/screens and every screen registered in the navigators. Fill the screen matrix of docs/frontend-spec.md section 4 into docs/audit/screens.md with columns: route registered, file exists, uses real API, uses mock data, has loading/empty/error states, role-gated, opens without crash (write "needs device test" if you cannot know).
5. List every Modal used as a full screen (grep Modal) in docs/audit/modals.md.
6. Write docs/audit/SUMMARY.md: the top 10 problems ranked by impact with file paths and evidence, and a clear list of what you could NOT verify.
Do not fix anything. Do not invent results. If a command fails, record the error and continue.
```

### Prompt B: R1 and R2 (environment and contract)
```
Follow docs/frontend-spec.md section 6, steps R0, R1 and R2 only.
R0: create branch repair/mobile-1 and tag pre-repair.
R1: using docs/audit/native-libs.md, update the native library log in memory.md. Run npx expo install --check and fix mismatches with npx expo install --fix. Tell me exactly whether a new development build is required and give the build command; do not continue to R2 until I confirm the new build runs on my phone.
R2: I will place the latest backend openapi.json in the project. Run npm run gen:api, then npm run typecheck. Fix every mismatch in the feature api layers. Remove hand-written API types that the generated schema replaces. No any, no casts.
UI must not change (section 2). Report what you changed file by file.
```

### Prompt C: R3 and R4 (auth and navigation)
```
Follow docs/frontend-spec.md section 6, steps R3 and R4.
R3: keep the demo role selector only when EXPO_PUBLIC_DEV_LOGIN=true. Verify login, refresh, logout, logout-all and forced password change.
R4: create src/navigation/routes.ts and types.ts. Convert every modal-as-screen listed in docs/audit/modals.md into a registered stack screen with the SAME visuals (section 2): TourPlannerModal, ExpenseListModal, AddExpenseModal, LeaveListModal, ApplyLeaveModal, DcrFormModal, DoctorDetailModal and any other. Dashboard tiles must navigate by route. Replace blank or placeholder tabs with named ComingSoon screens that say which phase builds them. Fix the Android back button. Take before/after screenshots into docs/ui-baseline/. Work one screen at a time and run typecheck and lint after each.
```

### Prompt D: R5 (screen audit and fix loop, run once per feature)
```
Follow docs/frontend-spec.md section 6 step R5 for the feature: <FEATURE NAME, e.g. attendance>.
For each screen of this feature in section 4: run the checklist in section 7.1, record PASS or FAIL with evidence in docs/audit/screens.md, then fix FAILs one by one. After every fix run npm run typecheck, npm run lint and npm test, and compare screenshots with the baseline. UI must not change except to fix a visible bug. If a needed endpoint or field is missing from openapi.json, write it in docs/audit/missing-endpoints.md and skip that part. Finish with a short report: screens PASS, screens FAIL, files changed.
```

### Prompt E: R6 (build a missing screen)
```
Follow docs/frontend-spec.md section 6 step R6. Build this missing screen: <SCREEN ID AND NAME, e.g. S12 AttendanceHistory>.
Use the spec row in section 4, design.md and the existing shared components and tokens. Create it under src/features/<feature>, register the route in routes.ts and types.ts, use only generated API types and real endpoints, include loading, empty, error, pull-to-refresh and role gating, and make it work at 360 x 640 dp. Add tests for the hook. Do not touch other screens. Report files created and how to open the screen.
```

### Prompt F: R8 (close out)
```
Follow docs/frontend-spec.md step R8 and section 10. Update task.md so every mobile task of phases 1 to 5 shows its true state with evidence (PASS in docs/audit/screens.md, device test note, or commit). Correct memory.md (current state, environment, native library log, dependencies, session log for Phases 1 to 5 and this repair, git tag). Add a CHANGELOG entry for the repair. Tag mobile-repair-1. List anything still failing under Known issues in memory.md.
```

### Bug report template (give this to the agent when something does not run)
```
Screen: <name and route>
Role: <ADMIN / MANAGER / MR>
Steps: <1, 2, 3>
Expected: <what should happen>
Actual: <what happens>
Red screen or error text: <paste exactly>
Metro log / logcat: <paste last 30 lines>
Screenshot: <attach>
First find the root cause and explain it. Then fix it without changing the UI look. Do not use any or mocks to hide the problem.
```

## 10. Corrections to apply to the existing context files
### memory.md
- Current state: set "Mobile last finished phase" to "Phases 1-5 built, under repair (see docs/audit)". Set "Next task" to R0.
- Fix the database name conflict (D-14 says mediate_mr_db, Environment says mediate_healthcare): keep one name after checking the backend .env.
- Python version: note that rules say 3.12 but the machine runs 3.14.6; check backend dependency wheels later.
- Dependencies table: add "mobile repair R2 needs backend openapi.json (Phase 5 export)" and "Admin Home live activity needs backend endpoint /dashboard/admin/live-activity (P7)".
- Native library log: add every native library used since Phase 0 (location, image picker, maps and others) and mark which were included in the installed development build.
- Session log: add lines for Phases 1 to 5 and the repair work. Add the git tags once created.
- Context files row: add frontend-spec.md.

### task.md
- Add a new section before Phase 6:
```
## Phase R: Mobile repair (before Phase 6)
- [ ] R0 Freeze, tag pre-repair, baseline and audit files
- [ ] R1 Environment and native modules, new dev build if needed
- [ ] R2 Contract sync with latest openapi.json
- [ ] R3 Auth and session cleanup
- [ ] R4 Navigation refactor (modals to screens)
- [ ] R5 Screen audit and fixes
- [ ] R6 Build missing screens of Phases 1-5
- [ ] R7 Real-phone test pass
- [ ] R8 Close out docs and tag mobile-repair-1
```
- Change every mobile checkbox of Phases 1 to 5 whose evidence is "T" in section 4 from `[x]` to `[~]` until the audit proves it.
- Set "Current phase: Phase R (mobile repair)".

### rules.md (add to section 3 Mobile rules)
- M-18 Every screen is a registered route in navigation/routes.ts with typed params. Modals only for dialogs and bottom sheets.
- M-19 No mock, demo or simulated data in production paths. Mocks only in src/mocks behind a flag and listed in docs/audit/missing-endpoints.md.
- M-20 Before and after screenshots in docs/ui-baseline/ for any screen touched; the UI look is frozen (frontend-spec section 2).
- M-21 Native library added: update the native library log and rebuild the development build the same day.
- M-22 A task is "done" only with evidence: command output, screenshot or device test note.

### design.md (add)
- Section 6.8 Admin Home: Live Field Activity, copy section 8.2 of this file.
- Section 4: add "A tab or More item for an unbuilt feature shows a named ComingSoon screen. Tabs never crash or stay blank."