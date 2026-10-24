import StudyTask from '../models/StudyTask.js';

export const getTasks = async (req, res, next) => {
  try {
    const { category, isCompleted } = req.query;

    const filter = { user: req.user._id };
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (isCompleted !== undefined) {
      filter.isCompleted = isCompleted === 'true';
    }

    const tasks = await StudyTask.find(filter).sort({ isCompleted: 1, dueDate: 1 });

    const total = tasks.length;
    const completed = tasks.filter(t => t.isCompleted).length;
    const pending = total - completed;

    res.json({
      success: true,
      stats: {
        total,
        completed,
        pending,
        completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0
      },
      data: tasks
    });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const { title, description, category = 'General', priority = 'Medium', dueDate } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Task title is required.' });
    }

    const task = await StudyTask.create({
      user: req.user._id,
      title,
      description: description || '',
      category,
      priority,
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    });

    res.status(201).json({
      success: true,
      message: 'Study task created.',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

export const toggleTask = async (req, res, next) => {
  try {
    const task = await StudyTask.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    task.isCompleted = !task.isCompleted;
    task.completedAt = task.isCompleted ? new Date() : null;
    await task.save();

    res.json({
      success: true,
      message: task.isCompleted ? 'Task marked as completed!' : 'Task reopened.',
      data: task
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await StudyTask.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    res.json({
      success: true,
      message: 'Task removed successfully.'
    });
  } catch (error) {
    next(error);
  }
};
