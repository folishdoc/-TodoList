# Testing Guide

本文档描述 Todolist 项目的测试体系、运行方法、编写规范。

## 📊 总览

| 类型 | 工具 | 数量 | 文件数 | 位置 |
|------|------|------|--------|------|
| 后端单元测试 | JUnit 5 + Mockito | 197 | 23 | `src/test/java/.../module/**/*Test.java` |
| 后端集成测试 | Testcontainers MySQL | 3 测试类 (9 用例) | 3 | `src/test/java/.../integration/` |
| 前端单元测试 | Vitest + Vue Test Utils | 291 | 29 | `src/**/*.test.ts` |
| E2E 测试 | Playwright | 96 | 18 | `e2e/*.spec.ts` |
| **总计** | | **587+** | **70** | |

## 🚀 运行测试

### 后端

```bash
# 仅单元测试（快速，< 2 min）
./mvnw test

# 含集成测试（需要 Docker）
./mvnw verify

# 仅集成测试
./mvnw verify -Dit.test='*IntegrationTest' -DfailIfNoTests=false
```

**集成测试需 Docker**：Testcontainers 自动启动 `mysql:8.0` 容器。无 Docker 时集成测试被自动跳过（`mvnw test` 仍全绿）。

### 前端

```bash
# 单元测试
npm test

# 单元测试 + 覆盖率报告
npm run test:coverage

# 覆盖率阈值：lines 70% / functions 70% / branches 60% / statements 70%

# E2E 测试（自动启动 dev server :5180）
npm run test:e2e

# Lint
npm run lint
npm run lint:fix
```

## 📁 测试组织

### 后端

```
src/test/java/com/liuzeyu/todolist/
├── support/                                # 公共基类
│   ├── BaseUnitTest.java                   # MockitoExtension 基类
│   ├── BaseControllerTest.java             # @WebMvcTest + 11 个 @MockitoBean
│   ├── BaseIntegrationTest.java            # Testcontainers MySQL（@Tag integration）
│   └── TestSecurityConfig.java             # @TestConfiguration 覆盖 SecurityFilterChain
└── module/
    ├── task/
    │   ├── controller/
    │   │   ├── TaskControllerTest.java
    │   │   ├── BatchOperationControllerTest.java
    │   │   └── RepeatTaskControllerTest.java
    │   ├── service/
    │   │   ├── TaskServiceTest.java
    │   │   ├── BatchOperationServiceTest.java
    │   │   ├── FileUploadServiceTest.java
    │   │   ├── RepeatTaskServiceTest.java
    │   │   └── ReminderServiceTest.java     # @Scheduled 测试
    │   └── integration/
    │       ├── TaskFlowIntegrationTest.java
    │       └── RepeatTaskIntegrationTest.java
    ├── anniversary/
    │   ├── service/AnniversaryReminderServiceTest.java  # @Scheduled 测试
    │   └── integration/AnniversaryReminderIntegrationTest.java
    ├── ...
```

### 前端

```
todolist-frontend/
├── src/
│   ├── api/*.test.ts                       # axios 接口单测
│   ├── components/*.test.ts                # 组件单测
│   ├── composables/*.test.ts
│   ├── stores/*.test.ts
│   ├── test-setup.ts                       # vitest 全局 setup
│   ├── utils/*.test.ts
│   └── views/Dashboard.test.ts             # Dashboard 容器单测
├── e2e/*.spec.ts                           # Playwright E2E
e2e/fixtures/api-mocks.ts               # 共享 API Mock 工具
├── playwright.config.ts                    # port 5180
└── vitest.config.ts                        # coverage thresholds
```

## 🔧 关键约定

### 后端

#### Spring 7 适配

| Spring 6 | Spring 7 |
|----------|----------|
| `@MockBean` | `@MockitoBean`（`org.springframework.test.context.bean.override.mockito.MockitoBean`） |
| `MockMvc.andExpect()` | `MockMvc.andDo(print()).andReturn()` |
| `@WebMvcTest` 自动 permitAll | `@WebMvcTest` 默认 deny-all SecurityFilterChain → 用 `TestSecurityConfig` 覆盖 |

#### @WebMvcTest 切片测试模板

```java
@WebMvcTest(MyController.class)
class MyControllerTest extends BaseControllerTest {
    @Test
    void testEndpoint() throws Exception {
        MvcResult result = doGet("/api/my-endpoint")
            .andReturn();
        assertThat(result.getResponse().getStatus()).isEqualTo(200);
    }
}
```

`BaseControllerTest` 已 mock 全部 11 个 service，**子类不要再 `@MockitoBean` 重新声明**（会冲突）。

