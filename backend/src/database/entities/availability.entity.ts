import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./user.entity";
import { DayAvailability } from "./day-availability";

@Entity()
export class Availability {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne(() => User, (user) => user.availability)
  user: User;

  @OneToMany(
    () => DayAvailability,
    (dayAvailability) => dayAvailability.availability,
    {
      cascade: true,
    }
  )
  days: DayAvailability[];

  @Column({ type: "int", default: 30 })
  timeGap: number;

  @Column({ type: "varchar", default: "America/New_York", nullable: true })
  timezone: string;

  @Column({ type: "int", default: 240, nullable: true })
  minimumNotice: number; // in minutes

  @Column({ type: "int", default: 60, nullable: true })
  bookingWindow: number; // in days

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
