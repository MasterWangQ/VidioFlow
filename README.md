# VidioFlow
## 一、项目概述

VideoFlow 是一个类似B站的视频分享网站，采用 Vue 3 + Node.js + MySQL 技术栈开发。

## 二、现有功能分析

### 2.1 用户认证模块

| 功能 | API端点 | 状态 |
|------|---------|------|
| 用户注册 | `POST /api/auth/register` | ✅ 已实现 |
| 用户登录 | `POST /api/auth/login` | ✅ 已实现 |
| 获取当前用户 | `GET /api/auth/me` | ✅ 已实现 |
| 用户退出 | 前端清除token | ✅ 已实现 |

### 2.2 用户管理模块

| 功能 | API端点 | 状态 |
|------|---------|------|
| 获取用户信息 | `GET /api/users/:id` | ✅ 已实现 |
| 更新用户信息 | `PUT /api/users/:id` | ✅ 已实现 |
| 获取用户视频 | `GET /api/users/:id/videos` | ✅ 已实现 |
| 用户角色系统 | role字段 | ✅ 已实现 |

### 2.3 视频管理模块

| 功能 | API端点 | 状态 |
|------|---------|------|
| 视频上传 | `POST /api/videos` | ✅ 已实现 |
| 视频列表 | `GET /api/videos` | ✅ 已实现 |
| 视频详情 | `GET /api/videos/:id` | ✅ 已实现 |
| 视频更新 | `PUT /api/videos/:id` | ✅ 已实现 |
| 视频删除 | `DELETE /api/videos/:id` | ✅ 已实现 |
| 视频排行榜 | `GET /api/videos/top` | ✅ 已实现 |
| 视频审核 | `PUT /api/videos/:id/approve/reject` | ✅ 已实现 |

### 2.4 评论系统模块

| 功能 | API端点 | 状态 |
|------|---------|------|
| 获取评论 | `GET /api/videos/:videoId/comments` | ✅ 已实现 |
| 添加评论 | `POST /api/videos/:videoId/comments` | ✅ 已实现 |
| 删除评论 | `DELETE /api/comments/:id` | ✅ 已实现 |
| 嵌套回复 | parentId字段 | ✅ 已实现 |

### 2.5 互动功能模块

| 功能 | API端点 | 状态 |
|------|---------|------|
| 点赞 | `POST /api/videos/:id/like` | ✅ 已实现 |
| 取消点赞 | `DELETE /api/videos/:id/like` | ✅ 已实现 |
| 收藏 | `POST /api/videos/:id/favorite` | ✅ 已实现 |
| 取消收藏 | `DELETE /api/videos/:id/favorite` | ✅ 已实现 |
| 订阅 | `POST /api/users/:id/subscribe` | ✅ 已实现 |
| 取消订阅 | `DELETE /api/users/:id/subscribe` | ✅ 已实现 |

### 2.6 弹幕系统模块

| 功能 | API端点 | 状态 |
|------|---------|------|
| 获取弹幕 | `GET /api/videos/:videoId/danmaku` | ✅ 已实现 |
| 发送弹幕 | `POST /api/videos/:videoId/danmaku` | ✅ 已实现 |
| 删除弹幕 | `DELETE /api/danmaku/: id` | ✅ 已实现 |

### 2.7 观看历史模块

| 功能 | API端点 | 状态 |
|------|---------|------|
| 获取观看历史 | `GET /api/watch-history` | ✅ 已实现 |
| 添加观看记录 | `POST /api/watch-history` | ✅ 已实现 |
| 删除观看记录 | `DELETE /api/watch-history/:id` | ✅ 已实现 |
| 清空观看历史 | `DELETE /api/watch-history` | ✅ 已实现 |
| 播放进度记忆 | progress字段 | ✅ 已实现 |

### 2.8 消息通知模块

| 功能 | API端点 | 状态 |
|------|---------|------|
| 获取通知列表 | `GET /api/notifications` | ✅ 已实现 |
| 获取未读数量 | `GET /api/notifications/unread-count` | ✅ 已实现 |
| 标记已读 | `PUT /api/notifications/read/:id` | ✅ 已实现 |
| 删除通知 | `DELETE /api/notifications/:id` | ✅ 已实现 |

### 2.9 分类与标签模块

| 功能 | API端点 | 状态 |
|------|---------|------|
| 获取分类列表 | `GET /api/categories` | ✅ 已实现 |
| 获取标签列表 | `GET /api/videos/tags/list` | ✅ 已实现 |

