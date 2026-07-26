<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isTauri = () => '__TAURI_INTERNALS__' in window
const isMaximized = ref(false)
let appWindow: any = null
let unlisten: (() => void) | null = null

onMounted(async () => {
  document.documentElement.style.setProperty('--titlebar-height', isTauri() ? '32px' : '0px')

  if (!isTauri()) return

  try {
    const { getCurrentWindow } = await import('@tauri-apps/api/window')
    appWindow = getCurrentWindow()
    isMaximized.value = await appWindow.isMaximized()

    unlisten = await appWindow.onResized(async () => {
      try {
        isMaximized.value = await appWindow.isMaximized()
      } catch (e) { /* 窗口可能已关闭 */ console.warn('窗口状态检查失败', e) }
    })
  } catch (e) {
    console.error('TitleBar: Tauri 窗口 API 加载失败', e)
  }
})

onUnmounted(() => {
  if (unlisten) {
    unlisten()
    unlisten = null
  }
})

async function handleMinimize() {
  try {
    await appWindow?.minimize()
  } catch (e) { console.error('窗口最小化失败', e) }
}

async function handleToggleMaximize() {
  try {
    await appWindow?.toggleMaximize()
  } catch (e) { console.error('窗口最大化切换失败', e) }
}

async function handleClose() {
  try {
    await appWindow?.close()
  } catch (e) { console.error('窗口关闭失败', e) }
}
</script>

<template>
  <div v-if="isTauri()" class="titlebar" data-tauri-drag-region>
    <div class="titlebar-title">
      <span class="titlebar-icon">📝</span>
      <span class="titlebar-text">Todolist</span>
    </div>
    <div class="titlebar-controls">
      <button class="ctrl-btn" @click="handleMinimize" title="最小化">
        <svg width="10" height="10" viewBox="0 0 10 10">
          <rect y="4" width="10" height="1.2" fill="currentColor" />
        </svg>
      </button>
      <button
        class="ctrl-btn"
        @click="handleToggleMaximize"
        :title="isMaximized ? '还原' : '最大化'"
      >
        <svg v-if="isMaximized" width="10" height="10" viewBox="0 0 10 10">
          <rect
            x="2"
            y="0"
            width="8"
            height="8"
            rx="0.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.2"
          />
          <rect
            x="0"
            y="2"
            width="8"
            height="8"
            rx="0.5"
            fill="#1a1a2e"
            stroke="currentColor"
            stroke-width="1.2"
          />
        </svg>
        <svg v-else width="10" height="10" viewBox="0 0 10 10">
          <rect
            x="0.5"
            y="0.5"
            width="9"
            height="9"
            rx="0.5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.2"
          />
        </svg>
      </button>
      <button class="ctrl-btn close-btn" @click="handleClose" title="关闭">
        <svg width="10" height="10" viewBox="0 0 10 10">
          <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" stroke-width="1.3" />
          <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" stroke-width="1.3" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.titlebar {
  height: 32px;
  background: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  user-select: none;
  position: relative;
  z-index: 9999;
}

.titlebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 14px;
  color: #e0e0e0;
  font-size: 13px;
  pointer-events: none;
}

.titlebar-icon {
  font-size: 14px;
}

.titlebar-text {
  font-weight: 500;
  letter-spacing: 0.5px;
}

.titlebar-controls {
  display: flex;
  height: 100%;
  -webkit-app-region: no-drag;
}

.ctrl-btn {
  width: 46px;
  height: 100%;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.ctrl-btn.close-btn:hover {
  background: #e81123;
  color: #fff;
}
</style>
