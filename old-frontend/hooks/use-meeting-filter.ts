"use client";

import { useState } from "react";

export enum PeriodEnum {
  UPCOMING = "UPCOMING",
  PAST = "PAST",
  CANCELLED = "CANCELLED",
}

const useMeetingFilter = () => {
  const [period, setPeriod] = useState<PeriodEnum>(PeriodEnum.UPCOMING);
  
  return { period, setPeriod, PeriodEnum };
};

export default useMeetingFilter;