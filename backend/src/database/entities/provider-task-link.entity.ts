import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { AcceptedAction } from "./accepted-action.entity";
import { Intent } from "./intent.entity";

export enum ProviderTaskStatus {
  OPEN = "open",
  COMPLETED = "completed",
  DELETED = "deleted",
}

export enum ProviderType {
  GOOGLE = "google",
  MICROSOFT = "microsoft",
}

@Entity({ name: "provider_task_links" })
@Index(["userId", "acceptedActionId", "optionIndex"], { unique: true })
export class ProviderTaskLink {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", nullable: false })
  userId: string;

  @Column({ type: "uuid", nullable: false })
  acceptedActionId: string;

  @Column({ type: "uuid", nullable: false })
  intentId: string;

  @Column({ type: "enum", enum: ProviderType })
  provider: ProviderType;

  @Column({ type: "varchar" })
  providerTaskId: string;

  @Column({ type: "varchar" })
  providerListId: string;

  @Column({ type: "enum", enum: ProviderTaskStatus, default: ProviderTaskStatus.OPEN })
  status: ProviderTaskStatus;

  @Column({ type: "int", nullable: true })
  optionIndex: number; // For idempotency: which option this link corresponds to

  @Column({ type: "timestamp", nullable: true })
  providerUpdatedAt?: Date;

  @Column({ type: "timestamp", nullable: true })
  completedAt?: Date;

  @ManyToOne(() => User, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => AcceptedAction, (action) => action.providerTaskLinks, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "acceptedActionId" })
  acceptedAction: AcceptedAction;

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
