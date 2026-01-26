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

  @Column({ nullable: false })
  title: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ nullable: false })
  intentBoardId: string;

  @Column({ type: "int", default: 0 })
  order: number; // For custom ordering within board

  @Column({ type: "timestamp", nullable: true })
  lastSuggestedAt?: Date; // Track when AI last suggested this intent

  @Column({ type: "timestamp", nullable: true })
  lastEngagedAt?: Date; // Track when user last engaged with this intent (accepted suggestion, viewed, etc.)

  @Column({ type: "int", default: 0 })
  suggestionCount: number; // How many times AI has suggested this

  @Column({ type: "int", default: 0 })
  acceptCount: number; // How many times user accepted suggestions from this intent

  @Column({ type: "int", default: 0 })
  ignoreCount: number; // How many times user ignored suggestions from this intent

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


