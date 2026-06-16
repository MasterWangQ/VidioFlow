import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/Home.vue')
  },
  {
    path: '/videos',
    name: 'Videos',
    component: () => import('../pages/VideoList.vue')
  },
  {
    path: '/ranking',
    name: 'Ranking',
    component: () => import('../pages/VideoRanking.vue')
  },
  {
    path: '/video/:id',
    name: 'VideoDetail',
    component: () => import('../pages/VideoDetail.vue')
  },
  {
    path: '/upload',
    name: 'Upload',
    component: () => import('../pages/Upload.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/Login.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../pages/Register.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../pages/Settings.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/categories',
    name: 'Categories',
    component: () => import('../pages/Categories.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/history',
    name: 'WatchHistory',
    component: () => import('../pages/WatchHistory.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../pages/Admin.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/user/:id',
    name: 'UserProfile',
    component: () => import('../pages/UserProfile.vue'),
    children: [
      {
        path: '',
        name: 'UserVideos',
        component: () => import('../pages/UserVideos.vue')
      },
      {
        path: 'favorites',
        name: 'UserFavorites',
        component: () => import('../pages/UserFavorites.vue')
      },
      {
        path: 'subscriptions',
        name: 'UserSubscriptions',
        component: () => import('../pages/UserSubscriptions.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole')
  
  if (to.meta.requiresAuth && !token) {
    next('/login')
    return
  }
  
  if (userRole === 'admin') {
    if (to.path === '/admin') {
      next()
    } else if (to.path === '/login' || to.path === '/register') {
      next()
    } else {
      next('/admin')
    }
    return
  }
  
  next()
})

export default router
