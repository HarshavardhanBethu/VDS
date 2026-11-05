import { initDatabase, pool } from '../config/db.js';

console.log('🔄 Initializing VDS Database tables and seed data...');
initDatabase()
  .then(() => {
    console.log('🎉 Database initialization complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Database initialization failed:', err);
    process.exit(1);
  });

