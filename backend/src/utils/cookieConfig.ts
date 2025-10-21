import { CookieOptions } from 'express';
import config from '../config';

/**
 * Get secure cookie configuration based on environment
 */
export function getSecureCookieOptions(): CookieOptions {
  const isProduction = config.server.env === 'production';
  const httpsEnabled = config.server.httpsEnabled;

  return {
    httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
    secure: httpsEnabled || isProduction, // Only send cookie over HTTPS
    sameSite: 'strict', // Prevents CSRF attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
    ...(isProduction && {
      domain: process.env.COOKIE_DOMAIN, // Set domain for production
    }),
  };
}

/**
 * Get access token cookie options (shorter expiry)
 */
export function getAccessTokenCookieOptions(): CookieOptions {
  const baseOptions = getSecureCookieOptions();
  return {
    ...baseOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
  };
}

/**
 * Get refresh token cookie options (longer expiry)
 */
export function getRefreshTokenCookieOptions(): CookieOptions {
  const baseOptions = getSecureCookieOptions();
  return {
    ...baseOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  };
}

/**
 * Clear cookie options
 */
export function getClearCookieOptions(): CookieOptions {
  const isProduction = config.server.env === 'production';
  const httpsEnabled = config.server.httpsEnabled;

  return {
    httpOnly: true,
    secure: httpsEnabled || isProduction,
    sameSite: 'strict',
    path: '/',
    ...(isProduction && {
      domain: process.env.COOKIE_DOMAIN,
    }),
  };
}
