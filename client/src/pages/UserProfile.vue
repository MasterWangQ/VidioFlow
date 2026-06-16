<template>
  <div class="user-profile">
    <div class="container">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="!user" class="empty">用户不存在</div>
      <div v-else class="profile">
        <div class="profile-header">
          <img :src="user.avatar || '/default-avatar.png'" class="avatar" />
          <div class="info">
            <h1 class="name">{{ user.nickname || user.username }}</h1>
            <p class="username">@{{ user.username }}</p>
            <p v-if="user.description" class="description">{{ user.description }}</p>
            <p class="meta">注册于 {{ formatDate(user.createdAt) }}</p>
            <div class="stats">
              <span>{{ user.videoCount || 0 }} 视频</span>
              <span>{{ user.subscriberCount || 0 }} 粉丝</span>
            </div>
          </div>
          <div class="actions" v-if="isOwnProfile">
            <router-link to="/settings" class="btn btn-secondary">编辑资料</router-link>
          </div>
          <div class="actions" v-else-if="userStore.isLoggedIn">
            <button @click="handleSubscribe" :class="['btn', isSubscribed ? 'btn-secondary' : 'btn-primary']">
              {{ isSubscribed ? '已订阅' : '订阅' }}
            </button>
          </div>
        </div>
        <div class="profile-tabs">
          <router-link :to="`/user/${userId}`" exact>视频</router-link>
          <router-link :to="`/user/${userId}/favorites`">收藏</router-link>
          <router-link :to="`/user/${userId}/subscriptions`">订阅</router-link>
        </div>
        <div class="profile-content">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { userApi, interactionApi } from '../api'
import { useUserStore } from '../stores/user'
import type { User } from '../types'

const route = useRoute()
const userStore = useUserStore()

const user = ref<User | null>(null)
const loading = ref(false)
const isSubscribed = ref(false)

const userId = computed(() => route.params.id as string)
const isOwnProfile = computed(() => userStore.user?.id === Number(userId.value))

onMounted(() => {
  fetchUser()
})

watch(() => route.params.id, () => {
  fetchUser()
})

const fetchUser = async () => {
  loading.value = true
  try {
    const res = await userApi.getUser(userId.value)
    user.value = res.data || null
  } finally {
    loading.value = false
  }
}

const handleSubscribe = async () => {
  if (!userStore.isLoggedIn) return
  if (isSubscribed.value) {
    await interactionApi.unsubscribe(userId.value)
  } else {
    await interactionApi.subscribe(userId.value)
  }
  isSubscribed.value = !isSubscribed.value
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.profile-header {
  display: flex;
  gap: 1.5rem;
  padding: 2rem;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 2rem;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
}

.info {
  flex: 1;
}

.name {
  font-size: 1.5rem;
  margin-bottom: 0.25rem;
}

.username {
  color: #666;
  margin-bottom: 0.5rem;
}

.description {
  margin: 0.5rem 0;
}

.meta {
  color: #999;
  font-size: 0.875rem;
}

.stats {
  display: flex;
  gap: 1.5rem;
  margin-top: 0.75rem;
}

.stats span {
  color: #666;
  font-size: 0.875rem;
}

.actions {
  display: flex;
  align-items: flex-start;
}

.profile-tabs {
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1.5rem;
}

.profile-tabs a {
  padding: 0.75rem 1rem;
  color: #666;
  text-decoration: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.profile-tabs a.router-link-active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.loading, .empty {
  text-align: center;
  padding: 3rem;
}
</style>
