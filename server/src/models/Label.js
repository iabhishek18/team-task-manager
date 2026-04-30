const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Label = sequelize.define('Label', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  color: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#6366f1'
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Projects',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

const TaskLabel = sequelize.define('TaskLabel', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  taskId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Tasks',
      key: 'id'
    }
  },
  labelId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Labels',
      key: 'id'
    }
  }
}, {
  timestamps: false,
  indexes: [{ unique: true, fields: ['taskId', 'labelId'] }]
});

module.exports = { Label, TaskLabel };
