const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const supabaseUrl = 'https://bphzinwvsmxahjrjokbp.supabase.co';
const supabaseKey = 'sb_secret_wzGd7a3_SZWnoP9VLONRsQ_53iywfLT'; // Service key

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupWithSupabaseClient() {
  console.log('⚡ Connecting to Supabase via REST API (https://bphzinwvsmxahjrjokbp.supabase.co)...');
  
  const demoPasswordHash = bcrypt.hashSync('DeepMagare@2003', 10);

  // Demo employee record
  const employeeData = {
    id: 'emp_deep_1',
    name: 'Deep Magare',
    email: 'deep.magare@company.com',
    password: demoPasswordHash,
    role: 'admin',
    title: 'Lead Fullstack Engineer',
    department: 'Technology & Product',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA'
  };

  // Try creating table via RPC or checking existing employees table
  console.log('Testing Supabase query on "employees" table...');
  const { data, error } = await supabase.from('employees').select('*').limit(1);

  if (error) {
    console.log('Info on employees table query:', error.message);
    if (error.code === 'PGRST301' || error.message.includes('relation "public.employees" does not exist')) {
      console.log('Table "employees" does not exist in Supabase schema yet.');
      console.log('💡 To create tables directly in Supabase SQL Editor:');
      console.log(`
CREATE TABLE public.employees (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  title VARCHAR(255),
  department VARCHAR(255),
  avatar TEXT,
  phone VARCHAR(50),
  location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
      `);
    }
  } else {
    console.log('✅ Supabase "employees" table exists! Query returned:', data);
  }

  // Also test pooler connection strings
  const poolerHosts = [
    'aws-0-ap-south-1.pooler.supabase.com',
    'aws-0-us-east-1.pooler.supabase.com',
    'aws-0-eu-central-1.pooler.supabase.com',
    'postgres.bphzinwvsmxahjrjokbp.supabase.co'
  ];

  for (const host of poolerHosts) {
    console.log(`Testing pooler host ${host}...`);
    try {
      const connStr = `postgresql://postgres.bphzinwvsmxahjrjokbp:DeepMagare%402003@${host}:5432/postgres`;
      const pool = new Pool({ connectionString: connStr, connectionTimeoutMillis: 3000, ssl: { rejectUnauthorized: false } });
      const client = await pool.connect();
      console.log(`🎉 SUCCESS! Connected to Supabase via ${host}!`);
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS employees (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'user',
          title VARCHAR(255),
          department VARCHAR(255),
          avatar TEXT,
          phone VARCHAR(50),
          location VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        INSERT INTO employees (id, name, email, password, role, title, department, avatar, phone, location)
        VALUES ('emp_deep_1', 'Deep Magare', 'deep.magare@company.com', '${demoPasswordHash}', 'admin', 'Lead Fullstack Engineer', 'Technology & Product', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256', '+1 (555) 234-5678', 'San Francisco, CA')
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, title = EXCLUDED.title;
      `);
      console.log('✅ Employee table created and record inserted into Supabase PostgreSQL!');
      client.release();
      break;
    } catch (e) {
      console.log(`Failed for ${host}:`, e.message);
    }
  }
}

setupWithSupabaseClient();
