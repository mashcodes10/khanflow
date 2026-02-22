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

export type ConflictType = "time_overlap" | "double_booking" | "adjacent" | "partial_overlap";
export type ConflictSeverity = "high" | "medium" | "low";
export type ConflictStatus = "pending" | "resolved" | "ignored";

@Entity({ name: "task_conflicts" })
export class TaskConflict {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "user_id" })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({
    type: "varchar",
    length: 255,
    name: "task_id",
    comment: "External task or event ID from provider",
  })
  taskId: string;

  @Column({
    type: "varchar",
    length: 255,
    name: "conflicting_event_id",
    comment: "External event ID that conflicts",
  })
  conflictingEventId: string;

  @Column({
    type: "varchar",
    length: 50,
    name: "conflict_type",
  })
  conflictType: ConflictType;

  @Column({
    type: "varchar",
    length: 20,
  })
  severity: ConflictSeverity;

  @Column({
    type: "varchar",
    length: 20,
    default: "pending",
  })
  status: ConflictStatus;

  @Column({
    type: "jsonb",
    nullable: true,
    comment: "Details about the conflict",
  })
  conflictDetails: {
    requestedStartTime?: string;
    requestedEndTime?: string;
    existingStartTime?: string;
    existingEndTime?: string;
    requestedTitle?: string;
    existingTitle?: string;
    overlapDurationMinutes?: number;
    [key: string]: any;
  } | null;

  @Column({
    type: "jsonb",
    nullable: true,
    comment: "How the conflict was resolved",
  })
  resolution: {
    resolutionType?: "reschedule" | "cancel" | "ignore" | "auto_adjust";
    newStartTime?: string;
    newEndTime?: string;
    alternativeSlotId?: string;
    userChoice?: string;
    [key: string]: any;
  } | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({
    type: "timestamp",
    name: "resolved_at",
    nullable: true,
  })
  resolvedAt: Date | null;
}
