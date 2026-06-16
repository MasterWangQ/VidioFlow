<template>
  <div class="settings">
    <div class="container">
      <h1 class="page-title">设置</h1>
      <div class="form-wrapper">
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>头像</label>
            <div class="avatar-upload">
              <img :src="avatarPreview || '/default-avatar.png'" class="avatar-preview" />
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                @change="handleAvatarChange"
                ref="avatarInputRef"
                class="avatar-input"
              />
              <button type="button" @click="triggerAvatarUpload" class="btn btn-secondary btn-sm">
                选择图片
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>昵称</label>
            <input v-model="nickname" type="text" />
          </div>
          <div class="form-group">
            <label>个人简介</label>
            <textarea v-model="description" rows="4"></textarea>
          </div>
          <div v-if="success" class="success">{{ success }}</div>
          <div v-if="error" class="error">{{ error }}</div>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? '保存中...' : '保存' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { userApi, uploadApi } from '../api'

const router = useRouter()
const userStore = useUserStore()

const nickname = ref('')
const description = ref('')
const avatarPreview = ref('')
const avatarUrl = ref('')
const avatarFile = ref<File | null>(null)
const avatarInputRef = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const success = ref('')
const error = ref('')

onMounted(() => {
  if (userStore.user) {
    nickname.value = userStore.user.nickname || ''
    description.value = userStore.user.description || ''
    avatarPreview.value = userStore.user.avatar || ''
    avatarUrl.value = userStore.user.avatar || ''
  }
})

const triggerAvatarUpload = () => {
  avatarInputRef.value?.click()
}

const handleAvatarChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
  error.value = ''
}

const handleSubmit = async () => {
  if (!userStore.user?.id) return

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    if (avatarFile.value) {
      const res = await uploadApi.uploadCover(avatarFile.value)
      avatarUrl.value = res.data!.url
    }

    await userApi.updateUser(userStore.user.id.toString(), {
      nickname: nickname.value,
      description: description.value
    })

    if (avatarUrl.value) {
      await userApi.updateAvatar(userStore.user.id.toString(), avatarUrl.value)
    }

    await userStore.fetchCurrentUser()
    success.value = '保存成功'

    setTimeout(() => {
      router.push(`/user/${userStore.user?.id}`)
    }, 1000)
  } catch (e: any) {
    error.value = e.message || '保存失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-wrapper {
  max-width: 600px;
}

.avatar-upload {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-input {
  display: none;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

textarea {
  resize: vertical;
}

.success {
  color: var(--secondary-color);
  margin-bottom: 1rem;
}

.error {
  color: var(--danger-color);
  margin-bottom: 1rem;
}
</style>
