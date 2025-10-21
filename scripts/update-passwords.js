const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function updatePasswords() {
  const client = new Client({
    connectionString: 'postgresql://ticket_admin:dev123@localhost:5432/service_tickets'
  });

  try {
    await client.connect();
    console.log('Connected to database...');

    // Hash the password 'password123'
    const hashedPassword = await bcrypt.hash('password123', 10);
    console.log('Password hashed successfully');

    // Update all users with the properly hashed password
    const users = [
      'admin@example.com',
      'agent1@example.com',
      'agent2@example.com',
      'customer@example.com'
    ];

    for (const email of users) {
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE email = $2',
        [hashedPassword, email]
      );
      console.log(`✓ Updated password for ${email}`);
    }

    console.log('\n✅ All passwords updated successfully!');
    console.log('You can now login with:');
    console.log('  Email: admin@example.com (or any other user)');
    console.log('  Password: password123');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

updatePasswords();
