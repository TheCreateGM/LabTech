import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { sanitize } from '../utils/sanitizer';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array(),
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }
  
  next();
};

/**
 * Middleware to sanitize request body, query, and params
 */
export const sanitizeInput = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }
  
  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitize(req.query);
  }
  
  // Sanitize URL parameters
  if (req.params && typeof req.params === 'object') {
    req.params = sanitize(req.params);
  }
  
  next();
};

/**
 * Validate file upload
 * Note: Requires multer middleware to be configured
 */
export const validateFileUpload = (
  allowedTypes: string[],
  maxSizeBytes: number = 10 * 1024 * 1024 // 10MB default
) => {
  return (req: any, res: Response, next: NextFunction): void => {
    if (!req.file && !req.files) {
      next();
      return;
    }

    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];

    for (const file of files) {
      if (!file) continue;

      // Check file size
      if (file.size > maxSizeBytes) {
        res.status(400).json({
          error: {
            code: 'FILE_TOO_LARGE',
            message: `File size exceeds maximum allowed size of ${maxSizeBytes / (1024 * 1024)}MB`,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Check file type
      const fileType = file.mimetype;
      if (!allowedTypes.includes(fileType)) {
        res.status(400).json({
          error: {
            code: 'INVALID_FILE_TYPE',
            message: `File type ${fileType} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }

      // Check file name for malicious patterns
      const fileName = file.originalname || file.name;
      if (fileName && /[<>:"|?*\x00-\x1f]/.test(fileName)) {
        res.status(400).json({
          error: {
            code: 'INVALID_FILE_NAME',
            message: 'File name contains invalid characters',
            timestamp: new Date().toISOString(),
          },
        });
        return;
      }
    }

    next();
  };
};

/**
 * Validate UUID format
 */
export const isValidUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

/**
 * Validate and sanitize pagination parameters
 */
export const validatePagination = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Parse and validate page
  const page = parseInt(req.query.page as string, 10);
  req.query.page = (isNaN(page) || page < 1 ? 1 : page).toString();

  // Parse and validate limit
  const limit = parseInt(req.query.limit as string, 10);
  const maxLimit = 100;
  req.query.limit = (isNaN(limit) || limit < 1 ? 50 : Math.min(limit, maxLimit)).toString();

  next();
};

/**
 * Validate date range
 */
export const validateDateRange = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { startDate, endDate } = req.query;

  if (startDate && !isValidDate(startDate as string)) {
    res.status(400).json({
      error: {
        code: 'INVALID_START_DATE',
        message: 'Invalid start date format. Use ISO 8601 format',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if (endDate && !isValidDate(endDate as string)) {
    res.status(400).json({
      error: {
        code: 'INVALID_END_DATE',
        message: 'Invalid end date format. Use ISO 8601 format',
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  if (startDate && endDate) {
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (start > end) {
      res.status(400).json({
        error: {
          code: 'INVALID_DATE_RANGE',
          message: 'Start date must be before end date',
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }
  }

  next();
};

/**
 * Check if string is a valid date
 */
const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Compose validation chains with error handling
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors.array(),
          timestamp: new Date().toISOString(),
        },
      });
      return;
    }

    next();
  };
};
