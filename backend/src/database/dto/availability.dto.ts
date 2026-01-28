import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from "class-validator";
import { DayOfWeekEnum } from "../entities/day-availability";
import { Type } from "class-transformer";

export class DayAvailabilityDto {
  @IsEnum(DayOfWeekEnum)
  @IsNotEmpty()
  day: DayOfWeekEnum;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsBoolean()
  @IsNotEmpty()
  isAvailable: boolean;
}

export class UpdateAvailabilityDto {
  @IsNumber()
  @IsNotEmpty()
  timeGap: number;

  @IsString()
  @IsNotEmpty()
  timezone: string;

  @IsNumber()
  @IsNotEmpty()
  minimumNotice: number;

  @IsNumber()
  @IsNotEmpty()
  bookingWindow: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayAvailabilityDto)
  days: DayAvailabilityDto[];
}
