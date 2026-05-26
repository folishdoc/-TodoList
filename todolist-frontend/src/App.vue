<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TitleBar from './components/TitleBar.vue'

const isTauri = '__TAURI_INTERNALS__' in window
const backendReady = ref(!isTauri)
const backendError = ref(false)

onMounted(async () => {
  if (!isTauri) return
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch('http://localhost:18080/')
      if (r.ok) { backendReady.value = true; return }
    } catch {}
    await new Promise(r => setTimeout(r, 1000))
  }
  backendError.value = true
})
</script>

<template>
  <TitleBar />
  <div v-if="backendReady" style="flex:1;display:flex;overflow:hidden">
    <router-view />
  </div>
  <div v-else class="app-loader">
    <h2>📝 Todolist</h2>
    <p v-if="!backendError">正在启动服务<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></p>
    <p v-else style="color: #f56c6c">后端启动超时，请确认 Java 17+ 已安装并重试</p>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
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

.dot { animation: blink 1.4s infinite both; }
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0%, 80%, 100% { opacity: 0; } 40% { opacity: 1; } }
</style>
