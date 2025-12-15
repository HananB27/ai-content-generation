const bcrypt = require('bcryptjs');
const pool = require('./config/database');

async function createTestUser() {
  try {
    const email = 'test@example.com';
    const password = 'testpassword123';
    
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('Test user already exists!');
      console.log('Email:', email);
      console.log('Password:', password);
      process.exit(0);
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, passwordHash]
    );
    
    console.log('✅ Test user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    test@example.com');
    console.log('Password: testpassword123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();
