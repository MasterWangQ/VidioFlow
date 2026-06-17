<template>
  <div v-if="visible" class="report-modal-overlay" @click="handleClose">
    <div class="report-modal" @click.stop>
      <div class="modal-header">
        <h3>举报{{ targetTypeName }}</h3>
        <button @click="handleClose" class="close-btn">×</button>
      </div>
      <div class="modal-body">
        <div class="report-form">
          <div class="form-group">
            <label>举报原因</label>
            <select v-model="form.reason" class="form-control">
              <option value="">请选择举报原因</option>
              <option value="spam">垃圾信息</option>
              <option value="hate">恶意/仇恨言论</option>
              <option value="porn">色情内容</option>
              <option value="violence">暴力内容</option>
              <option value="copyright">版权侵权</option>
              <option value="other">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label>详细描述</label>
            <textarea 
              v-model="form.description" 
              placeholder="请详细描述举报原因（选填）"
              class="form-control"
              rows="4"
            ></textarea>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.confirm" />
              我确认该内容违反了社区规范
            </label>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button @click="handleClose" class="btn btn-secondary">取消</button>
        <button @click="handleSubmit" class="btn btn-danger" :disabled="!form.reason || !form.confirm">
          提交举报
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { reportApi } from '../api'
import { useUserStore } from '../stores/user'

interface Props {
  visible: boolean
  targetId: number
  targetType: 'video' | 'comment'
}

const props = defineProps<Props>()
const emit = defineEmits(['close', 'success'])

const userStore = useUserStore()

const form = reactive({
  reason: '',
  description: '',
  confirm: false
})

const targetTypeName = computed(() => props.targetType === 'video' ? '视频' : '评论')

const handleClose = () => {
  form.reason = ''
  form.description = ''
  form.confirm = false
  emit('close')
}

const handleSubmit = async () => {
  if (!userStore.isLoggedIn) {
    alert('请先登录')
    return
  }

  if (!form.reason) {
    alert('请选择举报原因')
    return
  }

  if (!form.confirm) {
    alert('请确认该内容违反社区规范')
    return
  }

  try {
    const reason = form.description ? `${form.reason}: ${form.description}` : form.reason
    await reportApi.createReport(props.targetId, props.targetType, reason)
    alert('举报成功，管理员将尽快审核')
    handleClose()
    emit('success')
  } catch (error: any) {
    alert(error.message || '举报失败')
  }
}
</script>

<style scoped>
.report-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.report-modal {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 480px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
  background: linear-gradient(135deg, #ff6b6b, #fa5252);
  color: #fff;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
}

.close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 1.5rem;
}

.report-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.form-control {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #ff6b6b;
}

.form-control:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
  color: #666;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  background: #f8f9fa;
}

.btn {
  padding: 0.5rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-secondary {
  background: #e9ecef;
  color: #495057;
}

.btn-secondary:hover {
  background: #dee2e6;
}

.btn-danger {
  background: #ff6b6b;
  color: #fff;
}

.btn-danger:hover:not(:disabled) {
  background: #fa5252;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>