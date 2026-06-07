import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requireSuperAdmin } from '../../middlewares/require-super-admin';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';

export default (): Router => {
  const router = Router();
  const adminService = new AdminService();
  const adminController = new AdminController(adminService);

  router.use(authenticate);
  router.use(requireSuperAdmin);

  /**
   * @swagger
   * /admin/health:
   *   get:
   *     tags: [Admin]
   *     summary: Get system health metrics
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: System health data
   */
  router.get('/health', adminController.getHealth);

  return router;
};
