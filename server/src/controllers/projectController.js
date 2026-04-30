const { Project, TeamMember, User, Task } = require('../models');

const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description,
      ownerId: req.user.id
    });

    await TeamMember.create({
      projectId: project.id,
      userId: req.user.id,
      role: 'admin'
    });

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }
    res.status(500).json({ message: 'Server error creating project.' });
  }
};

const getProjects = async (req, res) => {
  try {
    const memberships = await TeamMember.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Project,
        include: [
          { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
          { model: TeamMember, as: 'members', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }] }
        ]
      }]
    });

    const projects = memberships.map(m => ({
      ...m.Project.toJSON(),
      myRole: m.role
    }));

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching projects.' });
  }
};

const getProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.projectId, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email'] },
        { model: TeamMember, as: 'members', include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }] },
        {
          model: Task, as: 'tasks',
          include: [
            { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
            { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
          ]
        }
      ]
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching project.' });
  }
};

const updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = await Project.findByPk(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    await project.update({ name: name || project.name, description: description !== undefined ? description : project.description });

    res.json({ message: 'Project updated successfully', project });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }
    res.status(500).json({ message: 'Server error updating project.' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Only the project owner can delete this project.' });
    }

    await Task.destroy({ where: { projectId: project.id } });
    await TeamMember.destroy({ where: { projectId: project.id } });
    await project.destroy();

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting project.' });
  }
};

const addMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const { projectId } = req.params;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User with this email not found.' });
    }

    const existingMember = await TeamMember.findOne({
      where: { projectId, userId: user.id }
    });
    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member of this project.' });
    }

    const member = await TeamMember.create({
      projectId,
      userId: user.id,
      role: role || 'member'
    });

    const memberWithUser = await TeamMember.findByPk(member.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }]
    });

    res.status(201).json({ message: 'Member added successfully', member: memberWithUser });
  } catch (error) {
    res.status(500).json({ message: 'Server error adding member.' });
  }
};

const removeMember = async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    const project = await Project.findByPk(projectId);
    if (project.ownerId === userId) {
      return res.status(400).json({ message: 'Cannot remove the project owner.' });
    }

    const member = await TeamMember.findOne({
      where: { projectId, userId }
    });

    if (!member) {
      return res.status(404).json({ message: 'Member not found in this project.' });
    }

    await Task.update(
      { assigneeId: null },
      { where: { projectId, assigneeId: userId } }
    );

    await member.destroy();

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error removing member.' });
  }
};

const updateMemberRole = async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const { role } = req.body;

    const member = await TeamMember.findOne({
      where: { projectId, userId }
    });

    if (!member) {
      return res.status(404).json({ message: 'Member not found.' });
    }

    await member.update({ role });

    res.json({ message: 'Role updated successfully', member });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating role.' });
  }
};

module.exports = {
  createProject, getProjects, getProject, updateProject, deleteProject,
  addMember, removeMember, updateMemberRole
};
