const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'GraphTRC20',
  password: '3214',
  port: 5432,
});

module.exports = pool;
