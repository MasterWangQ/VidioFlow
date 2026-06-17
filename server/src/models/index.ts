import { User } from './User.js'
import { Video } from './Video.js'
import { Comment } from './Comment.js'
import { Like } from './Like.js'
import { Favorite } from './Favorite.js'
import { Subscription } from './Subscription.js'
import { Category } from './category.js'
import { WatchHistory } from './WatchHistory.js'
import { Danmaku } from './Danmaku.js'
import { Notification } from './Notification.js'
import { Report } from './Report.js'

User.hasMany(Video, { foreignKey: 'userId', as: 'videos' })
Video.belongsTo(User, { foreignKey: 'userId', as: 'user' })

User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' })
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' })

Video.hasMany(Comment, { foreignKey: 'videoId', as: 'comments' })
Comment.belongsTo(Video, { foreignKey: 'videoId', as: 'video' })

Video.hasMany(Like, { foreignKey: 'videoId', as: 'likes' })
Like.belongsTo(Video, { foreignKey: 'videoId', as: 'video' })

Video.hasMany(Favorite, { foreignKey: 'videoId', as: 'favorites' })
Favorite.belongsTo(Video, { foreignKey: 'videoId', as: 'video' })

User.hasMany(Like, { foreignKey: 'userId', as: 'likes' })
Like.belongsTo(User, { foreignKey: 'userId', as: 'user' })

User.hasMany(Favorite, { foreignKey: 'userId', as: 'favorites' })
Favorite.belongsTo(User, { foreignKey: 'userId', as: 'user' })

User.hasMany(Subscription, { foreignKey: 'subscriberId', as: 'subscriptions' })
Subscription.belongsTo(User, { foreignKey: 'subscriberId', as: 'subscriber' })

User.hasMany(Subscription, { foreignKey: 'creatorId', as: 'subscribers' })
Subscription.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' })

// 播放记录关联
User.hasMany(WatchHistory, { foreignKey: 'userId', as: 'watchHistory' })
WatchHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' })

Video.hasMany(WatchHistory, { foreignKey: 'videoId', as: 'watchHistory' })
WatchHistory.belongsTo(Video, { foreignKey: 'videoId', as: 'video' })

// 弹幕关联
User.hasMany(Danmaku, { foreignKey: 'userId', as: 'danmaku' })
Danmaku.belongsTo(User, { foreignKey: 'userId', as: 'user' })

Video.hasMany(Danmaku, { foreignKey: 'videoId', as: 'danmaku' })
Danmaku.belongsTo(Video, { foreignKey: 'videoId', as: 'video' })

// 通知关联
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' })
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' })

// 举报关联
User.hasMany(Report, { foreignKey: 'reporterId', as: 'reports' })
Report.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' })

User.hasMany(Report, { foreignKey: 'targetUserId', as: 'reported' })
Report.belongsTo(User, { foreignKey: 'targetUserId', as: 'targetUser' })

export { User, Video, Comment, Like, Favorite, Subscription, Category, WatchHistory, Danmaku, Notification, Report }
