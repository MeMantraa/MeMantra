const FALLBACK_ADMIN_EMAILS = ['admin@memantra.ca'];

const envAdminEmails = (process.env.EXPO_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter((email) => email.length > 0);

const adminEmails = envAdminEmails.length > 0 ? envAdminEmails : FALLBACK_ADMIN_EMAILS;

export const ADMIN_EMAILS = Array.from(new Set(adminEmails));

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) {
    return false;
  }

  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
};
