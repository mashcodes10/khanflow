import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
} from "typeorm";
import { Conversation } from "./conversation.entity";

export type MessageRole = "user" | "assistant";

@Entity({ name: "conversation_messages" })
export class ConversationMessage {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "conversation_id" })
  conversationId: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "conversation_id" })
  conversation: Conversation;

  @Column({
    type: "varchar",
    length: 20,
  })
  role: MessageRole;

  @Column({
    type: "text",
  })
  content: string;

  @Column({
    type: "jsonb",
    nullable: true,
    name: "parsed_data",
    comment: "Structured data extracted from this message",
  })
  parsedData: {
    intent?: string;
    entities?: Record<string, any>;
    confidence?: number;
    [key: string]: any;
  } | null;

  @Column({
    type: "jsonb",
    nullable: true,
    comment: "Metadata about the message",
  })
  metadata: {
    audioFileName?: string;
    transcriptionConfidence?: number;
    processingTimeMs?: number;
    [key: string]: any;
  } | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
