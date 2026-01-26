import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Event } from "./event.entity";
import { IntegrationAppTypeEnum } from "./integration.entity";

export enum MeetingStatus {
  SCHEDULED = "SCHEDULED",
  CANCELLED = "CANCELLED",
}

@Entity({ name: "meetings" })
export class Meeting {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.meetings)
  user: User;

  @ManyToOne(() => Event, (event) => event.meetings)
  event: Event;

  @Column({ type: "varchar" })
  guestName: string;

  @Column({ type: "varchar" })
  guestEmail: string;

  @Column({ type: "varchar", nullable: true })
  additionalInfo: string;

  @Column({ type: "timestamptz" })
  startTime: Date;

  @Column({ type: "timestamptz" })
  endTime: Date;

  @Column({ type: "varchar" })
  meetLink: string;

  @Column({ type: "varchar" })
  calendarEventId: string;

  @Column({ type: "varchar" })
  calendarAppType: string;

  @Column({
    type: "enum",
    enum: MeetingStatus,
    default: MeetingStatus.SCHEDULED,
  })
  status: MeetingStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
