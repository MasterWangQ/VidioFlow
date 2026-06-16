import { DataTypes, Model } from 'sequelize'
import sequelize from '../config/database.js'

export class Notification extends Model {
  declare id: number
  declare userId: number
  declare type: string
  declare content: string
  declare link: string
  declare read: boolean
  declare createdAt: Date
}

Notification.init(
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
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    link: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true
  }
)