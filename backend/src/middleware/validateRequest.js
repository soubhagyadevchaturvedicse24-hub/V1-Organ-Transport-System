export const validateRequest = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: result.error.errors,
      });
    }
    req.body = result.data;
    next();
  } catch (error) {
    next(error);
  }
};
