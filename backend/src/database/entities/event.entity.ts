import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { IntegrationAppTypeEnum } from "./integration.entity";
import { User } from "./user.entity";
import { Meeting } from "./meeting.entity";

export enum EventLocationEnumType {
  GOOGLE_MEET_AND_CALENDAR = IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
  ZOOM_MEETING = IntegrationAppTypeEnum.ZOOM_MEETING,
  OUTLOOK_CALENDAR = IntegrationAppTypeEnum.OUTLOOK_CALENDAR,
  MICROSOFT_TEAMS = IntegrationAppTypeEnum.MICROSOFT_TEAMS,
}

@Entity({ name: "events" })
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", nullable: false })
  title: string;

  @Column({ type: "varchar", nullable: true })
  description: string;

  @Column({ type: "int", default: 30 })
  duration: number;

  @Column({ type: "varchar", nullable: false })
  slug: string;

  @Column({ type: "boolean", default: false })
  isPrivate: boolean;

  @Column({ type: "enum", enum: EventLocationEnumType })
  locationType: EventLocationEnumType;

  @ManyToOne(() => User, (user) => user.events)
  user: User;

  @OneToMany(() => Meeting, (meeting) => meeting.event)
  meetings: Meeting[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
