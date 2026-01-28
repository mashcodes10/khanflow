import { v4 as uuidv4 } from "uuid";
import { AppDataSource } from "../config/database.config";
import { LoginDto, RegisterDto } from "../database/dto/auth.dto";
import { User } from "../database/entities/user.entity";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../utils/app-error";
import { Availability } from "../database/entities/availability.entity";
import {
  DayAvailability,
  DayOfWeekEnum,
} from "../database/entities/day-availability";
import { signJwtToken } from "../utils/jwt";
import { OAuth2Client } from "google-auth-library";
import * as bcrypt from "bcrypt";

export const registerService = async (registerDto: RegisterDto) => {
  const userRepository = AppDataSource.getRepository(User);
  const availabilityRepository = AppDataSource.getRepository(Availability);
  const dayAvailabilityRepository =
    AppDataSource.getRepository(DayAvailability);

  const existingUser = await userRepository.findOne({
    where: { email: registerDto.email },
  });

  if (existingUser) {
    throw new BadRequestException("User already exists");
  }

  const username = await generateUsername(registerDto.name);
  const user = userRepository.create({
    ...registerDto,
    username,
  });

  const availability = availabilityRepository.create({
    timeGap: 30,
    days: Object.values(DayOfWeekEnum).map((day) => {
      return dayAvailabilityRepository.create({
        day: day,
        startTime: new Date(`2025-03-01T09:00:00Z`), //9:00
        endTime: new Date(`2025-03-01T17:00:00Z`), //5:00pm
        isAvailable:
          day !== DayOfWeekEnum.SUNDAY && day !== DayOfWeekEnum.SATURDAY,
      });
    }),
  });

  user.availability = availability;

  await userRepository.save(user);

  return { user: user.omitPassword() };
};

export const loginService = async (loginDto: LoginDto) => {
  const userRepository = AppDataSource.getRepository(User);

  const user = await userRepository.findOne({
    where: { email: loginDto.email },
  });

  if (!user) {
    throw new NotFoundException("User not found");
  }

  const isPasswordValid = await user.comparePassword(loginDto.password);
  if (!isPasswordValid) {
    throw new UnauthorizedException("Invalid email/password");
  }

  const { token, expiresAt } = signJwtToken({ userId: user.id });

  return {
    user: user.omitPassword(),
    accessToken: token,
    expiresAt,
  };
};

export const googleLoginService = async (idToken: string) => {
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new BadRequestException("Invalid Google token");
  }

  const userRepository = AppDataSource.getRepository(User);

  let user = await userRepository.findOne({ where: { email: payload.email } });
  const googleImageUrl = payload.picture || null;

  // Create a user if not exists
  if (!user) {
    const username = await generateUsername(payload.name || payload.email);
    const randomPassword = await bcrypt.hash(uuidv4(), 10);
    // default availability
    const availability = AppDataSource.getRepository(Availability).create({
      timeGap: 30,
      days: Object.values(DayOfWeekEnum).map((day) => {
        return AppDataSource.getRepository(DayAvailability).create({
          day,
          startTime: new Date(`2025-03-01T09:00:00Z`),
          endTime: new Date(`2025-03-01T17:00:00Z`),
          isAvailable: day !== DayOfWeekEnum.SUNDAY && day !== DayOfWeekEnum.SATURDAY,
        });
      }),
    });

    const newUserData: Partial<User> = {
      email: payload.email,
      name: payload.name || "Google User",
      username,
      password: randomPassword,
      availability,
    };
    if (googleImageUrl) {
      newUserData.imageUrl = googleImageUrl;
    }

    user = AppDataSource.getRepository(User).create(newUserData);

    await AppDataSource.getRepository(User).save(user);
  } else if (googleImageUrl) {
    // IMPORTANT: use repository.update to avoid re-hashing password via entity hooks
    if (user.imageUrl !== googleImageUrl) {
      await userRepository.update({ id: user.id }, { imageUrl: googleImageUrl });
      user.imageUrl = googleImageUrl;
    }
  }

  const { token, expiresAt } = signJwtToken({ userId: user.id });

  return {
    user: user.omitPassword(),
    accessToken: token,
    expiresAt,
  };
};

async function generateUsername(name: string): Promise<string> {
  const cleanName = name.replace(/\s+/g, "").toLowerCase();
  const baseUsername = cleanName;

  const uuidSuffix = uuidv4().replace(/\s+/g, "").slice(0, 4);
  const userRepository = AppDataSource.getRepository(User);

  let username = `${baseUsername}${uuidSuffix}`;
  let existingUser = await userRepository.findOne({
    where: { username },
  });

  while (existingUser) {
    username = `${baseUsername}${uuidv4().replace(/\s+/g, "").slice(0, 4)}`;
    existingUser = await userRepository.findOne({
      where: { username },
    });
  }

  return username;
}

export const microsoftLoginService = async (accessToken: string) => {
  // Fetch user info from Microsoft Graph API
  const response = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new BadRequestException("Invalid Microsoft token");
  }

  const profile = await response.json();
  if (!profile.mail && !profile.userPrincipalName) {
    throw new BadRequestException("Microsoft profile missing email");
  }

  const email = profile.mail || profile.userPrincipalName;
  const userRepository = AppDataSource.getRepository(User);

  // Try to fetch a small profile photo from Microsoft Graph.
  // We do NOT persist this to DB (user.imageUrl is varchar) — we just return it so the frontend
  // can store it in localStorage and display it in the navbar.
  let microsoftImageUrl: string | null = null;
  try {
    const photoResponse = await fetch(
      "https://graph.microsoft.com/v1.0/me/photos/48x48/$value",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    if (photoResponse.ok) {
      const arrayBuffer = await photoResponse.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const contentType =
        photoResponse.headers.get("content-type") || "image/jpeg";
      microsoftImageUrl = `data:${contentType};base64,${base64}`;
    }
  } catch {
    // ignore photo errors (e.g., no photo available)
  }

  let user = await userRepository.findOne({ where: { email } });

  // Create a user if not exists
  if (!user) {
    const username = await generateUsername(profile.displayName || email);
    const randomPassword = await bcrypt.hash(uuidv4(), 10);
    // default availability
    const availability = AppDataSource.getRepository(Availability).create({
      timeGap: 30,
      days: Object.values(DayOfWeekEnum).map((day) => {
        return AppDataSource.getRepository(DayAvailability).create({
          day,
          startTime: new Date(`2025-03-01T09:00:00Z`),
          endTime: new Date(`2025-03-01T17:00:00Z`),
          isAvailable: day !== DayOfWeekEnum.SUNDAY && day !== DayOfWeekEnum.SATURDAY,
        });
      }),
    });

    const newUserData: Partial<User> = {
      email,
      name: profile.displayName || "Microsoft User",
      username,
      password: randomPassword,
      availability,
    };
    if (microsoftImageUrl) {
      newUserData.imageUrl = microsoftImageUrl;
    }

    user = AppDataSource.getRepository(User).create(newUserData);

    await AppDataSource.getRepository(User).save(user);
  }

  if (microsoftImageUrl) {
    user.imageUrl = microsoftImageUrl;
  }

  const { token, expiresAt } = signJwtToken({ userId: user.id });

  return {
    user: user.omitPassword(),
    accessToken: token,
    expiresAt,
  };
}
