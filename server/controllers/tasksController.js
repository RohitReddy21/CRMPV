import Task from '../models/Task.js';

// Get all tasks for the logged-in user (assigned to them OR created by them)
export const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({
            $or: [{ assignedTo: req.user.id }, { createdBy: req.user.id }]
        })
            .sort({ dueDate: 1 })
            .populate('assignedTo', 'name email')
            .populate('createdBy', 'name email');
        res.json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
};

// Create a new task
export const createTask = async (req, res) => {
    try {
        const { title, description, dueDate, priority, assignedTo, relatedLead } = req.body;
        const task = new Task({
            title,
            description,
            dueDate,
            priority,
            assignedTo: assignedTo || req.user.id, // Default to self if not specified
            createdBy: req.user.id,
            relatedLead
        });
        await task.save();

        // Return populated task for immediate display
        const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name').populate('createdBy', 'name');
        res.status(201).json(populatedTask);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Failed to create task' });
    }
};

// Update a task (status, etc.)
export const updateTask = async (req, res) => {
    try {
        const task = await Task.findOneAndUpdate(
            {
                _id: req.params.id,
                $or: [{ assignedTo: req.user.id }, { createdBy: req.user.id }] // Allow creator or assignee to update
            },
            req.body,
            { new: true }
        ).populate('assignedTo', 'name').populate('createdBy', 'name');

        if (!task) return res.status(404).json({ error: 'Task not found or unauthorized' });
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update task' });
    }
};

// Delete a task
export const deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user.id // Only creator can delete? Or assignee too? Let's say only creator for safety
        });
        if (!task) return res.status(404).json({ error: 'Task not found or unauthorized' });
        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete task' });
    }
};
