const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { supabase } = require('./supabase');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.bphzinwvsmxahjrjokbp:DeepMagare%402003@aws-0-ap-south-1.pooler.supabase.com:5432/postgres';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

// Auto-initialize schema in Supabase & ensure default Admin Account exists
const initTables = async () => {
  try {
    await pool.query(`
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

      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'todo',
        priority VARCHAR(50) NOT NULL DEFAULT 'medium',
        category VARCHAR(100) DEFAULT 'General',
        assignee_id VARCHAR(64) REFERENCES employees(id) ON DELETE SET NULL,
        due_date VARCHAR(50),
        estimated_hours NUMERIC(5,2) DEFAULT 0,
        logged_hours NUMERIC(5,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Clean up any default unsplash avatar strings from database
    await pool.query(`
      UPDATE employees 
      SET avatar = '' 
      WHERE avatar LIKE '%unsplash.com%';
    `);

    // Ensure Admin User (admin@devnectar.in / DeepMagare@2003) exists in Supabase DB
    const adminEmail = 'admin@devnectar.in';
    const adminPass = 'DeepMagare@2003';
    const existingAdmin = await pool.query('SELECT * FROM employees WHERE LOWER(email) = LOWER($1)', [adminEmail]);

    if (existingAdmin.rowCount === 0) {
      const hashed = bcrypt.hashSync(adminPass, 10);
      await pool.query(`
        INSERT INTO employees (id, name, email, password, role, title, department)
        VALUES ('emp_admin_1', 'DevNectar Administrator', $1, $2, 'admin', 'System Admin', 'Management');
      `, [adminEmail, hashed]);
      console.log('✅ Admin Account Created: admin@devnectar.in / DeepMagare@2003');
    } else {
      // Ensure existing admin account has role = 'admin' and password updated if needed
      const hashed = bcrypt.hashSync(adminPass, 10);
      await pool.query(`
        UPDATE employees 
        SET role = 'admin', password = $1 
        WHERE LOWER(email) = LOWER($2);
      `, [hashed, adminEmail]);
      console.log('✅ Admin Account Verified & Access Granted: admin@devnectar.in');
    }

    console.log('✅ DevNectar Supabase tables (employees & tasks) verified and ready!');
  } catch (err) {
    console.error('❌ Table init error:', err.message);
  }
};

initTables();

module.exports = {
  supabase,
  pool,
  
  getUsers: async () => {
    const res = await pool.query('SELECT * FROM employees ORDER BY created_at DESC');
    return res.rows;
  },

  findUserByEmail: async (email) => {
    const res = await pool.query('SELECT * FROM employees WHERE LOWER(email) = LOWER($1)', [email]);
    return res.rows[0] || null;
  },

  findUserById: async (id) => {
    const res = await pool.query('SELECT * FROM employees WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  createUser: async (userData) => {
    const id = 'emp_' + Date.now();
    // Auto grant admin role if email contains admin
    const role = (userData.email && userData.email.toLowerCase().includes('admin')) ? 'admin' : (userData.role || 'user');
    const title = userData.title || 'Consultant';
    const department = userData.department || 'Consulting';
    const avatar = userData.avatar || '';
    
    const res = await pool.query(`
      INSERT INTO employees (id, name, email, password, role, title, department, avatar, phone, location)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `, [
      id,
      userData.name,
      userData.email,
      userData.password,
      role,
      title,
      department,
      avatar,
      userData.phone || '',
      userData.location || ''
    ]);

    return res.rows[0];
  },

  updateUser: async (id, updates) => {
    const fields = [];
    const values = [];
    let idx = 1;

    if (updates.name) { fields.push(`name = $${idx++}`); values.push(updates.name); }
    if (updates.title) { fields.push(`title = $${idx++}`); values.push(updates.title); }
    if (updates.department) { fields.push(`department = $${idx++}`); values.push(updates.department); }
    if (updates.phone) { fields.push(`phone = $${idx++}`); values.push(updates.phone); }
    if (updates.location) { fields.push(`location = $${idx++}`); values.push(updates.location); }
    if (updates.avatar !== undefined) { fields.push(`avatar = $${idx++}`); values.push(updates.avatar); }
    if (updates.role) { fields.push(`role = $${idx++}`); values.push(updates.role); }
    if (updates.password) {
      const hashed = bcrypt.hashSync(updates.password, 10);
      fields.push(`password = $${idx++}`);
      values.push(hashed);
    }

    if (fields.length === 0) return await module.exports.findUserById(id);

    values.push(id);
    const query = `UPDATE employees SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  deleteUser: async (id) => {
    await pool.query('DELETE FROM employees WHERE id = $1', [id]);
  },

  getTasks: async () => {
    const res = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    return res.rows;
  },

  getTaskById: async (id) => {
    const res = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  createTask: async (taskData) => {
    const id = 'tsk_' + Date.now();
    const res = await pool.query(`
      INSERT INTO tasks (id, title, description, status, priority, category, assignee_id, due_date, estimated_hours, logged_hours)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `, [
      id,
      taskData.title,
      taskData.description || '',
      taskData.status || 'todo',
      taskData.priority || 'medium',
      taskData.category || 'General',
      taskData.assigneeId || null,
      taskData.dueDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      taskData.estimatedHours || 2,
      taskData.loggedHours || 0
    ]);
    return res.rows[0];
  },

  updateTask: async (id, updates) => {
    const fields = [];
    const values = [];
    let idx = 1;

    if (updates.title) { fields.push(`title = $${idx++}`); values.push(updates.title); }
    if (updates.description) { fields.push(`description = $${idx++}`); values.push(updates.description); }
    if (updates.status) { fields.push(`status = $${idx++}`); values.push(updates.status); }
    if (updates.priority) { fields.push(`priority = $${idx++}`); values.push(updates.priority); }
    if (updates.category) { fields.push(`category = $${idx++}`); values.push(updates.category); }
    if (updates.loggedHours !== undefined) { fields.push(`logged_hours = $${idx++}`); values.push(updates.loggedHours); }

    if (fields.length === 0) return await module.exports.getTaskById(id);

    values.push(id);
    const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  deleteTask: async (id) => {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
  }
};
