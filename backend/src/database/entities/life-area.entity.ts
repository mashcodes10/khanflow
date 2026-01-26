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
import { IntentBoard } from "./intent-board.entity";

@Entity({ name: "life_areas" })
export class LifeArea {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ nullable: false })
  userId: string;

  @Column({ type: "int", default: 0 })
  order: number; // For custom ordering

  @Column({ type: "varchar", length: 50, nullable: true })
  icon?: string; // Optional icon identifier (e.g., "health", "career", "relationships")

  @ManyToOne(() => User, (user) => user.lifeAreas, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user: User;

  @OneToMany(() => IntentBoard, (intentBoard) => intentBoard.lifeArea, {
    cascade: true,
  })
  intentBoards: IntentBoard[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


