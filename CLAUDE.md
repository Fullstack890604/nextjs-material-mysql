# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

CRM for a Vietnamese dental clinic. Next.js 15 (App Router) + MUI v6, plain JavaScript (JSX, no TypeScript), talking directly to MySQL/MariaDB via `mysql2` (no ORM). UI text, DB comments, and API messages are in Vietnamese — match that convention when editing existing files. Path alias `@/*` → `src/*` (`jsconfig.json`).

## Commands

```bash
npm run dev                # next dev via scripts/server.mjs, reads HOST/PORT from .env
npm run build              # next build, then postbuild auto-runs copy-standalone-assets.mjs
npm run start              # next start via scripts/server.mjs
npm run start:standalone   # run the standalone build (scripts/start-standalone.mjs)
npm run db:apply -- <file> # execute a .sql file against the DB (scripts/apply-sql.mjs)
npm run lint               # next lint (eslint-config-next/core-web-vitals)
```

There is no test suite/framework configured in this repo.

## Running & deploying

- `scripts/server.mjs` exists because `next dev`/`next start` don't read `HOST`/`PORT` from `.env` on their own — it spawns `next` with `-H`/`-p` from those vars. Don't call `next dev`/`next start` directly if you need a custom host/port.
- Standalone (`output: 'standalone'` in `next.config.mjs`): the `postbuild` hook (`scripts/copy-standalone-assets.mjs`) does everything Next's standalone output leaves out — copies `public/`, `.next/static`, `.env` and the root `web.config` (if present) into `.next/standalone`, prepends an env-bootstrap block to the generated `server.js`, and writes `.next/standalone/start.mjs`. No manual copying needed; `node server.js`, `node start.mjs` and `npm run start:standalone` all honour `HOST`/`PORT` from `.env`.
- Why that bootstrap exists: Next's generated `server.js` reads `process.env.PORT`/`HOSTNAME` on its first lines and never loads `.env`, so an unpatched standalone build always listens on 3000. The injected block (template `PRELUDE`, marker `__CRM_ENV_BOOTSTRAP__`, skipped if already present) loads the adjacent `.env` via `process.loadEnvFile` (KEY=VALUE fallback for Node < 20.12) and syncs `HOST` ↔ `HOSTNAME`, **preferring `HOST`** — Docker and Git Bash preset `HOSTNAME` to the container id / machine name and would otherwise override the configured bind address. Both files are regenerated on every build: change the `PRELUDE`/`STARTER` templates in `scripts/copy-standalone-assets.mjs`, never the files in `.next/standalone`.
- Production is IIS reverse-proxying (URL Rewrite + ARR) to the Node process from `.env`. The root `web.config` **must** contain `<httpErrors existingResponse="PassThrough" />` inside `<system.webServer>`, or IIS silently replaces every non-200 response from Next.js (404, 500…) with its own generic error page — which is why `src/app/not-found.jsx` renders correctly under `next dev` but looks broken on the real domain. If the production site has its own hand-maintained `web.config`, add just that one line rather than replacing the file.

## Workflow — adding a new table (end-to-end)

"Tạo table" means the feature is usable in the UI, not just DDL on disk. Deliver the whole vertical slice in this order without waiting to be asked for each step:

1. Read the DB connection from `.env`.
2. Write `database/<TableName>.sql` — full `CREATE TABLE`, following the schema conventions below.
3. Actually create the table: `npm run db:apply -- database/<TableName>.sql`. If that's blocked by permissions, leave the file in place and ask the user to run it.
4. Create the API routes under `src/app/api/<resource>/route.js`.
5. Create the admin page under `src/app/(admin)/<feature>/page.jsx`, with its dialogs alongside. Register it in `SysMenus`/`SysRoleMenus` or `RouteGuard` will block it.

Before writing any page/dialog code, read `src/components/` and reuse what's there (`PageHeader`, `DialogCloseButton`, `ConfirmDialog`, `NumberField`, `AutocompleteField`, `Breadcrumbs`) instead of rewriting equivalents.

