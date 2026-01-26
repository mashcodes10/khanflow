import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Intent } from "./intent.entity";

export enum SuggestionStatus {
  PENDING = "pending", // Created but not shown yet
  SHOWN = "shown", // Shown to user
  ACCEPTED = "accepted", // User accepted and task/event created
  SNOOZED = "snoozed", // User snoozed (show again later)
  IGNORED = "ignored", // User dismissed/ignored
}

@Entity({ name: "suggestions" })
export class Suggestion {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", nullable: false })
  userId: string;

  @Column({ type: "uuid", nullable: false })
  intentId: string;

  @Column({ type: "text" })
  naturalLanguagePhrase: string; // Natural language suggestion text

  @Column({ type: "text" })
  reason: string; // Why this suggestion (neglect, balance, opportunity)

  @Column({ type: "enum", enum: SuggestionStatus, default: SuggestionStatus.PENDING })
  status: SuggestionStatus;

  @Column({ type: "varchar", length: 50 })
  suggestedAction: "create_task" | "create_calendar_event" | "both";

  @Column({ type: "json", nullable: true })
  suggestedDetails?: {
    taskTitle?: string;
    eventTitle?: string;
    dueDate?: string;
    eventDateTime?: string;
    duration?: number;
  };

  @Column({ type: "varchar", length: 20 })
  priority: "low" | "medium" | "high";

  @Column({ type: "varchar", length: 50 })
  heuristicType: "neglect" | "balance" | "opportunity" | "reinforcement";

  @Column({ type: "json", nullable: true })
  aiPayload?: {
    title: string;
    reason: string;
    priority: "low" | "medium" | "high";
    recommendedActionType: "task" | "reminder" | "plan";
    options: Array<{
      label: string;
      type: "task" | "reminder" | "plan";
      details: Record<string, any>;
      estimatedEffortMin: number;
    }>;
    defaultOptionIndex: number;
    confidence: number;
  };

  @Column({ type: "timestamp", nullable: true })
  shownAt?: Date; // When suggestion was first shown to user

  @Column({ type: "timestamp", nullable: true })
  actedAt?: Date; // When user acted on this suggestion (accept/dismiss/snooze)

  @Column({ type: "timestamp", nullable: true })
  snoozedUntil?: Date; // If snoozed, when to show again

  @Column({ type: "int", default: 0 })
  ignoreCount: number; // How many times user has ignored this intent

  @Column({ type: "int", default: 0 })
  acceptCount: number; // How many times user has accepted suggestions from this intent

  @ManyToOne(() => User, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Intent, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "intentId" })
  intent: Intent;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


