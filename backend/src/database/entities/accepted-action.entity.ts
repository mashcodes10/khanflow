import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Suggestion } from "./suggestion.entity";
import { Intent } from "./intent.entity";
import { ProviderTaskLink } from "./provider-task-link.entity";
import { CalendarLink } from "./calendar-link.entity";

export enum AcceptedActionType {
  TASK = "task",
  REMINDER = "reminder",
  PLAN = "plan",
}

export enum AcceptedActionStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

@Entity({ name: "accepted_actions" })
export class AcceptedAction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", nullable: false })
  userId: string;

  @Column({ type: "uuid", nullable: false })
  suggestionId: string;

  @Column({ type: "uuid", nullable: false })
  intentId: string;

  @Column({ type: "enum", enum: AcceptedActionType })
  type: AcceptedActionType;

  @Column({ type: "enum", enum: AcceptedActionStatus, default: AcceptedActionStatus.PENDING })
  status: AcceptedActionStatus;

  @Column({ type: "int", nullable: true })
  optionIndex: number; // Which option from the suggestion was selected

  @Column({ type: "json", nullable: true })
  metadata?: {
    taskTitle?: string;
    estimatedEffortMin?: number;
    scheduledAt?: string;
    [key: string]: any;
  };

  @ManyToOne(() => User, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Suggestion, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "suggestionId" })
  suggestion: Suggestion;

  @ManyToOne(() => Intent, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "intentId" })
  intent: Intent;

  @OneToMany(() => ProviderTaskLink, (link) => link.acceptedAction, {
    cascade: true,
  })
  providerTaskLinks: ProviderTaskLink[];

  @OneToMany(() => CalendarLink, (link) => link.acceptedAction, {
    cascade: true,
  })
  calendarLinks: CalendarLink[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
