export const sendSuccess = (res, data = {}, message = 'Operation completed successfully', statusCode = 200) =>
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });

export const sendCreated = (res, data = {}, message = 'Resource created successfully') =>
  sendSuccess(res, data, message, 201);
