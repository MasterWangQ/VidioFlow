<template>
  <div id="app">
    <header class="header">
      <div class="header-content">
        <div class="header-left" v-if="$route.path !== '/admin'">
          <router-link to="/" class="logo">
            <span class="logo-icon">✦</span>
            <span class="logo-text">VideoFlow</span>
          </router-link>
          <nav class="nav-primary">
            <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
              <span class="nav-icon">🏠</span>
              <span>首页</span>
            </router-link>
            <router-link to="/videos" class="nav-item" :class="{ active: $route.path === '/videos' }">
              <span class="nav-icon">📹</span>
              <span>视频</span>
            </router-link>
            <router-link to="/ranking" class="nav-item" :class="{ active: $route.path === '/ranking' }">
              <span class="nav-icon">🏆</span>
              <span>排行榜</span>
            </router-link>
          </nav>
        </div>
        
        <div class="header-center" v-if="$route.path !== '/admin'">
          <div class="search-box">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="搜索视频、UP主、话题..." 
              class="search-input"
              @keyup.enter="handleSearch"
            />
            <button @click="handleSearch" class="search-btn">
              🔍
            </button>
          </div>
        </div>
        
        <div class="header-right">
          <template v-if="userStore.isLoggedIn && userStore.user">
            <router-link to="/upload" class="upload-btn" v-if="$route.path !== '/admin'">
              <span class="upload-icon">📤</span>
              <span>投稿</span>
            </router-link>
            <router-link to="/history" class="nav-item" v-if="$route.path !== '/admin'">
              <span class="nav-icon">📜</span>
              <span>历史</span>
            </router-link>
            <router-link :to="`/user/${userStore.user.id}`" class="user-avatar" v-if="$route.path !== '/admin'">
              <div class="avatar-wrapper">
                <span class="avatar-text">{{ userStore.user.nickname?.charAt(0) || userStore.user.username?.charAt(0) || 'U' }}</span>
              </div>
            </router-link>
            <button @click="handleLogout" class="logout-btn">
              <span>退出</span>
            </button>
          </template>
          <template v-else>
            <router-link to="/login" class="login-btn">登录</router-link>
            <router-link to="/register" class="register-btn">注册</router-link>
          </template>
        </div>
      </div>
    </header>
    
    <main class="main">
      <router-view />
    </main>
    
    <footer class="footer">
      <div class="footer-content">
        <div class="footer-section">
          <h4 class="footer-title">关于我们</h4>
          <ul class="footer-links">
            <li><a href="#">联系我们</a></li>
            <li><a href="#">加入我们</a></li>
            <li><a href="#">用户协议</a></li>
            <li><a href="#">隐私政策</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4 class="footer-title">帮助中心</h4>
          <ul class="footer-links">
            <li><a href="#">常见问题</a></li>
            <li><a href="#">反馈建议</a></li>
            <li><a href="#">举报中心</a></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4 class="footer-title">关注我们</h4>
          <div class="social-links">
            <span class="social-icon">📱</span>
            <span class="social-icon">🐦</span>
            <span class="social-icon">📧</span>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2024 VideoFlow. All rights reserved.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from './stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()
const searchQuery = ref('')

onMounted(() => {
  userStore.fetchCurrentUser()
})

const handleLogout = () => {
  userStore.logout()
  router.push('/')
}

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ path: '/videos', query: { search: searchQuery.value } })
  }
}
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, #0d0d0d 0%, #1a1a2e 100%);
  color: #fff;
  padding: 0.75rem 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #fff;
  text-decoration: none;
  transition: all 0.3s ease;
}

.logo:hover {
  transform: scale(1.02);
}

.logo-icon {
  font-size: 1.75rem;
  background: linear-gradient(135deg, #ff6b6b, #ff8787);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.nav-primary {
  display: flex;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  color: #fff;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-size: 0.9375rem;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active {
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
}

.nav-icon {
  font-size: 1rem;
}

.header-center {
  flex: 1;
  max-width: 400px;
  margin: 0 2rem;
}

.search-box {
  display: flex;
  background: #2d2d2d;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid #3d3d3d;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
}

.search-box:focus-within {
  border-color: #ff6b6b;
  box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
}

.search-input {
  flex: 1;
  padding: 0.625rem 1rem;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 0.875rem;
  outline: none;
}

.search-input::placeholder {
  color: #888;
}

.search-btn {
  padding: 0.625rem 1.25rem;
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.search-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1.25rem;
  background: linear-gradient(135deg, #ff6b6b, #fa5252);
  color: #fff;
  text-decoration: none;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
}

.upload-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
}

.upload-icon {
  font-size: 0.875rem;
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b6b, #ff8787);
  overflow: hidden;
  transition: all 0.2s ease;
}

.user-avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
}

.avatar-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  color: #fff;
  font-weight: 600;
  font-size: 0.875rem;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.login-btn {
  padding: 0.5rem 1.25rem;
  background: transparent;
  color: #fff;
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.login-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.register-btn {
  padding: 0.5rem 1.25rem;
  background: linear-gradient(135deg, #ff6b6b, #fa5252);
  color: #fff;
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.register-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
}

.main {
  min-height: calc(100vh - 140px);
  padding: 1.5rem 0;
}

.footer {
  background: #1a1a1a;
  color: #888;
  padding: 2rem 0;
  margin-top: auto;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  justify-content: space-around;
}

.footer-section {
  flex: 1;
  max-width: 200px;
}

.footer-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 1rem;
}

.footer-links {
  list-style: none;
  padding: 0;
}

.footer-links li {
  margin-bottom: 0.5rem;
}

.footer-links a {
  color: #888;
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s ease;
}

.footer-links a:hover {
  color: #ff6b6b;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-icon {
  font-size: 1.25rem;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.social-icon:hover {
  transform: scale(1.2);
}

.footer-bottom {
  text-align: center;
  padding-top: 1.5rem;
  margin-top: 1.5rem;
  border-top: 1px solid #2d2d2d;
  font-size: 0.8125rem;
}
</style>
