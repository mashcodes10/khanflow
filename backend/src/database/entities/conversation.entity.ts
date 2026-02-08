import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { ConversationMessage } from "./conversation-message.entity";

export type ConversationStatus = "active" | "completed" | "abandoned";
export type ConversationStep = "initial" | "clarifying" | "confirming" | "executing";

@Entity({ name: "conversations" })
export class Conversation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "user_id" })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({
    type: "varchar",
    length: 20,
    default: "active",
  })
  status: ConversationStatus;

  @Column({
    type: "varchar",
    length: 20,
    default: "initial",
  })
  currentStep: ConversationStep;

  @Column({
    type: "jsonb",
    nullable: true,
    comment: "Accumulated extracted data from conversation",
  })
  extractedData: {
    intent?: string;
    taskTitle?: string;
    taskDescription?: string;
    dateTime?: string;
    recurrence?: {
      frequency: string;
      interval: number;
      byDay?: string[];
      until?: string;
    };
    priority?: string;
    lifeAreaName?: string;
    intentBoardName?: string;
    [key: string]: any;
  } | null;

  @Column({
    type: "jsonb",
    nullable: true,
    comment: "List of fields still missing or needing clarification",
  })
  pendingFields: string[] | null;

  @Column({
    type: "jsonb",
    nullable: true,
    comment: "Additional context for AI processing",
  })
  context: {
    userTimezone?: string;
    preferredTaskApp?: string;
    preferredCalendarApp?: string;
    [key: string]: any;
  } | null;

  @OneToMany(() => ConversationMessage, (message) => message.conversation, {
    cascade: true,
  })
  messages: ConversationMessage[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({
    type: "timestamp",
    name: "last_activity_at",
    nullable: true,
  })
  lastActivityAt: Date | null;

  @Column({
    type: "timestamp",
    name: "completed_at",
    nullable: true,
  })
  completedAt: Date | null;

  @Column({
    type: "timestamp",
    name: "timeout_at",
    nullable: true,
    comment: "When conversation expires due to inactivity",
  })
  timeoutAt: Date | null;
}