**No stat strip on danh mục pages.** A category/CRUD page (`settings/categories/*` and anything shaped like it) is just PageHeader + table — do not add a `MiniStat` summary card above the table. `MiniStat` belongs on report/dashboard pages only; on a danh mục page the numbers already live in the `TỔNG CỘNG` row. Search is not a per-page filter bar either — see "Search — TopNav-driven" below.

## Data layer — raw MySQL, no ORM

- `src/lib/db.js` owns a single lazily-created `mysql2` pool built from `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`, and exports the only four things routes should use:

  ```js
  const rows = await query("SELECT `Code`, `Name` FROM `Position` WHERE `Code` = :code", { code });
  const row  = await queryOne("SELECT `Password` FROM `SysAccounts` WHERE `UserName` = :u LIMIT 1", { u });
  const { affectedRows } = await execute("DELETE FROM `Position` WHERE `Code` = :code", { code });
  await transaction(async (tx) => { await tx.execute(...); });   // tự commit / rollback
  ```

  Parameters are **named** (`:name`) and passed as an object — never concatenate values into SQL. There is no query builder/ORM/repository layer; follow this pattern for new routes. `getPool()` is exported too but only needed outside these helpers.
- **Quote every identifier with backticks** (`` `Table` ``, `` `Column` ``) — the direct analogue of the old `[Bracket]` style. Not optional: `SysMenus.Text` collides with the reserved word `TEXT`, and future columns may too.
- `typeCast` in `db.js` deliberately reshapes three types — read the comment there before changing it: `TINYINT(1)` → boolean (the UI compares `isActive === false`), date/datetime → raw local-time **string** (a `Date` would be JSON-serialized as UTC and display 7 hours off), `DECIMAL` → number.
- Schema lives in `database/*.sql` (one file per table, full `CREATE TABLE`), plus `database/schema.sql` which recreates everything in FK-safe order. Incremental changes go in `database/migrations/YYYY-MM-DD_Description.sql` — plain, re-runnable scripts using `CREATE TABLE IF NOT EXISTS` / `DROP ... IF EXISTS`, or guarded by a lookup in `information_schema.COLUMNS` when adding a column.
- Applying them: run `npm run db:apply -- <path/to/file.sql>` (reads creds from `.env`, sends the file with `multipleStatements`, statements separated by `;`). This needs a one-time allow rule in `.claude/settings.json` (`Bash(npm run db:apply:*)`) that the **user** must add — Claude cannot self-grant permissions. If it's absent, leave the file and ask the user to run the command.
- Naming: table and column names are **always in English**, never Vietnamese — `Patient`, `Appointment`, `TreatmentRecord`, `FullName`, `CreatedDate`. Only comments, seed data, and user-facing text are Vietnamese. Columns are PascalCase in the DB, camelCase in JS/JSON. `src/lib/apiResponse.js` (`keysToCamelCase`/`keysToPascalCase`) converts outgoing responses automatically — `apiOk()` camel-cases `data` unless `convertKeys: false`. Incoming bodies are read as camelCase and mapped to the named SQL params manually in each route.
- Numeric columns (money, quantity, percent) must be `decimal` with 2 decimals: `decimal(18,2)` for amounts/quantities (`Price`, `Discount`, `Paid`, `Qty`), `decimal(5,2)` for percentages (`DiscountPct`). Never `int`/`float`/`double` — see `TreatmentRecord.sql`, `PatientPayment.sql`, `PriceList.sql`.
- Column types follow the migrated conventions: `varchar(n)` (the DB is `utf8mb4`, so no separate `nvarchar`), `tinyint(1)` for flags, `datetime(6)` for audit timestamps written with `NOW(6)`, plain `datetime` written with `NOW()` for the older tables that use it (`Locations`, `SysLocationPermissions`) — match the column you are writing to.

### MySQL dialect traps carried over from the SQL Server original

