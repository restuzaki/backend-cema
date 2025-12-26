const Task = require("../models/task");

// Get tasks by project ID
exports.getTasksByProjectId = async (req, res) => {
  try {
    const tasks = await Task.find({ projectId: req.params.projectId });

    res.json({
      status: "success",
      total: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      error: "Failed to fetch tasks for project",
    });
  }
};

// Create new task
exports.createTask = async (req, res) => {
  const {
    projectId,
    title,
    description,
    status,
    priority,
    assignedTo,
    dueDate,
  } = req.body;

  // Validate required fields
  if (!projectId || !title) {
    return res.status(400).json({
      status: "error",
      error: "Required fields: projectId, title",
    });
  }

  try {
    // Check if task with same ID already exists
    const existingTask = await Task.findOne({ id });
    if (existingTask) {
      return res.status(400).json({
        status: "error",
        error: "Task with this ID already exists",
      });
    }

    const newTask = await Task.create({
      id: `TASK-${Date.now()}`,
      projectId,
      title,
      description,
      status: status || "To Do",
      priority: priority || "Medium",
      assignedTo,
      dueDate,
    });

    res.status(201).json({
      status: "success",
      message: "Task created successfully",
      data: newTask,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      error: "Failed to create task",
    });
  }
};

// Update task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ id: req.params.id });

    if (!task) {
      return res.status(404).json({
        status: "error",
        message: "Task not found",
      });
    }

    const { title, description, status, priority, assignedTo, dueDate } =
      req.body;

    // Update fields if provided
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (dueDate !== undefined) task.dueDate = dueDate;

    await task.save();

    res.json({
      status: "success",
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      error: "Failed to update task",
    });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ id: req.params.id });

    if (!task) {
      return res.status(404).json({
        status: "error",
        message: "Task not found",
      });
    }

    res.json({
      status: "success",
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      error: "Failed to delete task",
    });
  }
};
