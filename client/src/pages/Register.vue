<template>
  <div class="register">
    <div class="container">
      <div class="form-wrapper">
        <h1 class="page-title">注册</h1>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>用户名</label>
            <input v-model="form.username" type="text" required />
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="form.email" type="email" required />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input v-model="form.password" type="password" required />
          </div>
          <div class="form-group">
            <label>确认密码</label>
            <input v-model="form.confirmPassword" type="password" required />
          </div>
          <div v-if="error" class="error">{{ error }}</div>
          <button type="submit" class="btn btn-primary btn-block">注册</button>
        </form>
        <p class="tip">
          已有账号？ <router-link to="/login">立即登录</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useNotificationStore } from '../stores/notification'

const router = useRouter()
const userStore = useUserStore()
const notificationStore = useNotificationStore()

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const error = ref('')

const handleSubmit = async () => {
  error.value = ''

  if (form.password !== form.confirmPassword) {
    error.value = '两次密码输入不一致'
    return
  }

  if (form.password.length < 6) {
    error.value = '密码长度至少6位'
    return
  }

  try {
    await userStore.register(form.username, form.email, form.password)
    
    notificationStore.reset()
    await notificationStore.fetchUnreadCount()
    await notificationStore.fetchNotifications()
    
    router.push('/')
  } catch (e: any) {
    error.value = e.message || '注册失败'
  }
}
</script>

<style scoped>
.form-wrapper {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.btn-block {
  width: 100%;
}

.error {
  color: var(--danger-color);
  margin-bottom: 1rem;
}

.tip {
  text-align: center;
  margin-top: 1rem;
  color: #666;
}
</style>
