import { DataTypes, Model } from 'sequelize'
import sequelize from '../config/database.js'

export class User extends Model {
  declare id: number
  declare username: string
  declare email: string
  declare password: string
  declare avatar: string
  declare nickname: string
  declare description: string
  declare role: string
  declare createdAt: Date
  declare updatedAt: Date
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    avatar: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    nickname: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    description: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'user',
      allowNull: false
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true
  }
)
