export const normalizeError = (error) => {
  if (error instanceof Error) {
    return error;
  }

  return new Error(typeof error === 'string' ? error : 'Unknown error');
};

export const handleError = ({
  error,
  logger,
  userMessage,
  statusElement,
  context = {},
}) => {
  const normalized = normalizeError(error);
  const message = userMessage || 'Something went wrong. Please try again.';

  if (logger) {
    logger.error(message, {
      ...context,
      error: normalized.message,
      stack: normalized.stack,
    });
  }

  if (statusElement) {
    statusElement.textContent = message;
  }

  return normalized;
};
