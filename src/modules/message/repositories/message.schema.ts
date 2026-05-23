import mongoose, { Schema } from 'mongoose';

export interface IChatMessage {
  _id: string; // Will store the SQL Message ID (bigint string)
  channelId: string;
  senderId: string;
  content: string;
  replyToId: string | null;
  attachments: Record<string, unknown>[];
  createdAt: Date;
  editedAt: Date | null;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    _id: { type: String, required: true },
    channelId: { type: String, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    replyToId: { type: String, default: null, index: true },
    attachments: { type: [Schema.Types.Mixed], default: [] } as any,
    createdAt: { type: Date, default: Date.now, index: true },
    editedAt: { type: Date, default: null },
  },
  {
    _id: false, // We supply our own custom string ID from MySQL
    versionKey: false,
    timestamps: false,
  }
);

// Compound index for chronological querying of channel history
ChatMessageSchema.index({ channelId: 1, createdAt: -1 });

export const ChatMessageModel = mongoose.model<IChatMessage>(
  'ChatMessage',
  ChatMessageSchema,
  'chat_messages'
);
