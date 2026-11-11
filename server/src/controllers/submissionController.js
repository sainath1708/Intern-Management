import {
  createSubmission,
  listSubmissions,
  reviewSubmission,
} from '../services/submissionService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export const postSubmission = asyncHandler(async (req, res) => {
  const submission = await createSubmission({
    taskId: req.params.id,
    internProfile: req.intern,
    payload: req.body,
  });
  return sendCreated(res, { submission }, 'Work submitted successfully');
});

export const getSubmissions = asyncHandler(async (req, res) => {
  const result = await listSubmissions(req.query);
  return sendSuccess(res, result, 'Submissions loaded successfully');
});

export const patchSubmissionReview = asyncHandler(async (req, res) => {
  const result = await reviewSubmission({
    submissionId: req.params.id,
    adminId: req.user._id,
    reviewStatus: req.body.reviewStatus,
    adminFeedback: req.body.adminFeedback,
  });

  const message =
    req.body.reviewStatus === 'Approved'
      ? 'Submission approved and task marked as completed'
      : 'Changes requested and feedback sent to the intern';

  return sendSuccess(res, result, message);
});
