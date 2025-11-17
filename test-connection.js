import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://postgres:HappyOnline15L3@db.rznogqhljodecjjlgkbx.supabase.co:5432/postgres?sslmode=require"
});

async function testConnection() {
  try {
    await client.connect();
    console.log('✅ Connected to Supabase database successfully!');
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    // Test if we can see tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('\nAvailable tables:', tables.rows.map(row => row.table_name));
    
  } catch (err) {
    console.error('❌ Connection failed:');
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    
    // More specific error handling
    if (err.code === 'ETIMEDOUT') {
      console.error('🔍 Issue: Connection timeout - check network/firewall');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('🔍 Issue: Connection refused - check host/port');
    } else if (err.code === '28P01') {
      console.error('🔍 Issue: Authentication failed - check username/password');
    } else if (err.message.includes('self signed certificate')) {
      console.error('🔍 Issue: SSL certificate problem - try sslmode=prefer instead of require');
    }
  } finally {
    await client.end();
  }
}

testConnection();