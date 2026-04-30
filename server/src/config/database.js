const { Sequelize } = require('sequelize');
const config = require('./index');

const dbUrl = config.databaseUrl || process.env.DATABASE_URL || process.env.DATABASE_PRIVATE_URL || process.env.RAILWAY_DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

if (!dbUrl) {
  console.error('ERROR: No DATABASE_URL found.');
  console.error('Database-related env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES') || k.includes('PG') || k.includes('PGHOST')).join(', ') || 'none found');
  process.exit(1);
}

let sequelize;

if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: config.nodeEnv === 'development' ? console.log : false,
    dialectOptions: config.nodeEnv === 'production' ? {
      ssl: { require: true, rejectUnauthorized: false }
    } : {},
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  });
} else {
  const pgHost = process.env.PGHOST || process.env.POSTGRES_HOST || 'localhost';
  const pgPort = process.env.PGPORT || process.env.POSTGRES_PORT || 5432;
  const pgUser = process.env.PGUSER || process.env.POSTGRES_USER || 'postgres';
  const pgPass = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || '';
  const pgDb = process.env.PGDATABASE || process.env.POSTGRES_DB || 'railway';

  sequelize = new Sequelize(pgDb, pgUser, pgPass, {
    host: pgHost,
    port: pgPort,
    dialect: 'postgres',
    logging: config.nodeEnv === 'development' ? console.log : false,
    dialectOptions: config.nodeEnv === 'production' ? {
      ssl: { require: true, rejectUnauthorized: false }
    } : {},
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  });
}

module.exports = sequelize;
