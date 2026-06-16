import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '../types'
import { authApi } from '../api'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isLoggedIn = computed(() => !!token.value)

  async function login(email: string, password: string) {
    const res = await authApi.login({ email, password })
    token.value = res.data!.token
    user.value = res.data!.user
    localStorage.setItem('token', res.data!.token)
    return res
  }

  async function register(username: string, email: string, password: string) {
    const res = await authApi.register({ username, email, password })
    token.value = res.data!.token
    user.value = res.data!.user
    localStorage.setItem('token', res.data!.token)
    return res
  }

  async function fetchCurrentUser() {
    if (!token.value) return
    try {
      const res = await authApi.getMe()
      user.value = res.data!
    } catch {
      logout()
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
  }

  return {
    user,
    token,
    isLoggedIn,
    login,
    register,
    fetchCurrentUser,
    logout
  }
})
