const { Sequelize } = require('sequelize');
const config = require('./index');

const dbUrl = config.databaseUrl || process.env.DATABASE_URL || process.env.DATABASE_PRIVATE_URL || process.env.RAILWAY_DATABASE_URL;

if (!dbUrl) {
  console.error('ERROR: No DATABASE_URL found. Set DATABASE_URL environment variable.');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES') || k.includes('PG')).join(', ') || 'none');
  process.exit(1);
}

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: config.nodeEnv === 'development' ? console.log : false,
  dialectOptions: config.nodeEnv === 'production' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {},
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = sequelize;
