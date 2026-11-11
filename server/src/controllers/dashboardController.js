import { getAdminStats, getInternStats } from '../services/dashboardService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { ROLES } from '../utils/constants.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats =
    req.user.role === ROLES.ADMIN ? await getAdminStats() : await getInternStats(req.intern);

  return sendSuccess(res, { stats }, 'Dashboard statistics loaded successfully');
});
