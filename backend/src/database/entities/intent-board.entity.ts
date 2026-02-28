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
import { LifeArea } from "./life-area.entity";
import { Intent } from "./intent.entity";
import { BoardExternalLink } from "./board-external-link.entity";

@Entity({ name: "intent_boards" })
export class IntentBoard {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", nullable: false })
  name: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "uuid", nullable: false })
  lifeAreaId: string;

  @Column({ type: "int", default: 0 })
  order: number; // For custom ordering within life area

  @ManyToOne(() => LifeArea, (lifeArea) => lifeArea.intentBoards, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "lifeAreaId" })
  lifeArea: LifeArea;

  @OneToMany(() => Intent, (intent) => intent.intentBoard, {
    cascade: true,
  })
  intents: Intent[];

  @OneToMany(() => BoardExternalLink, (link) => link.board)
  boardExternalLinks: BoardExternalLink[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


