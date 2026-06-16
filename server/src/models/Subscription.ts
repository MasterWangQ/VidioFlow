import { DataTypes, Model } from 'sequelize'
import sequelize from '../config/database.js'

export class Subscription extends Model {
  declare id: number
  declare subscriberId: number
  declare creatorId: number
  declare createdAt: Date
  declare updatedAt: Date
}

Subscription.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    subscriberId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    creatorId: {
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
    modelName: 'Subscription',
    tableName: 'subscriptions',
    timestamps: false
  }
)
