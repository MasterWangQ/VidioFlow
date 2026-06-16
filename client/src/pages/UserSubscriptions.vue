<template>
  <div class="user-subscriptions">
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="subscriptions.length === 0" class="empty">暂无订阅</div>
    <div v-else class="user-list">
      <router-link
        v-for="item in subscriptions"
        :key="item.id"
        :to="`/user/${item.creator?.id}`"
        class="user-item"
      >
        <img :src="item.creator?.avatar || '/default-avatar.png'" class="avatar" />
        <div class="info">
          <p class="name">{{ item.creator?.nickname || item.creator?.username }}</p>
          <p class="username">@{{ item.creator?.username }}</p>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api'
import type { Subscription } from '../types'

const route = useRoute()
const subscriptions = ref<Subscription[]>([])
const loading = ref(false)

const fetchSubscriptions = async () => {
  loading.value = true
  try {
    const res = await api.get<any, any>(`/users/${route.params.id}/subscriptions`)
    subscriptions.value = res.data?.items || []
  } finally {
    loading.value = false
  }
}

onMounted(fetchSubscriptions)
watch(() => route.params.id, fetchSubscriptions)
</script>

<style scoped>
.user-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: background 0.2s;
}

.user-item:hover {
  background: #eee;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.username {
  color: #666;
  font-size: 0.875rem;
}

.loading, .empty {
  text-align: center;
  padding: 3rem;
  color: #666;
}
</style>
