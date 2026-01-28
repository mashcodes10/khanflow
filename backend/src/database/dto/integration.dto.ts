import { IsEnum, IsNotEmpty, IsArray, IsString } from "class-validator";
import { IntegrationAppTypeEnum } from "../entities/integration.entity";

export class AppTypeDTO {
  @IsEnum(IntegrationAppTypeEnum)
  @IsNotEmpty()
  appType: IntegrationAppTypeEnum;
}

export class SelectedCalendarsDTO {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
