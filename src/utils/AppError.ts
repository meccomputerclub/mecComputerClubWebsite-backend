/**
 * Custom error class for handling operational errors with specific HTTP status codes.
 *
 * Operational errors are those the application is designed to handle (e.g.,
 * resource not found, invalid input, unauthorized access).
 */
class AppError extends Error {
  public statusCode: number;
  public status: "fail" | "error";
  public isOperational: boolean;

  /**
   * @param message The error message to be displayed (e.g., "Invalid ID").
   * @param statusCode The HTTP status code (e.g., 404, 403, 401).
   */
  constructor(message: string, statusCode: number) {
    // Call the parent (Error) constructor
    super(message);

    this.statusCode = statusCode;
    // Determine status based on status code (4xx is 'fail', 5xx is 'error')
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    // Mark as operational so we know it's a handled error
    this.isOperational = true;

    // Capture the stack trace, excluding the constructor call
    // This is important for debugging and logging
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
