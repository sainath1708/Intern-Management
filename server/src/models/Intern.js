import mongoose from 'mongoose';
import { DEPARTMENTS, INTERN_STATUS, INTERN_STATUSES } from '../utils/constants.js';
import { INDIAN_PHONE_REGEX } from '../utils/patterns.js';

const internSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A linked user account is required'],
      unique: true,
    },
    name: {
      type: String,
      required: [true, 'Intern name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [INDIAN_PHONE_REGEX, 'Please provide a valid Indian phone number'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: {
        values: DEPARTMENTS,
        message: `Department must be one of: ${DEPARTMENTS.join(', ')}`,
      },
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
    },
    status: {
      type: String,
      enum: {
        values: INTERN_STATUSES,
        message: 'Status must be active or inactive',
      },
      default: INTERN_STATUS.ACTIVE,
    },
    // Safe deletion: archived interns keep their task and submission history.
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

internSchema.index({ name: 1 });
internSchema.index({ email: 1 });
internSchema.index({ department: 1, status: 1 });
internSchema.index({ deletedAt: 1 });

export const Intern = mongoose.model('Intern', internSchema);
