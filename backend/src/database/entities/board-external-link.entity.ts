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
import { ProviderType } from "./provider-task-link.entity";
import { IntentExternalLink } from "./intent-external-link.entity";

export type SyncDirection = "import_only" | "export_only" | "both";

@Entity({ name: "board_external_links" })
export class BoardExternalLink {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", nullable: false })
  userId: string;

  @Column({ type: "uuid", nullable: false })
  boardId: string;

  @Column({ type: "enum", enum: ProviderType })
  provider: ProviderType;

  @Column({ type: "varchar", nullable: false })
  externalListId: string;

  @Column({ type: "varchar", nullable: false })
  externalListName: string;

  @Column({
    type: "varchar",
    default: "both",
  })
  syncDirection: SyncDirection;

  @Column({ type: "timestamp", nullable: true })
  lastSyncedAt?: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => IntentBoard, { onDelete: "CASCADE" })
  @JoinColumn({ name: "boardId" })
  board: IntentBoard;

  @OneToMany(() => IntentExternalLink, (link) => link.boardLink)
  intentLinks: IntentExternalLink[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
