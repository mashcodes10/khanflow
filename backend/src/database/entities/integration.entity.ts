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

export enum IntegrationProviderEnum {
  GOOGLE = "GOOGLE",
  ZOOM = "ZOOM",
  MICROSOFT = "MICROSOFT",
}

export enum IntegrationAppTypeEnum {
  GOOGLE_MEET_AND_CALENDAR = "GOOGLE_MEET_AND_CALENDAR",
  GOOGLE_TASKS = "GOOGLE_TASKS",
  ZOOM_MEETING = "ZOOM_MEETING",
  OUTLOOK_CALENDAR = "OUTLOOK_CALENDAR",
  MICROSOFT_TEAMS = "MICROSOFT_TEAMS",
  MICROSOFT_TODO = "MICROSOFT_TODO",
}

export enum IntegrationCategoryEnum {
  CALENDAR_AND_VIDEO_CONFERENCING = "CALENDAR_AND_VIDEO_CONFERENCING",
  VIDEO_CONFERENCING = "VIDEO_CONFERENCING",
  CALENDAR = "CALENDAR",
  TASKS = "TASKS",
}

interface GoogleMeetAndCalendarMetadata {
  scope: string;
  token_type: string;
  /**
   * Calendar IDs (e.g. "primary" or "abcdefg@group.calendar.google.com") the user has
   * chosen to include when checking for conflicts. If undefined, we assume the
   * default ["primary"].
   */
  selectedCalendarIds?: string[];
  /**
   * Calendar routing preferences for voice assistant.
   * Set when user connects both Google Calendar and Outlook Calendar.
   */
  calendarPreferences?: {
    workCalendarAppType: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR | IntegrationAppTypeEnum.OUTLOOK_CALENDAR;
    personalCalendarAppType: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR | IntegrationAppTypeEnum.OUTLOOK_CALENDAR;
    defaultCalendarAppType: IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR | IntegrationAppTypeEnum.OUTLOOK_CALENDAR;
  };
}

interface ZoomMetadata {}

type IntegrationMetadata = GoogleMeetAndCalendarMetadata | ZoomMetadata;

@Entity({ name: "integrations" })
export class Integration {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: IntegrationProviderEnum })
  provider: IntegrationProviderEnum;

  @Column({ type: "enum", enum: IntegrationCategoryEnum })
  category: IntegrationCategoryEnum;

  @Column({ type: "enum", enum: IntegrationAppTypeEnum })
  app_type: IntegrationAppTypeEnum;

  @Column({ type: "varchar" })
  access_token: string;

  @Column({ type: "varchar", nullable: true })
  refresh_token: string;

  @Column({ type: "bigint", nullable: true })
  expiry_date: number | null;

  @Column({ type: "json" })
  metadata: IntegrationMetadata;

  @Column({ type: "boolean", default: true })
  isConnected: boolean;

  @Column({ type: "uuid", nullable: false })
  userId: string;

  @ManyToOne(() => User, (user) => user.integrations)
  @JoinColumn({ name: "userId" })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
