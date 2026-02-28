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
import { Intent } from "./intent.entity";
import { ProviderType } from "./provider-task-link.entity";
import { BoardExternalLink } from "./board-external-link.entity";

@Entity({ name: "intent_external_links" })
@Index(["userId", "provider", "externalTaskId", "externalListId"], {
  unique: true,
})
export class IntentExternalLink {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", nullable: false })
  userId: string;

  @Column({ type: "uuid", nullable: false })
  intentId: string;

  @Column({ type: "uuid", nullable: true })
  boardLinkId?: string;

  @Column({ type: "enum", enum: ProviderType })
  provider: ProviderType;

  @Column({ type: "varchar", nullable: false })
  externalTaskId: string;

  @Column({ type: "varchar", nullable: false })
  externalListId: string;

  @Column({ type: "timestamp", nullable: true })
  lastSyncedAt?: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Intent, { onDelete: "CASCADE" })
  @JoinColumn({ name: "intentId" })
  intent: Intent;

  @ManyToOne(() => BoardExternalLink, (link) => link.intentLinks, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({ name: "boardLinkId" })
  boardLink?: BoardExternalLink;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
