import { Request, Response, NextFunction } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { LoginDto, RegisterDto } from "../database/dto/auth.dto";
import { asyncHandlerAndValidation } from "../middlewares/withValidation.middleware";
import { loginService, registerService, googleLoginService, microsoftLoginService } from "../services/auth.service";
import { asyncHandler } from "../middlewares/asyncHandler.middeware";

//withValidation(RegisterDto, "body")();

export const registerController = asyncHandlerAndValidation(
  RegisterDto,
  "body",
  async (req: Request, res: Response, registerDTO) => {
    const { user } = await registerService(registerDTO);

    return res.status(HTTPSTATUS.CREATED).json({
      message: "User created successfully",
      user,
    });
  }
);

export const loginController = asyncHandlerAndValidation(
  LoginDto,
  "body",
  async (req: Request, res: Response, loginDto) => {
    const { user, accessToken, expiresAt } = await loginService(loginDto);
    return res.status(HTTPSTATUS.CREATED).json({
      message: "User logged in successfully",
      user,
      accessToken,
      expiresAt,
    });
  }
);

export const googleLoginController = asyncHandler(
  async (req: Request, res: Response) => {
    const { idToken } = req.body as { idToken: string };
    if (!idToken) {
      return res.status(400).json({ message: "idToken is required" });
    }

    const { user, accessToken, expiresAt } = await googleLoginService(idToken);

    res.status(HTTPSTATUS.CREATED).json({
      message: "User logged in with Google successfully",
      user,
      accessToken,
      expiresAt,
    });
  }
);

export const microsoftLoginController = asyncHandler(
  async (req: Request, res: Response) => {
    const { code, redirectUri } = req.body as { code?: string; accessToken?: string; redirectUri?: string };
    
    let accessToken: string;
    
    // If code is provided, exchange it for access token
    if (code) {
      const { MS_OAUTH_CONFIG } = await import("../config/microsoft.config");
      const { config } = await import("../config/app.config");
      
      // Use the redirect URI from request (frontend callback) or fallback to config
      // For sign-in, the redirect URI should be the frontend callback URL
      const tokenRedirectUri = redirectUri || `${config.FRONTEND_ORIGIN}/auth/microsoft/callback`;
      
      const params = new URLSearchParams();
      params.append("grant_type", "authorization_code");
      params.append("code", code);
      params.append("redirect_uri", tokenRedirectUri);
      params.append("client_id", MS_OAUTH_CONFIG.clientId);
      params.append("client_secret", MS_OAUTH_CONFIG.clientSecret);

      const tokenResponse = await fetch(MS_OAUTH_CONFIG.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Microsoft token exchange error:', errorText);
        return res.status(400).json({ 
          message: "Failed to exchange Microsoft token",
          error: errorText 
        });
      }

      const tokens = await tokenResponse.json();
      accessToken = tokens.access_token;
    } else if (req.body.accessToken) {
      accessToken = req.body.accessToken;
    } else {
      return res.status(400).json({ message: "code or accessToken is required" });
    }

    const { user, accessToken: jwtToken, expiresAt } = await microsoftLoginService(accessToken);

    res.status(HTTPSTATUS.CREATED).json({
      message: "User logged in with Microsoft successfully",
      user,
      accessToken: jwtToken,
      expiresAt,
    });
  }
);
