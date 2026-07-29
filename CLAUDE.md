# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Personal todolist application — Spring Boot 4.0.6 (Java 17, JPA/Hibernate, MySQL 8.0) backend + Vue 3/TypeScript/Vite/Element Plus frontend. Single-user mode: no login, uses a hardcoded personal JWT token.

## Commands

**Backend** (run from repo root):
```bash
./mvnw spring-boot:run          # Start backend on :8080
./mvnw compile                   # Compile only
./mvnw test                      # Run unit tests (< 2 min)
./mvnw verify                    # Full build + integration tests (needs Docker)
```

**Frontend** (run from `todolist-frontend/`):
```bash
npm run dev                      # Vite dev server on :5173
npm run build                    # Type-check + production build
npm test                         # Vitest (291 unit tests)
npm run test:coverage            # + coverage report
npm run test:e2e                 # Playwright (57 e2e tests)
npm run lint                     # ESLint
npm run lint:fix                 # ESLint with --fix
npm run format                   # Prettier
```

## Testing

**548+ tests** across 65 files (see `TESTING.md` for full details):

| Layer | Framework | Count |
|-------|-----------|-------|
| Backend unit | JUnit 5 + Mockito | 197 |
| Backend integration | Testcontainers MySQL | 9 (in 3 classes) |
| Frontend unit | Vitest + Vue Test Utils | 291 |
| E2E | Playwright | 57 |

**Coverage**: Backend Service layer 80% line coverage (JaCoCo). Frontend: lines 70% / functions 70% / branches 60% / statements 70% (Vitest v8).

CI: `.github/workflows/ci.yml` runs all tests on every push/PR.

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
- **`Dashboard.vue`** (~2432 lines) — The entire application shell. Contains task list views (today/upcoming/list-X/calendar/statistics/habits/anniversaries tabs), task edit panel, subtask rendering. Loads tasks flat via `getTasks({size:1000})` and builds tree in frontend
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

## Spring 7 / Vitest 4 适配要点

- **`@MockBean` 已移除** → `org.springframework.test.context.bean.override.mockito.MockitoBean`
- **`@WebMvcTest` 默认 deny-all SecurityFilterChain** → `src/test/java/.../support/TestSecurityConfig.java` 覆盖
- **`MockHttpServletRequestBuilder.andExpect()` 移除** → 用 `BaseControllerTest.doGet/Post/Put/Delete/Patch(...)` 返回 `ResultActions`
- **前端 `vi.fn()` 记录 reactive 引用被 mutate** → 用 `mockImplementation` 在调用时快照 `{...data}` 而非 `mock.calls`

## Auto-fix policy

发现以下问题时光直接修复，不需要等待审批：
- 编译/构建错误或警告（包括 TypeScript 类型错误）
- 运行时异常（前端 console error、后端 500）
- MyBatis 类型不匹配（如 resultType 与方法签名不一致）
- 空集合传入 SQL IN 子句导致的无效 SQL
- 前端模板中函数调用参数缺失
- E2E 测试 mock 与真实 API 不一致导致的漏报
- 测试环境中不同类型数据库（如 H2 vs MySQL）行为差异暴露的代码问题

## Key patterns

- Backend API returns `Result<T>` wrapper; frontend axios interceptor unwraps it — API functions return the `T` data directly
- Task hierarchy: stored flat with `parentId`, loaded in bulk and assembled into tree client-side
- Calendar drag operations use `setPointerCapture` + `pointermove`/`pointerup` with `@pointerdown.prevent.stop` to block click generation
- Task edit panel in Dashboard opens inline (not a route/modal), click on `el-main` closes it unless click is on the panel itself
- Subtask nesting fix: `doSave` must include `parentId: editingTask.value.parentId` in `mainTaskData` to prevent backend from setting `parentId=null` on update

## Playwright E2E 关键约束

- 端口 5180（5173 被其他项目占用）
- `page.route('http://localhost:18080/api/**', ...)` 必须用**绝对 URL**
- `el-radio-button` input 被内层 span 拦截，用 `click({ force: true })`
- `el-checkbox` input 隐藏，click 容器 + `force: true`
