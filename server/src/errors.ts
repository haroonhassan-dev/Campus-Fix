import type { ErrorRequestHandler, RequestHandler } from 'express';

export interface ErrorDetail {
  field: string;
  message: string;
}

/** An error that maps directly onto the API's JSON error envelope. */
export class HttpError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ErrorDetail[];

  constructor(status: number, code: string, message: string, details: ErrorDetail[] = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const notFoundHandler: RequestHandler = (req) => {
  throw new HttpError(404, 'ROUTE_NOT_FOUND', `No route for ${req.method} ${req.path}.`);
};

// Error types raised by express.json() (body-parser)
const BODY_PARSER_ERRORS: Record<string, [number, string, string]> = {
  'entity.parse.failed': [400, 'INVALID_JSON', 'Request body is not valid JSON.'],
  'entity.too.large': [413, 'PAYLOAD_TOO_LARGE', 'Request body is too large (limit 10kb).'],
  'encoding.unsupported': [415, 'UNSUPPORTED_MEDIA_TYPE', 'Unsupported request body encoding.'],
  'charset.unsupported': [415, 'UNSUPPORTED_MEDIA_TYPE', 'Unsupported request body charset.'],
};

/** Central error handler: every failure leaves as { error: { code, message, details } }. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  const parserError = typeof err?.type === 'string' ? BODY_PARSER_ERRORS[err.type] : undefined;
  if (parserError) {
    const [status, code, message] = parserError;
    res.status(status).json({ error: { code, message, details: [] } });
    return;
  }

  console.error('[campusfix-api] Unhandled error:', err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on the server.', details: [] },
  });
};
