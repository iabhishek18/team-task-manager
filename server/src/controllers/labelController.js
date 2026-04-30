const { Label, TaskLabel, Task } = require('../models');

const getLabels = async (req, res) => {
  try {
    const labels = await Label.findAll({
      where: { projectId: req.params.projectId },
      order: [['name', 'ASC']]
    });
    res.json({ labels });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching labels.' });
  }
};

const createLabel = async (req, res) => {
  try {
    const { name, color } = req.body;
    const label = await Label.create({
      name, color: color || '#6366f1', projectId: req.params.projectId
    });
    res.status(201).json({ label });
  } catch (error) {
    res.status(500).json({ message: 'Server error creating label.' });
  }
};

const deleteLabel = async (req, res) => {
  try {
    await TaskLabel.destroy({ where: { labelId: req.params.labelId } });
    await Label.destroy({ where: { id: req.params.labelId, projectId: req.params.projectId } });
    res.json({ message: 'Label deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting label.' });
  }
};

const addLabelToTask = async (req, res) => {
  try {
    const { labelId } = req.body;
    const existing = await TaskLabel.findOne({ where: { taskId: req.params.taskId, labelId } });
    if (existing) return res.status(400).json({ message: 'Label already attached.' });

    await TaskLabel.create({ taskId: req.params.taskId, labelId });
    res.status(201).json({ message: 'Label added to task' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const removeLabelFromTask = async (req, res) => {
  try {
    await TaskLabel.destroy({ where: { taskId: req.params.taskId, labelId: req.params.labelId } });
    res.json({ message: 'Label removed from task' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getLabels, createLabel, deleteLabel, addLabelToTask, removeLabelFromTask };
