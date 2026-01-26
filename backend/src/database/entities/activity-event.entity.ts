import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Intent } from "./intent.entity";

export enum ActivityEventType {
  SUGGESTION_ACCEPTED = "suggestion_accepted",
  SUGGESTION_DISMISSED = "suggestion_dismissed",
  SUGGESTION_SNOOZED = "suggestion_snoozed",
  TASK_CREATED = "task_created",
  TASK_COMPLETED = "task_completed",
  CALENDAR_EVENT_CREATED = "calendar_event_created",
  INTENT_UPDATED = "intent_updated",
}

@Entity({ name: "activity_events" })
@Index(["userId", "intentId", "createdAt"])
export class ActivityEvent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", nullable: false })
  userId: string;

  @Column({ type: "uuid", nullable: true })
  intentId: string;

  @Column({ type: "enum", enum: ActivityEventType })
  eventType: ActivityEventType;

  @Column({ type: "json", nullable: true })
  metadata?: {
    suggestionId?: string;
    acceptedActionId?: string;
    providerTaskId?: string;
    providerEventId?: string;
    [key: string]: any;
  };

  @ManyToOne(() => User, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Intent, {
    onDelete: "CASCADE",
    nullable: true,
  })
  @JoinColumn({ name: "intentId" })
  intent: Intent | null;

  @CreateDateColumn()
  createdAt: Date;
}
