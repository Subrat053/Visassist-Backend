const validate = (schema, target = "body") => {
  return (req, res, next) => {
    const parseResult = schema.safeParse(req[target]);

    if (!parseResult.success) {
      return res.status(422).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          details: parseResult.error.flatten(),
        },
      });
    }

    req[target] = parseResult.data;
    return next();
  };
};

module.exports = validate;
