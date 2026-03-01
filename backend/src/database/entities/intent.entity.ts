import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { IntentBoard } from "./intent-board.entity";

@Entity({ name: "intents" })
export class Intent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", nullable: false })
  title: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "uuid", nullable: false })
  intentBoardId: string;

  @Column({ type: "int", default: 0 })
  order: number; // For custom ordering within board

  @Column({ type: "timestamp", nullable: true })
  lastSuggestedAt?: Date; // Track when AI last suggested this intent

  @Column({ type: "timestamp", nullable: true })
  lastEngagedAt?: Date; // Track when user last engaged with this intent (accepted suggestion, viewed, etc.)

  @Column({ type: "timestamp", nullable: true })
  lastActivityAt?: Date; // Track last activity from any source (app, provider tasks, calendar events)

  @Column({ type: "int", default: 0 })
  suggestionCount: number; // How many times AI has suggested this

  @Column({ type: "int", default: 0 })
  acceptCount: number; // How many times user accepted suggestions from this intent

  @Column({ type: "int", default: 0 })
  ignoreCount: number; // How many times user ignored suggestions from this intent

  @Column({ type: "boolean", default: false })
  isExample: boolean; // Mark example intents created during onboarding

  @Column({ type: "timestamp", nullable: true })
  completedAt?: Date | null; // null = active, timestamp = completed

  @Column({ type: "varchar", length: 10, nullable: true })
  priority?: 'low' | 'medium' | 'high' | null;

  @Column({ type: "timestamp", nullable: true })
  dueDate?: Date | null;

  @Column({ type: "timestamp", nullable: true })
  weeklyFocusAt?: Date | null; // When set, intent is pinned to the weekly focus view

  @ManyToOne(() => IntentBoard, (intentBoard) => intentBoard.intents, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "intentBoardId" })
  intentBoard: IntentBoard;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


