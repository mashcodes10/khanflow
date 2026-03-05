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
import { IntentBoard } from "./intent-board.entity";

@Entity({ name: "calendar_event_board_links" })
export class CalendarEventBoardLink {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", nullable: false })
  userId: string;

  @Column({ type: "uuid", nullable: false })
  boardId: string;

  @Column({ type: "varchar", nullable: false })
  provider: string; // 'google' | 'microsoft'

  @Column({ type: "varchar", nullable: false })
  eventId: string; // specific event ID or recurring event ID

  @Column({ type: "varchar", nullable: true })
  recurringEventId?: string; // populated when linking to a recurring series

  @Column({ type: "varchar", nullable: false })
  eventTitle: string; // cached so we can display without re-fetching

  @Column({ type: "boolean", default: false })
  isRecurring: boolean; // if true, applies to all instances of the recurring series

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => IntentBoard, { onDelete: "CASCADE", eager: true })
  @JoinColumn({ name: "boardId" })
  board: IntentBoard;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
