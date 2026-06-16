import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Video } from '../types'
import { videoApi } from '../api'

export const useVideoStore = defineStore('video', () => {
  const videos = ref<Video[]>([])
  const currentVideo = ref<Video | null>(null)
  const loading = ref(false)
  const total = ref(0)
  const page = ref(1)
  const limit = ref(10)
  const search = ref('')
  const tag = ref('')

  async function fetchVideos(options?: { category?: string; search?: string; tag?: string }) {
    loading.value = true
    try {
      const res = await videoApi.getVideos(page.value, limit.value, options?.category, options?.search || search.value, options?.tag || tag.value)
      videos.value = res.data?.items || []
      total.value = res.data?.total || 0
    } finally {
      loading.value = false
    }
  }

  function setTag(newTag: string) {
    tag.value = newTag
    page.value = 1
  }

  async function fetchVideo(id: string) {
    loading.value = true
    try {
      const res = await videoApi.getVideo(id)
      currentVideo.value = res.data || null
    } finally {
      loading.value = false
    }
  }

  async function uploadVideo(data: Parameters<typeof videoApi.uploadVideo>[0]) {
    const res = await videoApi.uploadVideo(data)
    return res
  }

  async function deleteVideo(id: string) {
    await videoApi.deleteVideo(id)
    videos.value = videos.value.filter(v => String(v.id) !== String(id))
  }

  function setPage(newPage: number) {
    page.value = newPage
  }

  function setSearch(newSearch: string) {
    search.value = newSearch
    page.value = 1
  }

  return {
    videos,
    currentVideo,
    loading,
    total,
    page,
    limit,
    search,
    tag,
    fetchVideos,
    fetchVideo,
    uploadVideo,
    deleteVideo,
    setPage,
    setSearch,
    setTag
  }
})