## 三、前端页面列表

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `/` | 视频列表、轮播图 |
| 视频列表 | `/videos` | 分类筛选、搜索 |
| 排行榜 | `/ranking` | 综合/点赞/最新排行 |
| 视频详情 | `/video/:id` | 播放、评论、弹幕 |
| 上传页面 | `/upload` | 视频上传（需登录） |
| 登录页面 | `/login` | 用户登录 |
| 注册页面 | `/register` | 用户注册 |
| 设置页面 | `/settings` | 用户设置（需登录） |
| 分类页面 | `/categories` | 分类管理（需登录） |
| 观看历史 | `/history` | 观看记录（需登录） |
| 管理后台 | `/admin` | 视频审核（管理员） |
| 用户主页 | `/user/:id` | 用户视频/收藏/订阅 |

## 四、数据库模型

### 4.1 用户表 (users)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| username | VARCHAR | 用户名 |
| email | VARCHAR | 邮箱 |
| password | VARCHAR | 密码（加密） |
| nickname | VARCHAR | 昵称 |
| avatar | VARCHAR | 头像 |
| description | VARCHAR | 简介 |
| role | VARCHAR | 角色(user/admin) |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

### 4.2 视频表 (videos)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| title | VARCHAR | 标题 |
| description | VARCHAR | 描述 |
| url | VARCHAR | 视频地址 |
| cover | VARCHAR | 封面图 |
| duration | INT | 时长（秒） |
| userId | INT | 作者ID |
| category | VARCHAR | 分类 |
| tags | JSON | 标签数组 |
| viewCount | INT | 播放量 |
| likeCount | INT | 点赞数 |
| status | INT | 状态(-1拒绝/0待审核/1通过) |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

### 4.3 评论表 (comments)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| content | VARCHAR | 内容 |
| userId | INT | 用户ID |
| videoId | INT | 视频ID |
| parentId | INT | 父评论ID |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

### 4.4 点赞表 (likes)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| userId | INT | 用户ID |
| videoId | INT | 视频ID |
| createdAt | DATETIME | 创建时间 |

### 4.5 收藏表 (favorites)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| userId | INT | 用户ID |
| videoId | INT | 视频ID |
| createdAt | DATETIME | 创建时间 |

### 4.6 订阅表 (subscriptions)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| subscriberId | INT | 订阅者ID |
| creatorId | INT | 创作者ID |
| createdAt | DATETIME | 创建时间 |

### 4.7 观看历史表 (watch_history)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| userId | INT | 用户ID |
| videoId | INT | 视频ID |
| progress | INT | 播放进度（秒） |
| watchedAt | DATETIME | 观看时间 |

### 4.8 弹幕表 (danmaku)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| videoId | INT | 视频ID |
| userId | INT | 用户ID |
| content | VARCHAR | 弹幕内容 |
| time | FLOAT | 时间点（秒） |
| color | VARCHAR | 颜色 |
| type | INT | 类型 |
| createdAt | DATETIME | 创建时间 |

### 4.9 通知表 (notifications)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键 |
| userId | INT | 用户ID |
| type | VARCHAR | 通知类型 |
| content | TEXT | 通知内容 |
| link | VARCHAR | 跳转链接 |
| read | BOOLEAN | 是否已读 |
| createdAt | DATETIME | 创建时间 |

## 五、默认管理员账户

| 字段 | 值 |
|------|------|
| 邮箱 | admin@admin.com |
| 密码 | 123456 |
| 用户名 | admin |
| 昵称 | 管理员 |

## 六、功能流程图

### 视频上传审核流程
```
用户上传视频 → 状态设为待审核(0) → 审核员查看 → 通过(1)或拒绝(-1) → 视频对其他用户可见
```

### 用户登录流程
```
登录 → 判断角色 → 管理员跳转到/admin → 普通用户跳转到/
```

### 播放进度记忆流程
```
进入视频页面 → 读取观看历史 → 设置播放位置 → 每5秒保存进度
```

## 七、技术栈

- **前端**：Vue 3 + TypeScript + Vite
- **后端**：Node.js + Express + TypeScript
- **数据库**：MySQL + Sequelize ORM
- **状态管理**：Pinia
- **路由**：Vue Router
- **HTTP客户端**：Axios

## 八、待优化建议

### 8.1 高优先级
- [ ] 弹幕实时推送（WebSocket）
- [ ] 视频转码处理
- [ ] 图片压缩优化

### 8.2 中优先级
- [ ] 用户等级系统
- [ ] 积分系统
- [ ] 私信功能

### 8.3 低优先级
- [ ] 移动端适配
- [ ] 深色模式
- [ ] 国际化支持