/**
 * App.vue — 根组件
 *
 * 根据路由路径决定渲染模式：
 * - `/widget` → 嵌入式 widget 模式，无外壳直接显示 router-view
 * - 其他路径 → 标准桌面应用模式：显示 TitleBar（Tauri 标题栏），
 *   轮询后端健康检查接口直到后端就绪，再渲染 router-view
 *
 * 只有 Tauri 环境下（`__TAURI_INTERNALS__` 存在）才会执行后端轮询逻辑；
 * 浏览器开发模式或 widget 模式下直接渲染。
 */
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import TitleBar from './components/TitleBar.vue'

const route = useRoute()
const isWidget = computed(() => route.path === '/widget')
const isTauri = '__TAURI_INTERNALS__' in window
const backendReady = ref(!isTauri || isWidget.value)
const backendError = ref(false)

/** 轮询后端健康检查（最多 30 秒），Tauri 桌面环境专用 */
onMounted(async () => {
  if (!isTauri || isWidget.value) return
  for (let i = 0; i < 30; i++) {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/i, '') || 'http://localhost:18080'
      const r = await fetch(apiBase)
      if (r.ok) {
        backendReady.value = true
        return
      }
    } catch {/* 后端未就绪，继续轮询 */}
    await new Promise((r) => setTimeout(r, 1000))
  }
  backendError.value = true
})
</script>

<template>
  <!-- Widget 模式：直接渲染路由视图，无外壳 -->
  <template v-if="isWidget">
    <router-view />
  </template>
  <!-- 桌面模式：显示标题栏，后端就绪后渲染主视图 -->
  <template v-else>
    <TitleBar />
    <!-- 后端已就绪，显示主界面 -->
    <div v-if="backendReady" style="flex: 1; overflow: hidden">
      <router-view />
    </div>
    <!-- 后端未就绪，显示加载或错误提示 -->
    <div v-else class="app-loader">
      <h2>📝 Todolist</h2>
      <p v-if="!backendError">
        正在启动服务<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
      </p>
      <p v-else style="color: #f56c6c">后端启动超时，请确认 Java 17+ 已安装并重试</p>
    </div>
  </template>
</template>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 根应用容器：撑满全屏的 flex column 布局 */
#app {
  font-family:
    'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

body {
  margin: 0;
  padding: 0;
}

/* 启动加载页 */
.app-loader {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #606266;
  font-size: 14px;
}

.app-loader h2 {
  margin-bottom: 16px;
  color: #667eea;
}

/* 加载动画点 */
.dot {
  animation: blink 1.4s infinite both;
}
.dot:nth-child(2) {
  animation-delay: 0.2s;
}
.dot:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 0;
  }
  40% {
    opacity: 1;
  }
}
</style>
