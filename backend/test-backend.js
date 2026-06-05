// Quick syntax check and module load test
const fs = require('fs');
const path = require('path');

console.log('Testing backend modules...');

// Test 1: Check db.js loads
try {
    require('./src/db');
    console.log('✓ db.js loads correctly');
} catch (e) {
    console.error('✗ db.js failed:', e.message);
    process.exit(1);
}

// Test 2: Check qr.js route loads
try {
    const qrRoutes = require('./src/routes/qr');
    console.log('✓ routes/qr.js loads correctly');
} catch (e) {
    console.error('✗ routes/qr.js failed:', e.message);
    process.exit(1);
}

// Test 3: Check billing.js route loads
try {
    const billingRoutes = require('./src/routes/billing');
    console.log('✓ routes/billing.js loads correctly');
} catch (e) {
    console.error('✗ routes/billing.js failed:', e.message);
    process.exit(1);
}

// Test 4: Check profile.js route loads
try {
    const profileRoutes = require('./src/routes/profile');
    console.log('✓ routes/profile.js loads correctly');
} catch (e) {
    console.error('✗ routes/profile.js failed:', e.message);
    process.exit(1);
}

// Test 5: Check server.js loads (without starting server)
try {
    // Mock the listen function to prevent actual server start
    const originalListen = require('express').prototype.listen;
    require('express').prototype.listen = function(...args) {
        console.log('✓ server.js would start on port', require('./src/config').port);
        return { close: () => {} };
    };
    require('./src/server');
    console.log('✓ server.js loads correctly');
    // Restore
    require('express').prototype.listen = originalListen;
} catch (e) {
    console.error('✗ server.js failed:', e.message);
    process.exit(1);
}

// Test 6: Check auth middleware
try {
    require('./src/middleware/auth');
    console.log('✓ middleware/auth.js loads correctly');
} catch (e) {
    console.error('✗ middleware/auth.js failed:', e.message);
    process.exit(1);
}

// Test 7: Check auth.js
try {
    require('./src/auth');
    console.log('✓ auth.js loads correctly');
} catch (e) {
    console.error('✗ auth.js failed:', e.message);
    process.exit(1);
}

console.log('\n✅ All backend modules load successfully!');
console.log('\nTo test endpoints, run:');
console.log('  cd tagalong-qr/backend && npm start');
console.log('Then in another terminal:');
console.log('  curl http://localhost:4000/health');
console.log('  curl -X POST http://localhost:4000/api/auth/register ...');