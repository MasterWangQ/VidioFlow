import { DataTypes, Model } from 'sequelize'
import sequelize from '../config/database.js'

export class Like extends Model {
  declare id: number
  declare userId: number
  declare videoId: number
  declare createdAt: Date
  declare updatedAt: Date
}

Like.init(
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
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'Like',
    tableName: 'likes',
    timestamps: false
  }
)
