import { type Request, type Response, type NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          type: "about:blank",
          title: "Bad Request",
          status: 400,
          detail: "Validation failed",
          errors: error.errors,
        });
      } else {
        next(error);
      }
    }
  };
}

export function validateQuery(schema: AnyZodObject) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync(req.query);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    type: "about:blank",
                    title: "Bad Request",
                    status: 400,
                    detail: "Query validation failed",
                    errors: error.errors,
                });
            } else {
                next(error);
            }
        }
    };
}
