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
import { AcceptedAction } from "./accepted-action.entity";
import { Intent } from "./intent.entity";

@Entity({ name: "calendar_links" })
export class CalendarLink {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", nullable: false })
  userId: string;

  @Column({ type: "uuid", nullable: false })
  acceptedActionId: string;

  @Column({ type: "uuid", nullable: false })
  intentId: string;

  @Column({ type: "varchar" })
  providerEventId: string;

  @Column({ type: "timestamp" })
  startAt: Date;

  @Column({ type: "timestamp" })
  endAt: Date;

  @Column({ type: "varchar", length: 50, nullable: true })
  provider?: string; // "google" | "microsoft"

  @Column({ type: "timestamp", nullable: true })
  providerUpdatedAt?: Date;

  @ManyToOne(() => User, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => AcceptedAction, (action) => action.calendarLinks, {
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
