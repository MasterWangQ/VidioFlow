import { DataTypes, Model } from 'sequelize'
import sequelize from '../config/database.js'

export class WatchHistory extends Model {
  declare id: number
  declare userId: number
  declare videoId: number
  declare watchedAt: Date
  declare progress: number // 播放进度（秒）
}

WatchHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    videoId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    watchedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  },
  {
    sequelize,
    modelName: 'WatchHistory',
    tableName: 'watch_history',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'videoId']
      }
    ]
  }
)
