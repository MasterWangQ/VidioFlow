import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('videoflow', 'root', '', {
  host: 'localhost',
  dialect: 'mysql'
});

async function addRoleColumn() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    await sequelize.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user'
    `);
    console.log('role字段添加成功');
    
    process.exit(0);
  } catch (error) {
    console.error('添加字段失败:', error);
    process.exit(1);
  }
}

addRoleColumn();