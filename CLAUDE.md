# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Personal todolist application — Spring Boot 4.0.6 (Java 17, JPA/Hibernate, MySQL 8.0) backend + Vue 3/TypeScript/Vite/Element Plus frontend. Single-user mode: no login, uses a hardcoded personal JWT token.

## Commands

**Backend** (run from repo root):
```bash
./mvnw spring-boot:run          # Start backend on :8080
./mvnw compile                   # Compile only
./mvnw test                      # Run tests
```

**Frontend** (run from `todolist-frontend/`):
```bash
npm run dev                      # Vite dev server on :5173
npm run build                    # Type-check + production build
```

No linting or formatting tools are configured.

## Architecture

### Backend (`src/main/java/com/liuzeyu/todolist/`)

- **`common/`** — Cross-cutting: `Result<T>` unified response (`{code, message, data}`), `JwtAuthenticationFilter` extracts `@AuthenticationPrincipal Long userId`, `SecurityConfig` (stateless JWT, CORS allowed), `GlobalExceptionHandler`
- **`module/task/`** — Core tasks CRUD. `Task` entity has `parentId` for subtask hierarchy (flat storage, tree built in frontend). Also: batch operations, file attachments, repeat rules
- **`module/list/`** — Task lists/groups
- **`module/tag/`** — Tag management with `TaskTag` join table
- **`module/anniversary/`** — Anniversary/memorial day tracking. `AnniversaryReminderService` runs `@Scheduled(cron = "0 * * * * ?")` to check reminders. Reminder dedup via `ReminderLog` table
- **`module/habit/`** — Habit tracking with daily `HabitRecord`
- **`module/statistics/`** — Dashboard statistics
- **`module/export/`** — CSV/JSON export
- **`module/reminder/`** — Legacy reminder service

**Auth**: `SecurityConfig` requires auth on all endpoints except `/api/auth/**` and Swagger. The `JwtAuthenticationFilter` checks for a personal token (`app.personal.token=dev-personal-token-2026-secure-key`) which maps directly to `userId=1L`. Controllers inject the user via `@AuthenticationPrincipal Long userId`.

**Database**: JPA `ddl-auto=update` manages schema. SQL migration files in `database/` are for reference/initial setup only.

### Frontend (`todolist-frontend/src/`)

- **Single-page app**: `App.vue` is just `<router-view/>`. The only route is `/` → `Dashboard.vue`
- **`Dashboard.vue`** (~1600 lines) — The entire application shell. Contains task list views (today/upcoming/list-X/calendar/statistics/habits/anniversaries tabs), task edit panel, subtask rendering. Loads tasks flat via `getTasks({size:1000})` and builds tree in frontend
- **`components/CalendarView.vue`** (~800 lines) — Multi-mode calendar: month, week, daybar, bar. Uses pointer events for drag-based time editing. Custom grid layout
- **`components/AnniversaryList.vue`** — Anniversary CRUD with countdown display
- **`components/HabitsView.vue`** — Habit tracking UI
- **`components/StatisticsView.vue`** — Charts and stats
- **`components/SubtasksView.vue`** — Subtask rendering in edit panel
- **`components/TagsView.vue`** — Tag management dialog
- **`api/`** — One file per backend module; all use the shared `request.ts` axios instance
- **`utils/request.ts`** — Axios instance (`baseURL: http://localhost:8080/api`), injects Bearer token, unwraps `Result<T>` (checks `code === 200`, returns `res.data`)
- **`stores/user.ts`** — Pinia store, statically returns default user (no real auth flow)
- **`utils/theme.ts`** — Light/dark theme toggle via CSS class on `<html>`
- **`styles/dark-theme.css`** — Dark theme CSS variable overrides

### Key patterns

- Backend API returns `Result<T>` wrapper; frontend axios interceptor unwraps it — API functions return the `T` data directly
- Task hierarchy: stored flat with `parentId`, loaded in bulk and assembled into tree client-side
- Calendar drag operations use `setPointerCapture` + `pointermove`/`pointerup` with `@pointerdown.prevent.stop` to block click generation
- Task edit panel in Dashboard opens inline (not a route/modal), click on `el-main` closes it unless click is on the panel itself
- Subtask nesting fix: `doSave` must include `parentId: editingTask.value.parentId` in `mainTaskData` to prevent backend from setting `parentId=null` on update
