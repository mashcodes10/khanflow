import { describe, it, expect, beforeEach } from "vitest";
import { getTestDataSource } from "../../helpers/db";
import { User } from "../../../src/database/entities/user.entity";
import { Availability } from "../../../src/database/entities/availability.entity";
import { DayAvailability, DayOfWeekEnum } from "../../../src/database/entities/day-availability";

describe("Availability Settings - Persistence", () => {
  beforeEach(async () => {
    const dataSource = await getTestDataSource();
    // Database is reset by global setup
  });

  it("should persist timezone setting", async () => {
    const dataSource = await getTestDataSource();
    const userRepo = dataSource.getRepository(User);
    const availabilityRepo = dataSource.getRepository(Availability);

    // Create user
    const user = userRepo.create({
      name: "Test User",
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });
    await userRepo.save(user);

    // Create availability with timezone
    const availability = availabilityRepo.create({
      user,
      timeGap: 30,
      timezone: "America/Los_Angeles",
      minimumNotice: 240,
      bookingWindow: 14,
      days: [],
    });
    await availabilityRepo.save(availability);

    // Read back
    const saved = await availabilityRepo.findOne({
      where: { id: availability.id },
    });

    expect(saved).toBeDefined();
    expect(saved?.timezone).toBe("America/Los_Angeles");
  });

  it("should persist minimumNotice setting", async () => {
    const dataSource = await getTestDataSource();
    const userRepo = dataSource.getRepository(User);
    const availabilityRepo = dataSource.getRepository(Availability);

    const user = userRepo.create({
      name: "Test User",
      username: "testuser2",
      email: "test2@example.com",
      password: "password123",
    });
    await userRepo.save(user);

    const availability = availabilityRepo.create({
      user,
      timeGap: 30,
      timezone: "America/New_York",
      minimumNotice: 1440, // 24 hours
      bookingWindow: 60,
      days: [],
    });
    await availabilityRepo.save(availability);

    const saved = await availabilityRepo.findOne({
      where: { id: availability.id },
    });

    expect(saved?.minimumNotice).toBe(1440);
  });

  it("should persist bookingWindow setting", async () => {
    const dataSource = await getTestDataSource();
    const userRepo = dataSource.getRepository(User);
    const availabilityRepo = dataSource.getRepository(Availability);

    const user = userRepo.create({
      name: "Test User",
      username: "testuser3",
      email: "test3@example.com",
      password: "password123",
    });
    await userRepo.save(user);

    const availability = availabilityRepo.create({
      user,
      timeGap: 30,
      timezone: "Europe/London",
      minimumNotice: 240,
      bookingWindow: 30, // 30 days
      days: [],
    });
    await availabilityRepo.save(availability);

    const saved = await availabilityRepo.findOne({
      where: { id: availability.id },
    });

    expect(saved?.bookingWindow).toBe(30);
  });

  it("should persist all settings together", async () => {
    const dataSource = await getTestDataSource();
    const userRepo = dataSource.getRepository(User);
    const availabilityRepo = dataSource.getRepository(Availability);
    const dayRepo = dataSource.getRepository(DayAvailability);

    const user = userRepo.create({
      name: "Test User",
      username: "testuser4",
      email: "test4@example.com",
      password: "password123",
    });
    await userRepo.save(user);

    // Create day availability
    const monday = dayRepo.create({
      day: DayOfWeekEnum.MONDAY,
      startTime: new Date("2025-01-01T09:00:00Z"),
      endTime: new Date("2025-01-01T17:00:00Z"),
      isAvailable: true,
    });

    const availability = availabilityRepo.create({
      user,
      timeGap: 60,
      timezone: "Asia/Tokyo",
      minimumNotice: 480, // 8 hours
      bookingWindow: 90, // 3 months
      days: [monday],
    });
    await availabilityRepo.save(availability);

    // Read back with relations
    const saved = await availabilityRepo.findOne({
      where: { id: availability.id },
      relations: ["days"],
    });

    expect(saved).toBeDefined();
    expect(saved?.timeGap).toBe(60);
    expect(saved?.timezone).toBe("Asia/Tokyo");
    expect(saved?.minimumNotice).toBe(480);
    expect(saved?.bookingWindow).toBe(90);
    expect(saved?.days).toHaveLength(1);
    expect(saved?.days[0].day).toBe(DayOfWeekEnum.MONDAY);
  });

  it("should update existing settings", async () => {
    const dataSource = await getTestDataSource();
    const userRepo = dataSource.getRepository(User);
    const availabilityRepo = dataSource.getRepository(Availability);

    const user = userRepo.create({
      name: "Test User",
      username: "testuser5",
      email: "test5@example.com",
      password: "password123",
    });
    await userRepo.save(user);

    const availability = availabilityRepo.create({
      user,
      timeGap: 30,
      timezone: "America/New_York",
      minimumNotice: 240,
      bookingWindow: 60,
      days: [],
    });
    await availabilityRepo.save(availability);

    // Update settings
    availability.timezone = "America/Los_Angeles";
    availability.minimumNotice = 1440;
    availability.bookingWindow = 30;
    await availabilityRepo.save(availability);

    const updated = await availabilityRepo.findOne({
      where: { id: availability.id },
    });

    expect(updated?.timezone).toBe("America/Los_Angeles");
    expect(updated?.minimumNotice).toBe(1440);
    expect(updated?.bookingWindow).toBe(30);
  });

  it("should use default values when not specified", async () => {
    const dataSource = await getTestDataSource();
    const userRepo = dataSource.getRepository(User);
    const availabilityRepo = dataSource.getRepository(Availability);

    const user = userRepo.create({
      name: "Test User",
      username: "testuser6",
      email: "test6@example.com",
      password: "password123",
    });
    await userRepo.save(user);

    // Create without specifying new fields
    const availability = availabilityRepo.create({
      user,
      timeGap: 30,
      days: [],
    });
    await availabilityRepo.save(availability);

    const saved = await availabilityRepo.findOne({
      where: { id: availability.id },
    });

    // Should use defaults from entity
    expect(saved?.timezone).toBe("America/New_York");
    expect(saved?.minimumNotice).toBe(240);
    expect(saved?.bookingWindow).toBe(60);
  });
});
