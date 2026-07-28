<!--
/**
 * Login.vue — 登录/注册页面
 *
 * 提供用户名密码登录和注册功能（单用户模式亦保留此界面）。
 * 登录成功后跳转到 Dashboard（/）。
 * 支持两种模式切换：登录 ↔ 注册。
 * 表单校验：用户名非空、密码非空、注册时密码≥6位且两次一致。
 */
-->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const isRegisterMode = ref(false)
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const displayName = ref('')
const loading = ref(false)
const errorMsg = ref('')

function toggleMode() {
  isRegisterMode.value = !isRegisterMode.value
  errorMsg.value = ''
  confirmPassword.value = ''
}

async function handleSubmit() {
  errorMsg.value = ''

  if (!username.value.trim()) {
    errorMsg.value = '请输入用户名'
    return
  }
  if (!password.value) {
    errorMsg.value = '请输入密码'
    return
  }
  if (isRegisterMode.value) {
    if (password.value.length < 6) {
      errorMsg.value = '密码长度不能少于 6 位'
      return
    }
    if (password.value !== confirmPassword.value) {
      errorMsg.value = '两次输入的密码不一致'
      return
    }
  }

  loading.value = true
  try {
    if (isRegisterMode.value) {
      await authStore.register(
        username.value.trim(),
        password.value,
        displayName.value.trim() || undefined,
      )
      ElMessage.success('注册成功')
    } else {
      await authStore.login(username.value.trim(), password.value)
      ElMessage.success('登录成功')
    }
    router.push('/')
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.message || e?.message || '操作失败，请重试'
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">📝 Todolist</h1>
        <p class="login-subtitle">个人待办管理系统</p>
      </div>

      <!-- 用户名密码表单 -->
      <el-form class="login-form" @submit.prevent="handleSubmit">
        <el-form-item label="用户名">
          <el-input
            v-model="username"
            placeholder="请输入用户名"
            size="large"
            :disabled="loading"
            clearable
            @keyup.enter="handleSubmit"
          />
        </el-form-item>

        <el-form-item label="密码">
          <el-input
            v-model="password"
            type="password"
            show-password
            placeholder="请输入密码"
            size="large"
            :disabled="loading"
            clearable
            @keyup.enter="handleSubmit"
          />
        </el-form-item>

        <el-form-item v-if="isRegisterMode" label="确认密码">
          <el-input
            v-model="confirmPassword"
            type="password"
            show-password
            placeholder="再次输入密码"
            size="large"
            :disabled="loading"
            clearable
            @keyup.enter="handleSubmit"
          />
        </el-form-item>

        <el-form-item v-if="isRegisterMode" label="显示名称（可选）">
          <el-input
            v-model="displayName"
            placeholder="留空则使用用户名"
            size="large"
            :disabled="loading"
            clearable
            @keyup.enter="handleSubmit"
          />
        </el-form-item>

        <transition name="fade">
          <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p>
        </transition>

        <el-button
          type="primary"
          size="large"
          class="submit-button"
          :loading="loading"
          @click="handleSubmit"
        >
          {{ isRegisterMode ? '注册' : '登录' }}
        </el-button>
      </el-form>

      <!-- 切换登录/注册 -->
      <div class="switch-mode">
        <el-button text type="primary" @click="toggleMode">
          {{ isRegisterMode ? '已有账号？去登录' : '没有账号？去注册' }}
        </el-button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--el-bg-color-page, #f5f7fa);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--el-bg-color, #ffffff);
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08);
  padding: 48px 40px 40px;
  transition: box-shadow 0.3s, background-color 0.3s;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: #667eea;
  margin: 0 0 8px;
  letter-spacing: -0.3px;
}

.login-subtitle {
  font-size: 14px;
  color: var(--el-text-color-secondary, #909399);
  margin: 0;
}

.login-form {
  max-width: 100%;
}

.login-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--el-text-color-primary, #303133);
  padding-bottom: 6px;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 10px;
  padding: 4px 16px;
}

.login-form :deep(.el-input__inner) {
  height: 44px;
  font-size: 15px;
}

.submit-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 10px;
  margin-top: 8px;
  letter-spacing: 0.5px;
}

.error-message {
  color: #f56c6c;
  font-size: 13px;
  margin: -8px 0 16px;
  padding: 0 2px;
  line-height: 1.4;
}

.switch-mode {
  text-align: center;
  margin-top: 16px;
}

/* Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive */
@media (max-width: 480px) {
  .login-card {
    padding: 36px 24px 32px;
    border-radius: 12px;
  }

  .login-title {
    font-size: 24px;
  }
}
</style>
