import { Router } from 'express';
import { getSubmissions, patchSubmissionReview } from '../controllers/submissionController.js';
import { listSubmissionsValidation, reviewSubmissionValidation } from '../validators/submissionValidators.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', listSubmissionsValidation, validate, getSubmissions);
router.patch('/:id/review', reviewSubmissionValidation, validate, patchSubmissionReview);

export default router;
