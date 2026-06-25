import type { CookieOptions } from 'express';

export type SessionCookieParams = {
  name: string;
  value: string;
  options: CookieOptions;
};

type BuildSessionCookieInput = {
  token: string;
  cookieName: string;
  ttlSeconds: number;
};

export function buildSessionCookie(
  input: BuildSessionCookieInput,
): SessionCookieParams {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    name: input.cookieName,
    value: input.token,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: isProduction,
      maxAge: input.ttlSeconds * 1000,
    },
  };
}
