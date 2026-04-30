const { Comment, User, Task } = require('../models');

const getComments = async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { taskId: req.params.taskId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'ASC']]
    });
    res.json({ comments });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching comments.' });
  }
};

const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const task = await Task.findOne({
      where: { id: req.params.taskId, projectId: req.params.projectId }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    const comment = await Comment.create({
      content,
      taskId: req.params.taskId,
      userId: req.user.id
    });

    const fullComment = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
    });

    res.status(201).json({ comment: fullComment });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }
    res.status(500).json({ message: 'Server error adding comment.' });
  }
};

const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    if (comment.userId !== req.user.id && req.membership?.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete your own comments.' });
    }

    await comment.destroy();
    res.json({ message: 'Comment deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting comment.' });
  }
};

module.exports = { getComments, addComment, deleteComment };
