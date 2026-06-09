export interface CreateTicketDto {
  title: string;
  description: string;
  category: string;
}

export interface UpdateTicketStatusDto {
  status: string;
}
