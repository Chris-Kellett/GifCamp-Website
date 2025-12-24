/**
 * Logger utility that only outputs logs when ISDEV environment variable is set to true
 */

const isDev = import.meta.env.VITE_ISDEV === 'true';

/**
 * Get formatted timestamp for logs
 */
const getTimestamp = () => {
  return new Date().toISOString();
};

/**
 * Format log message with timestamp and context
 */
const formatMessage = (level, context, message, data = null) => {
  const timestamp = getTimestamp();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;
  
  if (data !== null) {
    return { prefix, message, data };
  }
  return { prefix, message };
};

/**
 * Log info message
 */
export const logInfo = (context, message, data = null) => {
  if (!isDev) return;
  
  const formatted = formatMessage('info', context, message, data);
  if (data !== null) {
    console.log(`${formatted.prefix} ${formatted.message}`, formatted.data);
  } else {
    console.log(`${formatted.prefix} ${formatted.message}`);
  }
};

/**
 * Log warning message
 */
export const logWarn = (context, message, data = null) => {
  if (!isDev) return;
  
  const formatted = formatMessage('warn', context, message, data);
  if (data !== null) {
    console.warn(`${formatted.prefix} ${formatted.message}`, formatted.data);
  } else {
    console.warn(`${formatted.prefix} ${formatted.message}`);
  }
};

/**
 * Log error message
 */
export const logError = (context, message, error = null) => {
  if (!isDev) return;
  
  const formatted = formatMessage('error', context, message, error);
  if (error !== null) {
    console.error(`${formatted.prefix} ${formatted.message}`, error);
  } else {
    console.error(`${formatted.prefix} ${formatted.message}`);
  }
};

/**
 * Log debug message
 */
export const logDebug = (context, message, data = null) => {
  if (!isDev) return;
  
  const formatted = formatMessage('debug', context, message, data);
  if (data !== null) {
    console.debug(`${formatted.prefix} ${formatted.message}`, formatted.data);
  } else {
    console.debug(`${formatted.prefix} ${formatted.message}`);
  }
};

/**
 * Log action (user interaction)
 */
export const logAction = (context, action, details = null) => {
  if (!isDev) return;
  
  const formatted = formatMessage('action', context, action, details);
  if (details !== null) {
    console.log(`${formatted.prefix} ${formatted.message}`, formatted.data);
  } else {
    console.log(`${formatted.prefix} ${formatted.message}`);
  }
};

/**
 * Log API call
 */
export const logApi = (context, method, url, requestData = null, responseData = null) => {
  if (!isDev) return;
  
  const timestamp = getTimestamp();
  const prefix = `[${timestamp}] [API] [${context}]`;
  console.log(`${prefix} ${method.toUpperCase()} ${url}`);
  
  if (requestData !== null) {
    console.log(`${prefix} Request:`, requestData);
  }
  
  if (responseData !== null) {
    console.log(`${prefix} Response:`, responseData);
  }
};

