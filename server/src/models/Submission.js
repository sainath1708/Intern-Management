import mongoose from 'mongoose';
import { REVIEW_STATUS, REVIEW_STATUSES } from '../utils/constants.js';

const urlValidator = {
  validator(value) {
    if (!value) return true;
    try {
      const parsed = new URL(value);
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  },
  message: 'Please provide a valid HTTP or HTTPS URL',
};

const submissionSchema = new mongoose.Schema(
  {
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'A submission must belong to a task'],
    },
    intern: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Intern',
      required: [true, 'A submission must belong to an intern'],
    },
    description: {
      type: String,
      required: [true, 'Work description is required'],
      trim: true,
      minlength: [10, 'Work description must be at least 10 characters long'],
      maxlength: [4000, 'Work description cannot exceed 4000 characters'],
    },
    githubUrl: {
      type: String,
      trim: true,
      default: '',
      validate: urlValidator,
    },
    documentUrl: {
      type: String,
      trim: true,
      default: '',
      validate: urlValidator,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    reviewStatus: {
      type: String,
      enum: {
        values: REVIEW_STATUSES,
        message: `Review status must be one of: ${REVIEW_STATUSES.join(', ')}`,
      },
      default: REVIEW_STATUS.SUBMITTED,
    },
    adminFeedback: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Feedback cannot exceed 2000 characters'],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    // Attempt number within the task, starting at 1.
    attempt: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { timestamps: true },
);

submissionSchema.index({ task: 1, submittedAt: -1 });
submissionSchema.index({ intern: 1, reviewStatus: 1 });
submissionSchema.index({ reviewStatus: 1, submittedAt: -1 });

export const Submission = mongoose.model('Submission', submissionSchema);
