import { Router } from 'express';
import { login, me } from '../controllers/authController.js';
import { loginValidation } from '../validators/authValidators.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiters.js';

const router = Router();

router.post('/login', loginLimiter, loginValidation, validate, login);
router.get('/me', authenticate, me);

export default router;