- **`INSERT ... VALUES` cannot read the table it inserts into** (error 1093/1287). The "next SortOrder" idiom must be written as `INSERT ... SELECT` over a derived table:

  ```sql
  INSERT INTO `Position` (`Code`,`Name`,`SortOrder`, ...)
  SELECT :code, :name, IFNULL(:sortOrder, `nx`.`n`), ...
    FROM (SELECT IFNULL(MAX(`SortOrder`), 0) + 1 AS `n` FROM `Position`) AS `nx`
  ```

  Where the logic is more than one branch (see `sys-menus/[id]/route.js`), compute the value in JS with a separate `queryOne` instead.
- `ISNULL(a,b)` → `IFNULL(a,b)`; `SYSDATETIME()` → `NOW(6)`; `SELECT TOP n` → `LIMIT n`; `[Col] = expr` aliasing → `expr AS \`Col\``.
- The DB collation is `utf8mb4_unicode_ci`, so `LIKE` is both case- and accent-insensitive (`'%HA NOI%'` matches `Hà Nội`) — search filters need no extra normalization.

## API routes — standardized envelope

Every handler under `src/app/api/**/route.js` returns `apiOk(data, message, opts)` or `apiFail(message, opts)` from `src/lib/apiResponse.js`, producing `{ status: "OK"|"FAILED", title, severity, message, data, [count] }` — `severity` drives client-side toast styling via `ToastContext`. Routes that touch the DB declare `export const runtime = "nodejs"` (the `mysql2` driver doesn't run on Edge).

## Auth — stateless HMAC sessions, one session per account

- `src/lib/session.js`: access (30 min) + refresh (7 day) tokens are `base64url(payload) + "." + base64url(HMAC-SHA256(payload))`, signed with `SESSION_SECRET` and verified via Web Crypto so they work in both Edge middleware and Node route handlers.
- `src/middleware.js` guards every `/api/*` route except the auth endpoints (`login`, `logout`, `refresh`, `session-check`, `session-stream`). It reads the token from the `crm_session`/`crm_refresh` cookies or an `Authorization: Bearer` header, verifies the HMAC, and — since Edge can't reach MySQL — calls `/api/auth/session-check` internally to confirm the token's `sid` is still the account's current session. On an expired access token with a valid refresh it transparently mints a new access token and sets the cookie.
- "Last login wins" is enforced server-side: `src/lib/sessionStore.js` keeps the current session id in `SysAccounts.CurrentSessionId`; `src/lib/sessionBus.js` is an in-memory SSE registry (`session-stream` route) that pushes a `kicked` event to the account's other tabs/devices on a new login. Single Node process only — it will not propagate across instances.
- `src/lib/apiClient.js` patches `window.fetch` client-side to attach the bearer token to same-origin `/api/*` calls, retry once after refreshing on a 401, and redirect to `/login` (or defer to `AuthContext`'s countdown dialog) when the session is truly gone.
- `src/lib/password.js`: primary scheme is SHA-256 → Base64 (legacy "SASCO" convention), with hex SHA-256/SHA-1/MD5 and optional plaintext (`ALLOW_PLAINTEXT_PASSWORD=true`) fallbacks for legacy data.

## Permissions & menus — DB-driven, per-page CRUD flags

Menus and per-role permissions live in `SysMenus`/`SysRoles`/`SysRoleMenus`/`SysAccountRoles`. `MenuContext` (`src/context/MenuContext.jsx`) fetches the user's menu tree once (`/api/menus?username=`) and shares it app-wide. `usePagePermissions()` matches the current pathname against menu paths (exact match, else longest prefix) to derive `{ canView, canCreate, canEdit, canDelete, canPrint, canExport, canImport, canReport }`. `RouteGuard` (`src/components/RouteGuard.jsx`) wraps the admin layout and fail-closed blocks any route not in the user's menus — the only exception is `/settings`, a container route with no page content of its own.

The home page `/` is a real menu entry (`SysMenus.Path = '/'`, "Tổng quan") and is checked like any other route; do **not** add it back to `RouteGuard`'s always-allowed set, or direct URL access would bypass its per-role `canView`.

## App structure

- `src/app/(admin)/**` — authenticated shell (layout with `Sidebar`/`TopNav`, wrapped in `RouteGuard`), one folder per feature: `patients`, `patient-overview`, `appointments`, `treatments`, `payments`, `prescriptions`, `prescription-templates`, `reports`, `settings/*`. Feature-specific dialogs/panels live next to `page.jsx`, not in `src/components`.
  - `patient-overview` is the read-only consolidated patient record (thông tin + điều trị + dịch vụ + toa thuốc + thanh toán/công nợ), served by the single aggregate endpoint `/api/patient-overview` (list mode without `patientCode`, full bundle with it).
- `src/app/api/**` — one folder per resource, mirroring the DB tables.
- `src/components/**` — shared/cross-feature UI only (`Sidebar`, `TopNav`, `Breadcrumbs`, `ConfirmDialog`, `DialogCloseButton`, `NumberField`, `MiniStat`, `PageHeader`, `RouteGuard`).
- `src/context/**` — `AuthContext` (login/logout, kicked-session dialog), `MenuContext` (permissions), `ToastContext` (global notifications driven by the `severity`/`message` fields of the API envelope), `SearchContext` (TopNav search box shared with the current page via `usePageSearch`).

## Formatting values

- **Numbers/currency/percent** — always via `formatNumber` in `src/lib/numberFormat.js`; never `toLocaleString`/`Intl.NumberFormat` ad hoc in components. `formatNumber(value, { type: "quantity"|"currency"|"percent", currency: "VND"|"USD", compact, decimals, toFixed, showPositiveSign })`, e.g. `formatNumber(1000000, { type: "currency" })` → `"1.000.000 đ"`, `+ compact: true` → `"1.0M đ"`. Defaults to `vi-VN`/`VND` with `đ` substituted for `₫`.
- **Dates** — always via `fmtDate`/`fmtDateTime` in `src/lib/dateFormat.js`; never `new Date(v).toLocaleString()`. `date`/`datetime` columns are written in local time (`NOW()`/`NOW(6)`), and `db.js`'s `typeCast` hands them to JS as raw strings (`"2026-07-28 13:55:14.858729"`) precisely so they never pass through `Date` — building a `Date` would make `JSON.stringify` emit UTC and shift the display by the local offset (+7 in Vietnam). Both helpers parse the components straight out of the string — do the same for any new date formatting.

## Tables

Every MUI table needs **pagination** and, whenever it has numeric columns, a **`TỔNG CỘNG` footer row**.

**Pagination** — `TablePagination` (`component="div"`) with local `page`/`rowsPerPage` state, default `rowsPerPage = 10`, and a `useMemo` slice `filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)`. Reference: `src/app/(admin)/prescriptions/page.jsx`, `src/app/(admin)/payments/page.jsx`. Standard props:

```jsx
rowsPerPageOptions={[10, 25, 50, 100, 500, 1000]}
labelRowsPerPage="Số dòng"
labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
```

Reset `page` to 0 in a `useEffect` when filter inputs change, and clamp `page` in a separate `useEffect` when the filtered count shrinks below the current page.

**Totals row** — see the four tables in `src/app/(admin)/patient-overview/page.jsx`:
- Sum the **whole filtered dataset**, not the current page (`records`, not `recordPaging.paged`), so totals don't change while paging. Compute it in a `useMemo` next to the list.
- Render it as the last `TableRow` in `TableBody`, only when there's at least one row. Cells use a shared `totalCellSx = { ...cellSx, fontWeight: 700, bgcolor: "grey.100" }` and keep their column's colors (`secondary.main` for thành tiền, `success.main` for đã thu, `RED` for công nợ > 0).
- The label cell spans the leading non-numeric columns via `colSpan`; use an empty `<TableCell sx={{ bgcolor: "grey.100" }} />` where a sum is meaningless (đơn giá, trạng thái, PT thanh toán). The row's cell count must still match the header's.
- If rows are excluded from the sums (canceled records…), say so inline in a `Typography variant="caption"` after the label — e.g. `(12 phiếu, không tính phiếu đã hủy)`.
- Format every number through `formatNumber` (`vnd`/`qty` helpers), never raw arithmetic output.

## Search — TopNav-driven, not per-page fields

There is one search box, in `TopNav.jsx`, shared across pages via `SearchContext`/`usePageSearch` (`src/context/SearchContext.jsx`) — desktop shows it full-width, mobile collapses it to a magnifying-glass icon that expands the field on tap. Pages do **not** render their own search `TextField`/filter bar; instead call the hook and use the returned string in the page's existing `useMemo` filter:

```jsx
const search = usePageSearch("Tìm theo mã, tên, mô tả..."); // placeholder shown in TopNav while this page is mounted
```

`usePageSearch` sets the TopNav placeholder on mount and clears the keyword on unmount, so leftover text from one page never leaks into the next. Reference implementation: `src/app/(admin)/settings/categories/payment-methods/page.jsx`. Apply this to every danh mục/list page instead of adding a local search field.

## Form field conventions

- **Patient full name is always uppercase**, as the user types rather than on display: `PatientFormDialog.jsx`'s "Họ tên" field uses a dedicated `handleFullNameChange` storing `e.target.value.toLocaleUpperCase("vi-VN")` (not the generic `setField`), so `Patient.FullName` is already uppercase in the DB. Use `toLocaleUpperCase("vi-VN")`, not `.toUpperCase()`, for any such field — plain `.toUpperCase()` mishandles some Vietnamese diacritics.
- **List data always uses `AutocompleteField`, never `TextField select`.** Any field that picks from a data list — phòng ban, tổ/nhóm, nhân viên, địa điểm, chức vụ, khách hàng, and every future danh mục — uses `src/components/AutocompleteField.jsx` so the user can type to search instead of scrolling a `MenuItem` list. Each row in the dropdown shows a colored `Dot` before its label. Value in/out is the **code string**, not the option object; clearing (the X button) yields `""`, so no `— Chưa phân công —` placeholder item is needed — pass `placeholder` instead:

  ```jsx
  <AutocompleteField label="Phòng ban" value={form.departmentCode}
    onChange={(v) => setForm((f) => ({ ...f, departmentCode: v }))}
    options={departments} optionCaption="code" required
    error={!form.departmentCode} helperText={!form.departmentCode ? "Vui lòng chọn phòng ban" : ""}
    startIcon={<AccountTree fontSize="small" />} />
  ```

  Defaults are `optionValue="code"` / `optionLabel="name"` — override per source (`optionLabel="fullName"` for Staff, `optionValue="locationCode" optionLabel="locationName"` for Locations). `dotColor` takes a string or `(option) => color` when the dot should carry meaning. Import `Dot` from the same file rather than redefining it.
- **Colored dot on enum selects** — a short fixed enum (trạng thái, giới tính: 2–4 giá trị, not data from a table) stays a `TextField select`, with a small colored circle before the label text in both the closed field and every `MenuItem`. Pattern (see `AppointmentFormDialog.jsx`): a `{ value: colorToken }` map — reuse an existing mapping like `statusColor()` from `page.jsx` so it matches the Chips elsewhere — with the shared `Dot` from `AutocompleteField.jsx`, applied via `slotProps={{ select: { renderValue: ... } }}` on the field and `<Dot color={map[s]} />{s}` inside each `<MenuItem sx={{ display: "flex", alignItems: "center" }}>`.

## Locations / multi-branch

Several tables (`Patient`, `Appointment`…) key off `LocationCode` — see `database/Locations.sql` and `SysLocationPermissions.sql`. The system supports multiple clinic locations with per-account location permissions; check `SysLocationPermissions` when working on data scoping.
