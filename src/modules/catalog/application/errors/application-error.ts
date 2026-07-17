export type ApplicationErrorCode = "PNPU-404" | "PNPU-409" | "PNPU-422" | "PNPU-429" | "PNPU-503";

export class ApplicationError extends Error {
  private constructor(
    public readonly code: ApplicationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApplicationError";
  }

  public static notFound(message: string): ApplicationError {
    return new ApplicationError("PNPU-404", message);
  }

  public static validation(message: string): ApplicationError {
    return new ApplicationError("PNPU-422", message);
  }

  public static serviceUnavailable(message: string): ApplicationError {
    return new ApplicationError("PNPU-503", message);
  }
}
