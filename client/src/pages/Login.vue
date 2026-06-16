<template>
  <div class="login">
    <div class="container">
      <div class="form-wrapper">
        <h1 class="page-title">登录</h1>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>邮箱</label>
            <input v-model="form.email" type="email" required />
          </div>
          <div class="form-group">
            <label>密码</label>
            <input v-model="form.password" type="password" required />
          </div>
          <div v-if="error" class="error">{{ error }}</div>
          <button type="submit" class="btn btn-primary btn-block">登录</button>
        </form>
        <p class="tip">
          还没有账号？ <router-link to="/register">立即注册</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  email: '',
  password: ''
})

const error = ref('')

const handleSubmit = async () => {
  error.value = ''
  try {
    const res = await userStore.login(form.email, form.password)
    const userRole = (res.data?.user as any)?.role || 'user'
    localStorage.setItem('userRole', userRole)
    if (userRole === 'admin') {
      router.push('/admin')
    } else {
      router.push('/')
    }
  } catch (e: any) {
    error.value = e.message || '登录失败'
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
