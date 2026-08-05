const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.bphzinwvsmxahjrjokbp:DeepMagare%402003@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runCompanyUpdate() {
  try {
    const client = await pool.connect();
    console.log('Connecting to Supabase PostgreSQL for DevNectar Consultancy...');

    const demoPasswordHash = bcrypt.hashSync('DeepMagare@2003', 10);

    // Insert or update Deep Magare with devnectar.com email
    await client.query(`
      INSERT INTO employees (id, name, email, password, role, title, department, avatar, phone, location)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (email) 
      DO UPDATE SET name = EXCLUDED.name, title = EXCLUDED.title, department = EXCLUDED.department, password = EXCLUDED.password;
    `, [
      'emp_devnectar_1',
      'Deep Magare',
      'deep.magare@devnectar.com',
      demoPasswordHash,
      'admin',
      'Principal Consultant & Director',
      'DevNectar Engineering Consultancy',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
      '+1 (555) 019-2834',
      'San Francisco, CA'
    ]);

    console.log('✅ DevNectar Consultancy employee records updated in Supabase PostgreSQL!');
    client.release();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

runCompanyUpdate();
