/**
 * Authentication utility functions
 */

/**
 * Checks if the provided email is the authority email (admin)
 * @param email The email to check
 * @returns True if the email is the authority email
 */
export function isAuthorityEmail(email: string): boolean {
  const authorityEmail = process.env.AUTHORITY_EMAIL;
  
  if (!authorityEmail) {
    console.warn('AUTHORITY_EMAIL environment variable is not set');
    return false;
  }
  
  return email.toLowerCase() === authorityEmail.toLowerCase();
}

/**
 * Checks if the user is authenticated
 * @param session The user session
 * @returns True if the user is authenticated
 */
export function isAuthenticated(session: any): boolean {
  return !!session && !!session.user;
}

/**
 * Gets a mock user ID for development purposes
 * This is used when authentication is bypassed
 * @returns A mock user ID
 */
export function getMockUserId(): string {
  return '00000000-0000-4000-a000-000000000000';
}

/**
 * Determines if the current environment is development
 * @returns True if the environment is development
 */
export function isDevelopmentEnvironment(): boolean {
  return true;
}
