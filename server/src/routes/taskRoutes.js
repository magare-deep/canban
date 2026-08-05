const express = require('express');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/tasks
router.get('/', verifyToken, async (req, res) => {
  try {
    const allTasks = await db.getTasks();
    const users = await db.getUsers();

    const enriched = allTasks.map(task => {
      const assigneeId = task.assignee_id || task.assigneeId;
      const assignee = users.find(u => u.id === assigneeId || u.email === task.assignee_email);

      return {
        ...task,
        assigneeId: assigneeId || req.user.id,
        dueDate: task.due_date || task.dueDate,
        estimatedHours: Number(task.estimated_hours || task.estimatedHours || 0),
        loggedHours: Number(task.logged_hours || task.loggedHours || 0),
        assignee: assignee ? {
          id: assignee.id,
          name: assignee.name,
          email: assignee.email,
          avatar: assignee.avatar,
          title: assignee.title
        } : {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email
        }
      };
    });

    return res.json({
      success: true,
      tasks: enriched
    });
  } catch (err) {
    console.error('Fetch tasks error:', err);
    return res.status(500).json({ success: false, message: 'Database error fetching tasks' });
  }
});

// @route   POST /api/tasks
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, priority, status, dueDate, estimatedHours, category, assigneeId } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Task title is required.' });
    }

    const targetAssigneeId = assigneeId || req.user.id;

    const newTask = await db.createTask({
      title,
      description: description || '',
      priority: priority || 'medium',
      status: status || 'todo',
      category: category || 'General',
      assigneeId: targetAssigneeId,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      estimatedHours: Number(estimatedHours) || 2
    });

    const users = await db.getUsers();
    const assignee = users.find(u => u.id === targetAssigneeId);

    return res.status(201).json({
      success: true,
      task: {
        ...newTask,
        assigneeId: targetAssigneeId,
        dueDate: newTask.due_date || newTask.dueDate,
        assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email, avatar: assignee.avatar } : { id: req.user.id, name: req.user.name, email: req.user.email }
      }
    });
  } catch (err) {
    console.error('Create task error:', err);
    return res.status(500).json({ success: false, message: 'Database error creating task' });
  }
});

// @route   PUT /api/tasks/:id
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.getTaskById(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    const updated = await db.updateTask(id, req.body);
    const users = await db.getUsers();
    const assignee = users.find(u => u.id === (updated.assignee_id || updated.assigneeId));

    return res.json({
      success: true,
      task: {
        ...updated,
        assigneeId: updated.assignee_id || updated.assigneeId,
        dueDate: updated.due_date || updated.dueDate,
        assignee: assignee ? { id: assignee.id, name: assignee.name, email: assignee.email, avatar: assignee.avatar } : null
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Database error updating task' });
  }
});

// @route   DELETE /api/tasks/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteTask(id);
    return res.json({ success: true, message: 'Task deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Database error deleting task' });
  }
});

module.exports = router;
