export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

// ==========================================
// STRING & OBJECT KEY CONVERSION UTILITIES
// ==========================================

/**
 * Convert a camelCase string to snake_case.
 * Example: "firstName" -> "first_name"
 */
export const camelToSnake = (str) => {
  if (typeof str !== "string") return str;
  return str.replace(/([A-Z])/g, "_$1").toLowerCase();
};

/**
 * Convert a snake_case string to camelCase.
 * Example: "first_name" -> "firstName"
 */
export const snakeToCamel = (str) => {
  if (typeof str !== "string") return str;
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Recursively convert all keys in an object/array from camelCase to snake_case.
 */
export const keysToSnake = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(keysToSnake);
  } else if (obj !== null && typeof obj === "object" && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = camelToSnake(key);
      acc[snakeKey] = keysToSnake(obj[key]);
      return acc;
    }, {});
  }
  return obj;
};

/**
 * Recursively convert all keys in an object/array from snake_case to camelCase.
 */
export const keysToCamel = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(keysToCamel);
  } else if (obj !== null && typeof obj === "object" && obj.constructor === Object) {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = snakeToCamel(key);
      acc[camelKey] = keysToCamel(obj[key]);
      return acc;
    }, {});
  }
  return obj;
};

/**
 * Get standard authentication headers including Bearer token if present in localStorage.
 */
export const getAuthHeaders = (extraHeaders = {}) => {
  const headers = { ...extraHeaders };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
};

/**
 * Base HTTP client for JSON API requests.
 */
export const apiClient = async (endpoint, options = {}) => {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  
  const headers = getAuthHeaders({
    "Content-Type": "application/json",
    ...(options.headers || {}),
  });

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === "object" && !(config.body instanceof FormData) && !(config.body instanceof URLSearchParams)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errData = await response.json();
      if (errData && errData.detail) {
        errorDetail = typeof errData.detail === "string" ? errData.detail : JSON.stringify(errData.detail);
      } else if (errData && errData.message) {
        errorDetail = errData.message;
      }
    } catch (_) {
      errorDetail = response.statusText || errorDetail;
    }
    const error = new Error(errorDetail);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch (_) {
    return null;
  }
};

/**
 * HTTP client for multipart file uploads (FormData).
 * Automatically leaves Content-Type unset so the browser generates the multipart boundary.
 */
export const apiUpload = async (endpoint, formData, options = {}) => {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  
  const headers = getAuthHeaders(options.headers || {});

  const config = {
    method: "POST",
    ...options,
    headers,
    body: formData,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorDetail = `Upload failed with status ${response.status}`;
    try {
      const errData = await response.json();
      if (errData && errData.detail) {
        errorDetail = typeof errData.detail === "string" ? errData.detail : JSON.stringify(errData.detail);
      }
    } catch (_) {
      errorDetail = response.statusText || errorDetail;
    }
    const error = new Error(errorDetail);
    error.status = response.status;
    throw error;
  }

  try {
    return await response.json();
  } catch (_) {
    return null;
  }
};
