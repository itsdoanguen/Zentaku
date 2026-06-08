import type { Request, Response } from 'express';
import type { SupportService } from './support.service';
import type { TicketStatus } from '../../entities/SupportTicket.entity';

export class SupportController {
  constructor(private readonly supportService: SupportService) {
    this.createTicket = this.createTicket.bind(this);
    this.getTickets = this.getTickets.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
  }

  async createTicket(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }
      const ticket = await this.supportService.createTicket(userId, req.body);
      res.status(201).json({ success: true, data: ticket });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getTickets(req: Request, res: Response): Promise<void> {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const status = req.query.status as TicketStatus | undefined;
      const category = req.query.category as string | undefined;

      const result = await this.supportService.getTickets({ page, limit, status, category });
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const ticketIdStr = req.params.id as string | undefined;
      if (!ticketIdStr) throw new Error('Ticket ID is required');
      const ticketId = BigInt(ticketIdStr);
      const { status } = req.body;
      const ticket = await this.supportService.updateTicketStatus(ticketId, status as TicketStatus);
      res.status(200).json({ success: true, data: ticket });
    } catch (error: any) {
      res.status(404).json({ success: false, message: error.message });
    }
  }
}
