const sequelize = require('../config/database');
const path = require('path');
const fs = require('fs');

async function runMigrations() {
    try {
        // Read all migration files
        const migrationsPath = path.join(__dirname, '../migrations');
        const migrationFiles = fs.readdirSync(migrationsPath)
            .filter(file => file.endsWith('.js'))
            .sort();

        // Run each migration
        for (const file of migrationFiles) {
            console.log(`Running migration: ${file}`);
            const migration = require(path.join(migrationsPath, file));
            await migration.up(sequelize.queryInterface, sequelize);
        }

        console.log('All migrations completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigrations(); 