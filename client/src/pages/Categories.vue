<template>
  <div class="categories">
    <div class="container">
      <div class="page-header">
        <h1>分类管理</h1>
        <button @click="showAddDialog = true" class="btn btn-primary">添加分类</button>
      </div>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="categories.length === 0" class="empty">暂无分类</div>
      <div v-else class="category-list">
        <div v-for="cat in categories" :key="cat.id" class="category-item">
          <div class="category-info">
            <h3>{{ cat.name }}</h3>
            <span class="slug">{{ cat.slug }}</span>
            <p v-if="cat.description" class="description">{{ cat.description }}</p>
          </div>
          <div class="category-actions">
            <button @click="editCategory(cat)" class="btn btn-secondary">编辑</button>
            <button @click="handleDelete(cat.id)" class="btn btn-danger">删除</button>
          </div>
        </div>
      </div>

      <!-- 添加/编辑弹窗 -->
      <div v-if="showAddDialog || editingCategory" class="dialog-overlay" @click.self="closeDialog">
        <div class="dialog">
          <h2>{{ editingCategory ? '编辑分类' : '添加分类' }}</h2>
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label>名称 *</label>
              <input v-model="form.name" type="text" required />
            </div>
            <div class="form-group">
              <label>标识 *</label>
              <input v-model="form.slug" type="text" required placeholder="如: entertainment" />
            </div>
            <div class="form-group">
              <label>描述</label>
              <textarea v-model="form.description"></textarea>
            </div>
            <div v-if="error" class="error">{{ error }}</div>
            <div class="dialog-actions">
              <button type="button" @click="closeDialog" class="btn btn-secondary">取消</button>
              <button type="submit" class="btn btn-primary">{{ submitting ? '提交中...' : '确定' }}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'

interface Category {
  id: number
  name: string
  slug: string
  description: string
}

const categories = ref<Category[]>([])
const loading = ref(false)
const showAddDialog = ref(false)
const editingCategory = ref<Category | null>(null)
const submitting = ref(false)
const error = ref('')

const form = reactive({
  name: '',
  slug: '',
  description: ''
})

const fetchCategories = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/categories')
    categories.value = res.data.data
  } catch (err: any) {
    console.error('获取分类失败:', err)
  } finally {
    loading.value = false
  }
}

const editCategory = (cat: Category) => {
  editingCategory.value = cat
  form.name = cat.name
  form.slug = cat.slug
  form.description = cat.description
}

const closeDialog = () => {
  showAddDialog.value = false
  editingCategory.value = null
  form.name = ''
  form.slug = ''
  form.description = ''
  error.value = ''
}

const handleSubmit = async () => {
  submitting.value = true
  error.value = ''

  try {
    if (editingCategory.value) {
      await axios.put(`/api/categories/${editingCategory.value.id}`, form)
    } else {
      await axios.post('/api/categories', form)
    }
    await fetchCategories()
    closeDialog()
  } catch (err: any) {
    error.value = err.response?.data?.message || '操作失败'
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('确定要删除该分类吗？')) return

  try {
    await axios.delete(`/api/categories/${id}`)
    await fetchCategories()
  } catch (err: any) {
    alert(err.response?.data?.message || '删除失败')
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.category-info h3 {
  margin: 0 0 0.5rem 0;
}

.slug {
  color: #666;
  font-size: 0.875rem;
  font-family: monospace;
}

.description {
  margin: 0.5rem 0 0 0;
  color: #666;
}

.category-actions {
  display: flex;
  gap: 0.5rem;
}

.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
}

.dialog h2 {
  margin-top: 0;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
}

.error {
  color: var(--danger-color);
  margin-bottom: 1rem;
}

.loading, .empty {
  text-align: center;
  padding: 3rem;
  color: #666;
}
</style>
