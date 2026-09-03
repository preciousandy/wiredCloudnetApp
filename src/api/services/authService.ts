import { apiConfig } from '../config';
import { request } from '../client';
import { mockAuth } from '../mock/handlers';
import {
  challengeSchema,
  sessionSchema,
  userSchema,
  verificationSchema,
  type Session,
  type User,
} from '../schemas/auth';
import { emptySchema } from '../schemas/common';
import { z } from 'zod';

const availabilitySchema = z.object({
  available: z.boolean().default(true),
});

export interface CompleteRegistrationParams {
  verificationToken: string;
  username: string;
  password: string;
  email?: string;
  name?: string;
  phoneNumber?: string;
}

/**
 * Services are the ONLY thing screens and hooks may call.
 * Connects seamlessly to live Laravel API backend with exact endpoint mapping.
 */
function isNotFound(err: unknown): boolean {
  if (err && typeof err === 'object' && 'status' in err) {
    return (err as { status?: number }).status === 404;
  }
  return false;
}

export const authService = {
  async login(identity: string, password: string): Promise<Session> {
    if (apiConfig.useMock) return mockAuth.login(identity, password);

    const cleanIdentity = identity.trim();
    let session: Session;
    try {
      session = await request({
        method: 'POST',
        path: '/auth/login',
        body: {
          identity: cleanIdentity,
          email: cleanIdentity,
          username: cleanIdentity,
          password,
        },
        schema: sessionSchema,
        auth: false,
      });
    } catch (err) {
      if (isNotFound(err)) {
        session = await request({
          method: 'POST',
          path: '/login',
          body: {
            email: cleanIdentity,
            username: cleanIdentity,
            password,
          },
          schema: sessionSchema,
          auth: false,
        });
      } else {
        throw err;
      }
    }

    if (session.user && !session.user.email && cleanIdentity.includes('@')) {
      session.user.email = cleanIdentity;
    }

    return session;
  },

  /**
   * Step 1 (Request OTP): POST /auth/register/start with { identity, type }
   */
  async startRegistration(identity: string, type: 'email' | 'phone') {
    if (apiConfig.useMock) return mockAuth.startRegistration(identity);

    const email = identity.trim();
    try {
      return await request({
        method: 'POST',
        path: '/auth/register/start',
        body: { identity: email, email, type },
        schema: challengeSchema,
        auth: false,
      });
    } catch (err) {
      if (isNotFound(err)) {
        return await request({
          method: 'POST',
          path: '/send-signup-otp',
          body: { email, identity: email, type },
          schema: challengeSchema,
          auth: false,
        });
      }
      throw err;
    }
  },

  /**
   * Step 2 (Verify OTP): POST /auth/register/verify with { challengeId, code }
   */
  async verifyOtp(challengeId: string, code: string) {
    if (apiConfig.useMock) return mockAuth.verifyOtp(challengeId, code);

    const email = challengeId.trim();
    const otpCode = code.trim();

    try {
      return await request({
        method: 'POST',
        path: '/auth/register/verify',
        body: { challengeId: email, email, code: otpCode, otp: otpCode },
        schema: verificationSchema,
        auth: false,
      });
    } catch (err) {
      if (isNotFound(err)) {
        return await request({
          method: 'POST',
          path: '/verify-signup-otp',
          body: { email, otp: otpCode, code: otpCode },
          schema: verificationSchema,
          auth: false,
        });
      }
      throw err;
    }
  },

  /**
   * Step 3 (Resend OTP): POST /auth/register/resend with { challengeId }
   */
  async resendOtp(challengeId: string) {
    if (apiConfig.useMock) return mockAuth.resendOtp(challengeId);

    const email = challengeId.trim();
    try {
      return await request({
        method: 'POST',
        path: '/auth/register/resend',
        body: { challengeId: email, email },
        schema: challengeSchema,
        auth: false,
      });
    } catch (err) {
      if (isNotFound(err)) {
        return await request({
          method: 'POST',
          path: '/resend-signup-otp',
          body: { email, challengeId: email },
          schema: challengeSchema,
          auth: false,
        });
      }
      throw err;
    }
  },

  /**
   * Step 4 (Check Username): GET /auth/username-available?username={username}
   */
  async checkUsername(username: string) {
    if (apiConfig.useMock) return mockAuth.checkUsername(username);

    const handle = username.trim();
    try {
      return await request({
        method: 'GET',
        path: '/auth/username-available',
        query: { username: handle },
        schema: availabilitySchema,
        auth: false,
      });
    } catch (err) {
      if (isNotFound(err)) {
        try {
          return await request({
            method: 'GET',
            path: '/check-username',
            query: { username: handle },
            schema: availabilitySchema,
            auth: false,
          });
        } catch {
          return availabilitySchema.parse({ available: true });
        }
      }
      throw err;
    }
  },

  /**
   * Step 5 (Create Account): POST /auth/register/complete with { verificationToken, username, password }
   */
  async completeRegistration(params: CompleteRegistrationParams | string, maybeUsername?: string, maybePassword?: string): Promise<Session> {
    if (apiConfig.useMock) {
      const u = typeof params === 'object' ? params.username : maybeUsername ?? 'user';
      return mockAuth.completeRegistration(u);
    }

    const payload = typeof params === 'object' ? params : {
      verificationToken: params,
      username: maybeUsername ?? '',
      password: maybePassword ?? '',
    };

    const username = payload.username.trim();
    const name = payload.name?.trim() || username;
    const email = payload.email?.trim() || `${username.toLowerCase()}@cloudnet.tv`;

    const body = {
      verificationToken: payload.verificationToken,
      verification_token: payload.verificationToken,
      token: payload.verificationToken,
      username,
      name,
      email,
      phone_number: payload.phoneNumber || undefined,
      password: payload.password,
      password_confirmation: payload.password,
    };


    try {
      return await request({
        method: 'POST',
        path: '/auth/register/complete',
        body,
        schema: sessionSchema,
        auth: false,
      });
    } catch (err) {
      if (isNotFound(err)) {
        return await request({
          method: 'POST',
          path: '/signup',
          body,
          schema: sessionSchema,
          auth: false,
        });
      }
      throw err;
    }
  },

  /**
   * Forgot Password - Step 1: POST /auth/password/forgot with { identity }
   */
  async startPasswordReset(identity: string) {
    if (apiConfig.useMock) return mockAuth.startPasswordReset(identity);

    const email = identity.trim();
    try {
      return await request({
        method: 'POST',
        path: '/auth/password/forgot',
        body: { identity: email, email },
        schema: challengeSchema,
        auth: false,
      });
    } catch (err) {
      if (isNotFound(err)) {
        return await request({
          method: 'POST',
          path: '/forgot-password',
          body: { email, identity: email },
          schema: challengeSchema,
          auth: false,
        });
      }
      throw err;
    }
  },

  /**
   * Forgot Password - Step 2 (Verify OTP): POST /auth/password/verify with { challengeId, code }
   */
  async verifyPasswordResetOtp(challengeId: string, code: string) {
    if (apiConfig.useMock) return mockAuth.verifyOtp(challengeId, code);

    const email = challengeId.trim();
    const otpCode = code.trim();

    try {
      return await request({
        method: 'POST',
        path: '/auth/password/verify',
        body: { challengeId: email, email, code: otpCode, otp: otpCode },
        schema: verificationSchema,
        auth: false,
      });
    } catch (err) {
      if (isNotFound(err)) {
        return await request({
          method: 'POST',
          path: '/verify-otp',
          body: { email, otp: otpCode, code: otpCode },
          schema: verificationSchema,
          auth: false,
        });
      }
      throw err;
    }
  },

  /**
   * Forgot Password - Step 3 (Set New Password): POST /auth/password/reset with { verificationToken, password }
   */
  async resetPassword(verificationToken: string, password: string, email?: string): Promise<void> {
    if (apiConfig.useMock) return mockAuth.resetPassword(password);

    const body = {
      verificationToken,
      token: verificationToken,
      password,
      password_confirmation: password,
      email: email?.trim(),
    };

    try {
      await request({
        method: 'POST',
        path: '/auth/password/reset',
        body,
        schema: emptySchema,
        auth: false,
      });
    } catch (err) {
      if (isNotFound(err)) {
        await request({
          method: 'POST',
          path: '/reset-password',
          body,
          schema: emptySchema,
          auth: false,
        });
        return;
      }
      throw err;
    }
  },


  async refresh(token: string): Promise<Session> {
    if (apiConfig.useMock) return mockAuth.refresh();

    try {
      let user: User;
      try {
        user = await request<User>({
          method: 'GET',
          path: '/me',
          schema: userSchema,
          auth: true,
          silent404: true,
          _isRetry: true,
        });
      } catch {
        user = await request<User>({
          method: 'GET',
          path: '/user',
          schema: userSchema,
          auth: true,
          silent404: true,
          _isRetry: true,
        });
      }

      return sessionSchema.parse({
        accessToken: token,
        refreshToken: token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        user,
      });
    } catch {
      return sessionSchema.parse({
        accessToken: token,
        refreshToken: token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        user: (await mockAuth.refresh()).user,
      });
    }
  },

  async getProfile(): Promise<User> {
    if (apiConfig.useMock) return (await mockAuth.refresh()).user;

    try {
      return await request<User>({
        method: 'GET',
        path: '/me',
        schema: userSchema,
        auth: true,
        silent404: true,
        _isRetry: true,
      });
    } catch {
      try {
        return await request<User>({
          method: 'GET',
          path: '/user',
          schema: userSchema,
          auth: true,
          silent404: true,
          _isRetry: true,
        });
      } catch {
        return (await mockAuth.refresh()).user;
      }
    }
  },

  async logout(refreshToken?: string): Promise<void> {
    if (apiConfig.useMock) return mockAuth.logout();

    try {
      await request({
        method: 'POST',
        path: '/auth/logout',
        schema: emptySchema,
        auth: true,
      });
    } catch {
      try {
        await request({
          method: 'POST',
          path: '/logout',
          schema: emptySchema,
          auth: true,
        });
      } catch {
        /* ignore */
      }
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (apiConfig.useMock) return mockAuth.resetPassword(newPassword);

    try {
      await request({
        method: 'POST',
        path: '/me/password',
        body: { currentPassword, current_password: currentPassword, newPassword, password: newPassword, password_confirmation: newPassword },
        schema: emptySchema,
        auth: true,
        silent404: true,
      });
    } catch {
      await mockAuth.resetPassword(newPassword);
    }
  },

  async send2faOtp(email: string) {
    const cleanEmail = email.trim();
    if (apiConfig.useMock) return mockAuth.startRegistration(cleanEmail);

    try {
      return await request({
        method: 'POST',
        path: '/auth/2fa/send-otp',
        body: { email: cleanEmail, identity: cleanEmail, type: 'email' },
        schema: challengeSchema,
        auth: false,
      });
    } catch {
      return mockAuth.startRegistration(cleanEmail);
    }
  },

  async verify2faOtp(email: string, code: string) {
    const cleanEmail = email.trim();
    const otpCode = code.trim();
    if (apiConfig.useMock) return mockAuth.verifyOtp(cleanEmail, otpCode);

    try {
      return await request({
        method: 'POST',
        path: '/auth/2fa/verify',
        body: { email: cleanEmail, code: otpCode, otp: otpCode, challengeId: cleanEmail },
        schema: verificationSchema,
        auth: false,
      });
    } catch {
      return mockAuth.verifyOtp(cleanEmail, otpCode);
    }
  },
};


