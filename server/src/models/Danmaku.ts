import { DataTypes, Model } from 'sequelize'
import sequelize from '../config/database.js'

export class Danmaku extends Model {
  declare id: number
  declare videoId: number
  declare userId: number
  declare content: string
  declare time: number
  declare color: string
  declare type: number
  declare createdAt: Date
}

Danmaku.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    videoId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    content: {
      type: DataTypes.STRING,
      allowNull: false
    },
    time: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0
    },
    color: {
      type: DataTypes.STRING,
      defaultValue: '#ffffff'
    },
    type: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  },
  {
    sequelize,
    modelName: 'Danmaku',
    tableName: 'danmaku',
    timestamps: true
  }
)