#### @Scheduled 定时任务测试

**不等待 cron** —— 直接调用 service 方法：

```java
@SpringBootTest
class ReminderServiceTest {
    @Autowired private ReminderService reminderService;
    @MockBean private TaskRepository taskRepository;
    
    @Test
    void reminderTriggers() {
        when(taskRepository.findOverdueTasks()).thenReturn(List.of(task));
        reminderService.checkReminders();
        verify(taskRepository, times(1)).markReminded(any());
    }
}
```

集成测试中可加 `@Tag("integration")` + `BaseIntegrationTest` 用真实 MySQL。

### 前端

#### Vitest 组件测试模板

```typescript
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), error: vi.fn() }
}))

const stubElButton = defineComponent({
  name: 'ElButton',
  setup(_, { slots }) { return () => h('button', slots.default?.()) }
})

describe('MyComponent', () => {
  it('renders', async () => {
    const wrapper = mount(MyComponent, {
      global: { stubs: { ElButton: stubElButton } }
    })
    await flushPromises()
    expect(wrapper.exists()).toBe(true)
  })
})
```

#### Element Plus 组件 stub 关键点

- `ElButton` 等简单组件用 `template` 在根 slot 中可工作，但**复杂场景（dialog footer slot）必须用 `h()` 渲染函数**
- `ElDialog` stub 必须同时渲染 default + footer slot
- `ElForm` stub 必须 `defineExpose({ validate })` 让 `formRef.validate` 可调用
- `v-loading` 指令必须全局注册：`global.directives: { loading: { mounted/updated/unmounted: () => {} } }`
- `@element-plus/icons-vue` 的图标必须用 `defineComponent` stub，裸对象会报 "missing template or render"

#### Playwright E2E 模式

```typescript
import { test, expect, type Page } from '@playwright/test'

async function setupApiMocks(page: Page) {
  await page.route('http://localhost:18080/api/**', async (route) => {
    const url = new URL(route.request().url())
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ code: 200, message: 'success', data: null })
    })
  })
}

test('my test', async ({ page }) => {
  await setupApiMocks(page)
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000)  // 让 Vue 异步挂载完成
  
  await expect(page.getByText('首页')).toBeVisible()
})
```

**关键点**：
- `page.route()` 用**绝对 URL** `http://localhost:18080/api/**`，不能用 glob `**/api/**`
- `el-radio-button` 的 input 被内层 span 拦截，用 `click({ force: true })`
- `el-checkbox` 的 input 不可见，click 容器 + `force: true`
- 卡片 hover 才显示的按钮用 `force: true`

## 📈 覆盖率

```bash
# 后端
./mvnw verify
# → target/site/jacoco/index.html

# 前端
npm run test:coverage
# → coverage/index.html
```

阈值（CI 会强制）：
- 后端 Service 层：**80% 行覆盖**（JaCoCo）
- 前端：**lines 70% / functions 70% / branches 60% / statements 70%**（Vitest v8）

## 🚦 CI 流水线

`.github/workflows/ci.yml` 在 push/PR 触发：

1. **后端 job**：Java 17 + Maven + JaCoCo 报告
2. **前端 job**：Node 20 + Vitest + Playwright（chromium）

并发取消已配置，JaCoCo + Playwright 报告作为 artifact 上传。

## 🐛 常见问题

### `MockHttpServletRequestBuilder.andExpect()` 找不到方法
**Spring 7 已移除**。改用 `BaseControllerTest.doGet/Post/Put/Delete/Patch(...)`，返回 `ResultActions`。
```java
// ✗ 旧 API
mockMvc.perform(get("/api/x")).andExpect(status().isOk());
// ✓ 新 API
MvcResult result = doGet("/api/x").andReturn();
assertThat(result.getResponse().getStatus()).isEqualTo(200);
```

### `vi.fn()` 记录 reactive 引用被 mutate
mock.calls 中是引用，handleSubmit 后 `resetForm()` 会 mutate 记录值。**解决**：用 `mockImplementation` 在调用时快照捕获 `{...data}` 而非依赖 `mock.calls`。

### Playwright 端口冲突
5173 已被其他项目占用。Playwright webServer 用 `npm run dev -- --port 5180 --strictPort`。

### Docker 不可用
集成测试编译通过但运行需 Docker。在 CI 上自动有 Docker，本地开发可跳过。

### `@MockitoBean` 不能重复声明
`BaseControllerTest` 已声明 11 个 service 的 `@MockitoBean`，**子类不要重新声明**。
