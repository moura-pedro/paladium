import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  toolCallId?: string;
  toolName?: string;
}

export interface IConversation extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  messages: IMessage[];
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system', 'tool'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    toolCallId: {
      type: String,
    },
    toolName: {
      type: String,
    },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
    lastActive: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying active conversations
ConversationSchema.index({ userId: 1, lastActive: -1 });

// TTL index to auto-delete conversations older than 24 hours
ConversationSchema.index({ lastActive: 1 }, { expireAfterSeconds: 86400 });

// Prevent model recompilation in development
const Conversation: Model<IConversation> = 
  mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;

