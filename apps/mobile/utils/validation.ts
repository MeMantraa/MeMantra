// Validates an email address format and returns true if the email is valid, false otherwise.
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');
  const lastDotIndex = trimmed.lastIndexOf('.');

  return (
    atIndex > 0 &&
    lastDotIndex > atIndex + 1 &&
    lastDotIndex < trimmed.length - 1 &&
    !trimmed.includes(' ')
  );
}
