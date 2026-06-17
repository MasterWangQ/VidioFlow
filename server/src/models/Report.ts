import { DataTypes, Model } from 'sequelize'
import sequelize from '../config/database.js'

export class Report extends Model {
  declare id: number
  declare reporterId: number
  declare targetId: number
  declare targetType: 'video' | 'comment'
  declare targetUserId: number
  declare reason: string
  declare status: 'pending' | 'approved' | 'rejected'
  declare handledAt: Date | null
  declare handledBy: number | null
  declare createdAt: Date
  declare updatedAt: Date
}

Report.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    reporterId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    targetType: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['video', 'comment']]
      }
    },
    targetUserId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'pending',
      validate: {
        isIn: [['pending', 'approved', 'rejected']]
      }
    },
    handledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    handledBy: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    sequelize,
    modelName: 'Report',
    tableName: 'reports',
    timestamps: true
  }
)