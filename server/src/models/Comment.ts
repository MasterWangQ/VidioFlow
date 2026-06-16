import { DataTypes, Model } from 'sequelize'
import sequelize from '../config/database.js'

export class Comment extends Model {
  declare id: number
  declare content: string
  declare userId: number
  declare videoId: number
  declare parentId: number | null
  declare createdAt: Date
  declare updatedAt: Date
}

Comment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    content: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    videoId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Comment',
    tableName: 'comments',
    timestamps: true
  }
)
