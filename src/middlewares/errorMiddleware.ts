import { Request, Response, NextFunction } from "express";

// Define a general error interface
interface CustomError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

const globalErrorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
  // Set default status and message
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (err.isOperational) {
    // Operational, trusted error: Send detailed response
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or unknown error (untrusted): Log and send generic response
    res.status(500).json({
      status: "error",
      message: err.message || "Something went very wrong!",
    });
  }
};

export default globalErrorHandler;
