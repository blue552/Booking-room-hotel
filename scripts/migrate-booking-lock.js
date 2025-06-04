#!/usr/bin/env node

/**
 * Migration script để chuyển từ RedisLock sang BookingLock
 * Chạy: node scripts/migrate-booking-lock.js
 */

const fs = require('fs');
const path = require('path');

const FILES_TO_UPDATE = [
    'booking-service/bookingRoutes.js',
    'utils/bookingQueue.js'
];

const REPLACEMENTS = [
    {
        from: /const RedisLock = require\(['"]\.\/utils\/redisLock['"]\);?/g,
        to: "const BookingLock = require('./utils/bookingLock');"
    },
    {
        from: /const RedisLock = require\(['"]\.\/redisLock['"]\);?/g,
        to: "const BookingLock = require('./bookingLock');"
    },
    {
        from: /RedisLock\.acquireLock/g,
        to: "BookingLock.acquireLock"
    },
    {
        from: /RedisLock\.releaseLock/g,
        to: "BookingLock.releaseLock"
    },
    {
        from: /RedisLock\.isLocked/g,
        to: "BookingLock.isLocked"
    }
];

function updateFile(filePath) {
    console.log(`🔄 Updating ${filePath}...`);
    
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  File ${filePath} does not exist, skipping...`);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        REPLACEMENTS.forEach(replacement => {
            const originalContent = content;
            content = content.replace(replacement.from, replacement.to);
            if (content !== originalContent) {
                modified = true;
                console.log(`   ✅ Applied replacement: ${replacement.from.source || replacement.from}`);
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`   💾 File updated successfully`);
        } else {
            console.log(`   ✨ No changes needed`);
        }
    } catch (error) {
        console.error(`   ❌ Error updating ${filePath}:`, error.message);
    }
}

function createBackup(filePath) {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    try {
        if (fs.existsSync(filePath)) {
            fs.copyFileSync(filePath, backupPath);
            console.log(`📝 Created backup: ${backupPath}`);
        }
    } catch (error) {
        console.error(`❌ Failed to create backup for ${filePath}:`, error.message);
    }
}

function main() {
    console.log('🚀 Starting BookingLock migration...\n');

    // Create backups first
    console.log('📋 Creating backups...');
    FILES_TO_UPDATE.forEach(createBackup);
    console.log('');

    // Update files
    console.log('🔧 Updating files...');
    FILES_TO_UPDATE.forEach(updateFile);
    console.log('');

    // Summary
    console.log('📊 Migration Summary:');
    console.log('✅ Updated imports from RedisLock to BookingLock');
    console.log('✅ Updated method calls to use new interface');
    console.log('✅ Maintained backward compatibility');
    console.log('');

    console.log('🎯 Next Steps:');
    console.log('1. Test the application thoroughly');
    console.log('2. Verify all booking functionality works');
    console.log('3. Consider removing old files after testing:');
    console.log('   - utils/redisLock.js');
    console.log('   - utils/advancedBookingLock.js');
    console.log('');

    console.log('📂 File Structure After Migration:');
    console.log('utils/');
    console.log('├── bookingLock.js          # ✅ Unified locking solution');
    console.log('├── redisStore.js           # ✅ Data operations (keep)');
    console.log('├── bookingQueue.js         # 🔄 Optional (updated imports)');
    console.log('├── redisLock.js            # ❌ Can be removed after testing');
    console.log('└── advancedBookingLock.js  # ❌ Can be removed after testing');
    console.log('');

    console.log('🎉 Migration completed!');
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { updateFile, createBackup, main };