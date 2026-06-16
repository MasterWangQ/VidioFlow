import { DataTypes, Model } from 'sequelize'
import sequelize from '../config/database.js'

export class Category extends Model {
  declare id: number
  declare name: string
  declare slug: string
  declare description: string
  declare createdAt: Date
  declare updatedAt: Date
}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.STRING,
      defaultValue: ''
    }
  },
  {
    sequelize,
    modelName: 'Category',
    tableName: 'categories',
    timestamps: true
  }
)
