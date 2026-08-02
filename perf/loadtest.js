/**
 * k6 压测脚本 - Todolist 核心 API 性能测试
 *
 * 安装 k6:  https://k6.io/docs/getting-started/installation/
 * 运行:     k6 run perf/loadtest.js
 * 自定义:   k6 run perf/loadtest.js -e BASE_URL=http://localhost:8080 -e VUS=20
 *
 * 前置条件: 后端已启动（./mvnw spring-boot:run），且 admin/admin123 账号存在
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend } from 'k6/metrics';

// ── 配置（环境变量覆盖）──────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:18080';
const USERNAME = __ENV.USERNAME || 'admin';
const PASSWORD = __ENV.PASSWORD || 'admin123';

// ── 自定义指标：每个接口单独追踪延迟 ────────────────────
const taskListTrend = new Trend('get_tasks_list', true);
const todayTrend = new Trend('get_tasks_today', true);
const statsOverviewTrend = new Trend('get_stats_overview', true);
const statsTrendTrend = new Trend('get_stats_trend', true);
const createTaskTrend = new Trend('post_tasks_create', true);

// ── 压测选项 ────────────────────────────────────────────
export const options = {
  stages: [
    { duration: '10s', target: 5 },   // 10 秒内爬升到 5 个并发用户
    { duration: '30s', target: 5 },   // 维持 5 个并发 30 秒（主要测量段）
    { duration: '10s', target: 0 },   // 10 秒内降到 0（收尾）
  ],
  thresholds: {
    // 门禁：不达标则 k6 退出码非 0（CI 中可阻断构建）
    http_req_failed: ['rate<0.01'],            // 错误率 < 1%
    http_req_duration: ['p(95)<300'],           // 95% 请求 < 300ms
    'get_tasks_list': ['p(95)<500'],      // 全量加载 P95 < 500ms
    'get_stats_overview': ['p(95)<200'],  // 统计聚合 P95 < 200ms
    'post_tasks_create': ['p(95)<200'],   // 创建任务 P95 < 200ms
  },
};

// ── setup：登录获取 JWT（所有虚拟用户共享）─────────────
export function setup() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ username: USERNAME, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const ok = check(res, {
    '登录成功': (r) => r.status === 200 && r.json('code') === 200,
  });
  if (!ok) {
    throw new Error(`登录失败: ${res.status} ${res.body}`);
  }

  return { token: res.json('data.token') };
}

// ── 压测主体：每次迭代执行一组接口调用 ──────────────────
export default function (data) {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // 读接口：全量加载任务（最重的查询，前端 size=1000）
  group('任务列表', () => {
    const res = http.get(`${BASE_URL}/api/tasks?size=1000`, { headers });
    check(res, { '200': (r) => r.status === 200 });
    taskListTrend.add(res.timings.duration);
  });

  // 读接口：今日任务
  group('今日任务', () => {
    const res = http.get(`${BASE_URL}/api/tasks/today`, { headers });
    check(res, { '200': (r) => r.status === 200 });
    todayTrend.add(res.timings.duration);
  });

  // 读接口：统计概览（5 条 COUNT 聚合，重点观察）
  group('统计概览', () => {
    const res = http.get(`${BASE_URL}/api/statistics/overview`, { headers });
    check(res, { '200': (r) => r.status === 200 });
    statsOverviewTrend.add(res.timings.duration);
  });

  // 读接口：7 天趋势
  group('统计趋势', () => {
    const res = http.get(`${BASE_URL}/api/statistics/trend?days=7`, { headers });
    check(res, { '200': (r) => r.status === 200 });
    statsTrendTrend.add(res.timings.duration);
  });

  // 写接口：创建任务（每次迭代创建一条，注意会污染数据）
  group('创建任务', () => {
    const payload = JSON.stringify({
      title: `k6-压测任务-${Date.now()}`,
      priority: 2,
      dueDate: new Date().toISOString(),
    });
    const res = http.post(`${BASE_URL}/api/tasks`, payload, { headers });
    check(res, { '200': (r) => r.status === 200 });
    createTaskTrend.add(res.timings.duration);
  });

  sleep(1); // 每次迭代间隔 1 秒，模拟用户思考时间
}
