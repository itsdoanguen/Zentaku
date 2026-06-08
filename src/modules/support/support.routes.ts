import { Router } from 'express';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { authenticate } from '../../middlewares/authenticate';
import { requireSuperAdmin } from '../../middlewares/require-super-admin';

const router = Router();
const supportService = new SupportService();
const supportController = new SupportController(supportService);

router.post('/tickets', authenticate, supportController.createTicket);

// Admin routes for managing tickets
router.get('/admin/tickets', authenticate, requireSuperAdmin, supportController.getTickets);
router.patch(
  '/admin/tickets/:id/status',
  authenticate,
  requireSuperAdmin,
  supportController.updateStatus
);

export default router;
