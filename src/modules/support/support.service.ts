import { AppDataSource } from '../../config/database';
import { SupportTicket, TicketStatus } from '../../entities/SupportTicket.entity';
import type { CreateTicketDto } from './support.types';

export class SupportService {
  private ticketRepository = AppDataSource.getRepository(SupportTicket);

  async createTicket(userId: bigint, dto: CreateTicketDto): Promise<SupportTicket> {
    const ticket = this.ticketRepository.create({
      userId,
      title: dto.title,
      description: dto.description,
      category: dto.category as any,
      status: TicketStatus.PENDING,
    });
    return await this.ticketRepository.save(ticket);
  }

  async getTickets(options: {
    page?: number;
    limit?: number;
    status?: TicketStatus;
    category?: string;
  }): Promise<{ data: SupportTicket[]; total: number }> {
    const { page = 1, limit = 20, status, category } = options;
    const query = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.user', 'user')
      .orderBy('ticket.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) {
      query.andWhere('ticket.status = :status', { status });
    }
    if (category) {
      query.andWhere('ticket.category = :category', { category });
    }

    const [data, total] = await query.getManyAndCount();
    return { data, total };
  }

  async updateTicketStatus(ticketId: bigint, status: TicketStatus): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.findOneBy({ id: ticketId });
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    ticket.status = status;
    return await this.ticketRepository.save(ticket);
  }
}
