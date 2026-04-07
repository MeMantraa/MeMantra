export const ADMIN_EMAILS = ['admin@memantra.com', 'jamie@whereithrive.ca'];

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) {
    return false;
  }

  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
};
