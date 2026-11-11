import mongoose from 'mongoose';
import { PRIORITIES, TASK_STATUS, TASK_STATUSES } from '../utils/constants.js';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Task title must be at least 3 characters long'],
      maxlength: [120, 'Task title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Task description is required'],
      trim: true,
      minlength: [10, 'Task description must be at least 10 characters long'],
      maxlength: [4000, 'Task description cannot exceed 4000 characters'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Intern',
      required: [true, 'A task must be assigned to an intern'],
    },
    deadline: {
      type: Date,
      required: [true, 'Deadline is required'],
    },
    priority: {
      type: String,
      enum: {
        values: PRIORITIES,
        message: `Priority must be one of: ${PRIORITIES.join(', ')}`,
      },
      default: 'Medium',
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: TASK_STATUSES,
        message: `Status must be one of: ${TASK_STATUSES.join(', ')}`,
      },
      default: TASK_STATUS.PENDING,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task creator is required'],
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ status: 1, priority: 1 });
taskSchema.index({ deadline: 1 });
taskSchema.index({ createdAt: -1 });

export const Task = mongoose.model('Task', taskSchema);
