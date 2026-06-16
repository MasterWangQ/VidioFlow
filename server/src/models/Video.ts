import { DataTypes, Model } from 'sequelize'
import sequelize from '../config/database.js'

export class Video extends Model {
  declare id: number
  declare title: string
  declare description: string
  declare url: string
  declare cover: string
  declare duration: number
  declare userId: number
  declare category: string
  declare tags: string[]
  declare viewCount: number
  declare likeCount: number
  declare status: number
  declare rejectReason: string
  declare createdAt: Date
  declare updatedAt: Date
}

Video.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    cover: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    duration: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    tags: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    likeCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    rejectReason: {
      type: DataTypes.TEXT,
      defaultValue: ''
    }
  },
  {
    sequelize,
    modelName: 'Video',
    tableName: 'videos',
    timestamps: true
  }
)
