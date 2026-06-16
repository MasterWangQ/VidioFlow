import { Sequelize } from 'sequelize'
import { config } from './index.js'

const sequelize = new Sequelize(
  config.database.database,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'mysql',
    logging: false
  }
)

export const connectDatabase = async () => {
  try {
    const { host, port, username, password, database } = config.database

    // 先连接MySQL不指定数据库，检查数据库是否存在
    const tempSequelize = new Sequelize('', username, password, {
      host,
      port,
      dialect: 'mysql',
      logging: false
    })

    // 创建数据库（如果不存在）
    await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS ${database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
    await tempSequelize.close()

    await sequelize.authenticate()
    console.log('数据库连接成功')

    // 检查并添加缺失的字段
    await addMissingColumns()

    // 使用 sync 模式，仅在表不存在时创建
    await sequelize.sync({ force: false })

    // 创建默认管理员账户
    await createDefaultAdmin()
    console.log('数据库表同步完成')
  } catch (error) {
    console.error('数据库连接失败:', error)
    throw error
  }
}

const addMissingColumns = async () => {
  try {
    // 检查 users 表是否有 role 字段
    const [userResults] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE table_schema = '${config.database.database}' 
        AND table_name = 'users' 
        AND column_name = 'role'
    `)
    
    if (!userResults[0] || (userResults[0] as { count: number }).count === 0) {
      await sequelize.query(`ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'`)
      console.log('已添加 role 字段到 users 表')
    }

    // 检查 videos 表是否有 rejectReason 字段
    const [videoResults] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE table_schema = '${config.database.database}' 
        AND table_name = 'videos' 
        AND column_name = 'rejectReason'
    `)
    
    if (!videoResults[0] || (videoResults[0] as { count: number }).count === 0) {
      await sequelize.query(`ALTER TABLE videos ADD COLUMN rejectReason TEXT`)
      console.log('已添加 rejectReason 字段到 videos 表')
    }
  } catch (error) {
    console.error('添加缺失字段失败:', error)
  }
}

const createDefaultAdmin = async () => {
  try {
    // 检查是否已存在默认管理员
    const [results] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE email = 'admin@admin.com'
    `)
    
    if (!results[0] || (results[0] as { count: number }).count === 0) {
      // 创建默认管理员账户
      const { default: bcrypt } = await import('bcryptjs')
      const hashedPassword = await bcrypt.hash('123456', 10)
      
      await sequelize.query(`
        INSERT INTO users (username, email, password, nickname, role, createdAt, updatedAt)
        VALUES ('admin', 'admin@admin.com', '${hashedPassword}', '管理员', 'admin', NOW(), NOW())
      `)
      console.log('已创建默认管理员账户: admin@admin.com')
    }
  } catch (error) {
    console.error('创建默认管理员失败:', error)
  }
}

export default sequelize