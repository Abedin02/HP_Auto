/** Narrows an unknown catch value to a displayable message without ever leaking `any`. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
