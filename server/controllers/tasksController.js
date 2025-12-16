import Task from '../models/Task.js';

// Get all tasks for the logged-in user
export const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ assignedTo: req.user.id }).sort({ dueDate: 1 }); // Sort by soonest due
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

// Create a new task
export const createTask = async (req, res) => {
    try {
        const { title, description, dueDate, priority, relatedLead } = req.body;
        const task = new Task({
            title,
            description,
            dueDate,
            priority,
            assignedTo: req.user.id,
            relatedLead
        });
        await task.save();
        res.status(201).json(task);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create task' });
    }
};

// Update a task (status, etc.)
export const updateTask = async (req, res) => {
    try {
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, assignedTo: req.user.id },
            req.body,
            { new: true }
        );
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
};

// Delete a task
export const deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, assignedTo: req.user.id });
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
};
