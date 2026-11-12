import { Router } from 'express';
import {
  deleteIntern,
  getIntern,
  getInterns,
  postIntern,
  putIntern,
} from '../controllers/internController.js';
import {
  createInternValidation,
  internIdValidation,
  listInternsValidation,
  updateInternValidation,
} from '../validators/internValidators.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', listInternsValidation, validate, getInterns);
router.post('/', createInternValidation, validate, postIntern);
router.get('/:id', internIdValidation, validate, getIntern);
router.put('/:id', updateInternValidation, validate, putIntern);
router.delete('/:id', internIdValidation, validate, deleteIntern);

export default router;
