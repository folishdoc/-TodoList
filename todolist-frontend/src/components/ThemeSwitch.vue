<template>
  <el-button
    :icon="currentTheme === 'dark' ? Sunny : Moon"
    circle
    @click="handleToggleTheme"
    title="切换主题"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Sunny, Moon } from '@element-plus/icons-vue'
import { getCurrentTheme, toggleTheme } from '../utils/theme'

const currentTheme = ref('light')

onMounted(() => {
  currentTheme.value = getCurrentTheme()
})

const handleToggleTheme = () => {
  toggleTheme()
  currentTheme.value = getCurrentTheme()
}
</script>
