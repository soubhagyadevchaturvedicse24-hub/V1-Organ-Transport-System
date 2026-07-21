export const validateRequest = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        console.error('Validation Error (Body):', JSON.stringify(result.error.errors, null, 2));
        return res.status(400).json({ success: false, error: 'Validation Error', details: result.error.errors });
      }
      req.body = result.data;
    }
    
    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({ success: false, error: 'Validation Error', details: result.error.errors });
      }
      req.query = result.data;
    }
    
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        return res.status(400).json({ success: false, error: 'Validation Error', details: result.error.errors });
      }
      req.params = result.data;
    }

    next();
  } catch (error) {
    next(error);
  }
};
