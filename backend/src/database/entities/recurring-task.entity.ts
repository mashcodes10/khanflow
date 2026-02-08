import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";

export type RecurringTaskStatus = "active" | "paused" | "completed" | "cancelled";

@Entity({ name: "recurring_tasks" })
export class RecurringTask {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "user_id" })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({
    type: "jsonb",
    name: "task_template",
    comment: "Template for creating task instances",
  })
  taskTemplate: {
    title: string;
    description?: string;
    duration?: number;
    priority?: string;
    category?: string;
    provider?: "GOOGLE_TASKS" | "MICROSOFT_TODO";
    taskListId?: string;
    [key: string]: any;
  };

  @Column({
    type: "varchar",
    length: 255,
    name: "recurrence_rule",
    comment: "iCal RRULE format for recurrence pattern",
  })
  recurrenceRule: string;

  @Column({
    type: "date",
    name: "start_date",
  })
  startDate: Date;

  @Column({
    type: "date",
    name: "end_date",
    nullable: true,
  })
  endDate: Date | null;

  @Column({
    type: "varchar",
    length: 20,
    default: "active",
  })
  status: RecurringTaskStatus;

  @Column({
    type: "jsonb",
    nullable: true,
    comment: "Provider-specific IDs for created instances",
  })
  instanceIds: {
    date: string;
    taskId: string;
    eventId?: string;
    provider: string;
  }[] | null;

  @Column({
    type: "jsonb",
    nullable: true,
    comment: "Dates to skip (exceptions)",
  })
  exceptionDates: string[] | null;

  @Column({
    type: "jsonb",
    nullable: true,
    comment: "Additional metadata",
  })
  metadata: {
    totalOccurrences?: number;
    completedOccurrences?: number;
    skippedOccurrences?: number;
    conflictStrategy?: "ask" | "skip" | "auto_adjust";
    [key: string]: any;
  } | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({
    type: "timestamp",
    name: "last_occurrence_created_at",
    nullable: true,
    comment: "When the last task instance was created",
  })
  lastOccurrenceCreatedAt: Date | null;
}
