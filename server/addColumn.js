const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('videoflow', 'root', '123456', {
  host: 'localhost',
  dialect: 'mysql'
});

async function addColumn() {
  try {
    await sequelize.query('ALTER TABLE videos ADD COLUMN IF NOT EXISTS rejectReason TEXT DEFAULT ""');
    console.log('Column added successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error adding column:', error);
    process.exit(1);
  }
}

addColumn();