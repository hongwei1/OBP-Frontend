import { createLogger } from "$lib/utils/logger";
const logger = createLogger("OBPRequests");
import { env } from "$env/dynamic/public";
import { OBPErrorBase, OBPRequestError } from "$lib/obp/errors";

/**
 * Extract error details from OBP API response data.
 * Handles multiple OBP error formats:
 * - v6.0.0: { code: "OBP-XXXXX", message: "..." }
 * - older: { failCode: "OBP-XXXXX", failMsg: "..." }
 * - simple: { message: "..." } or { error: "..." }
 *
 * IMPORTANT: Never simplify or hide OBP error messages - show them in full!
 */
function extractOBPError(
  data: any,
  response: Response,
): { code?: string; message: string } {
  // If data is a string, return it directly
  if (typeof data === "string") {
    return {
      message: data || `HTTP ${response.status}: ${response.statusText}`,
    };
  }

  // If data is not an object, return status info
  if (!data || typeof data !== "object") {
    return { message: `HTTP ${response.status}: ${response.statusText}` };
  }

  // Extract code from various possible fields
  const code = data.code || data.failCode || data.error_code;

  // Extract message from various possible fields - NEVER use generic fallback if we have data!
  const message =
    data.message ||
    data.failMsg ||
    data.error ||
    data.error_message ||
    // If we have a code but no message, at least show the code
    (code ? `Error code: ${code}` : null) ||
    // If we have any other data, stringify it to show the full response
    (Object.keys(data).length > 0
      ? JSON.stringify(data)
      : `HTTP ${response.status}: ${response.statusText}`);

  return { code, message };
}

class OBPRequests {
  base_url: string;

  constructor(base_url: string) {
    logger.info("Initializing with base URL:", base_url);

    if (!base_url) {
      throw new OBPErrorBase("Base URL for OBP requests is not defined.");
    }
    this.base_url = base_url;

    logger.info("Initialized.");
  }

  async get(endpoint: string, accessToken?: string): Promise<any> {
    const startTime = performance.now();
    logger.debug("GET", endpoint);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    const response = await fetch(`${this.base_url}${endpoint}`, {
      headers,
    });

    const duration = performance.now() - startTime;
    if (duration > 400) {
      logger.warn(
        `⚠️ WARNING SLOW! GET ${endpoint} took ${duration.toFixed(2)}ms`,
      );
    } else {
      logger.debug(`GET ${endpoint} completed in ${duration.toFixed(2)}ms`);
    }

    // Log the actual HTTP status code and correlation ID
    const correlationId = response.headers.get("Correlation-Id");
    logger.debug(`HTTP Status: ${response.status} ${response.statusText}`);
    if (correlationId) {
      logger.debug(`Correlation ID: ${correlationId}`);
    }

    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (!response.ok) {
      logger.error(
        `HTTP Error: ${response.status} ${response.statusText} for ${endpoint}`,
      );
      // Try to get error details, but handle non-JSON responses
      let data;
      try {
        data = isJson ? await response.json() : await response.text();
      } catch (e) {
        data = null;
      }

      logger.error("Failed to fetch OBP data:", {
        statusText: response.statusText,
        contentType,
        data: typeof data === "string" ? data.substring(0, 200) : data,
      });

      // Extract full error details - NEVER hide or simplify OBP error messages!
      const { code, message } = extractOBPError(data, response);
      if (code) {
        throw new OBPRequestError(code, message, response.status);
      } else {
        throw new OBPErrorBase(message, response.status);
      }
    }

    // Only parse as JSON if content-type indicates JSON
    if (!isJson) {
      const text = await response.text();
      logger.error("Expected JSON response but got:", {
        contentType,
        preview: text.substring(0, 200),
      });
      throw new OBPErrorBase(
        `Expected JSON response from ${endpoint} but got ${contentType || "unknown content type"}`,
      );
    }

    const data = await response.json();
    logger.debug("Response from OBP", response.status, response.statusText);
    logger.debug("GET done");
    return data;
  }

  async post(endpoint: string, body: any, accessToken?: string): Promise<any> {
    const startTime = performance.now();
    logger.debug("POST", endpoint, body);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    const response = await fetch(`${this.base_url}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const duration = performance.now() - startTime;
    if (duration > 400) {
      logger.warn(
        `⚠️ WARNING SLOW! POST ${endpoint} took ${duration.toFixed(2)}ms`,
      );
    } else {
      logger.debug(`POST ${endpoint} completed in ${duration.toFixed(2)}ms`);
    }

    // Log correlation ID
    const correlationId = response.headers.get("Correlation-Id");
    if (correlationId) {
      logger.debug(`Correlation ID: ${correlationId}`);
    }

    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (!response.ok) {
      // Try to get error details, but handle non-JSON responses
      let data;
      try {
        data = isJson ? await response.json() : await response.text();
      } catch (e) {
        data = null;
      }

      logger.error("Failed to post OBP data:", {
        statusText: response.statusText,
        contentType,
        data: typeof data === "string" ? data.substring(0, 200) : data,
      });

      // Extract full error details - NEVER hide or simplify OBP error messages!
      const { code, message } = extractOBPError(data, response);
      if (code) {
        throw new OBPRequestError(code, message, response.status);
      } else {
        throw new OBPErrorBase(message, response.status);
      }
    }

    // Only parse as JSON if content-type indicates JSON
    if (!isJson) {
      const text = await response.text();
      logger.error("Expected JSON response but got:", {
        contentType,
        preview: text.substring(0, 200),
      });
      throw new OBPErrorBase(
        `Expected JSON response from ${endpoint} but got ${contentType || "unknown content type"}`,
      );
    }

    const data = await response.json();
    logger.debug("Response from OBP", response.status, response.statusText);
    logger.debug("POST done");
    return data;
  }

  async delete(endpoint: string, accessToken?: string): Promise<any> {
    const startTime = performance.now();
    logger.debug("DELETE", endpoint);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    const response = await fetch(`${this.base_url}${endpoint}`, {
      method: "DELETE",
      headers,
    });

    const duration = performance.now() - startTime;
    if (duration > 400) {
      logger.warn(
        `⚠️ WARNING SLOW! DELETE ${endpoint} took ${duration.toFixed(2)}ms`,
      );
    } else {
      logger.debug(`DELETE ${endpoint} completed in ${duration.toFixed(2)}ms`);
    }

    // Log correlation ID
    const correlationId = response.headers.get("Correlation-Id");
    if (correlationId) {
      logger.debug(`Correlation ID: ${correlationId}`);
    }

    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (!response.ok) {
      // Try to get error details, but handle non-JSON responses
      let data;
      try {
        data = isJson ? await response.json() : await response.text();
      } catch (e) {
        data = null;
      }

      logger.error("Failed to delete OBP data:", {
        statusText: response.statusText,
        contentType,
        data: typeof data === "string" ? data.substring(0, 200) : data,
      });

      // Extract full error details - NEVER hide or simplify OBP error messages!
      const { code, message } = extractOBPError(data, response);
      if (code) {
        throw new OBPRequestError(code, message, response.status);
      } else {
        throw new OBPErrorBase(message, response.status);
      }
    }

    // Only parse as JSON if content-type indicates JSON
    if (!isJson) {
      const text = await response.text();
      logger.error("Expected JSON response but got:", {
        contentType,
        preview: text.substring(0, 200),
      });
      throw new OBPErrorBase(
        `Expected JSON response from ${endpoint} but got ${contentType || "unknown content type"}`,
      );
    }

    // Handle 204 No Content response (successful DELETE with no body)
    if (response.status === 204) {
      logger.debug(
        "Response from OBP",
        response.status,
        response.statusText,
        "(no content)",
      );
      logger.debug("DELETE done");
      return { success: true };
    }

    const data = await response.json();
    logger.debug("Response from OBP", response.status, response.statusText);
    logger.debug("DELETE done");
    return data;
  }

  async put(endpoint: string, body: any, accessToken?: string): Promise<any> {
    const startTime = performance.now();
    logger.debug("PUT", endpoint, body);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    const response = await fetch(`${this.base_url}${endpoint}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });

    const duration = performance.now() - startTime;
    if (duration > 400) {
      logger.warn(
        `⚠️ WARNING SLOW! PUT ${endpoint} took ${duration.toFixed(2)}ms`,
      );
    } else {
      logger.debug(`PUT ${endpoint} completed in ${duration.toFixed(2)}ms`);
    }

    // Log correlation ID
    const correlationId = response.headers.get("Correlation-Id");
    if (correlationId) {
      logger.debug(`Correlation ID: ${correlationId}`);
    }

    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (!response.ok) {
      // Try to get error details, but handle non-JSON responses
      let data;
      try {
        data = isJson ? await response.json() : await response.text();
      } catch (e) {
        data = null;
      }

      logger.error("Failed to put OBP data:", {
        statusText: response.statusText,
        contentType,
        data: typeof data === "string" ? data.substring(0, 200) : data,
      });

      // Extract full error details - NEVER hide or simplify OBP error messages!
      const { code, message } = extractOBPError(data, response);
      if (code) {
        throw new OBPRequestError(code, message, response.status);
      } else {
        throw new OBPErrorBase(message, response.status);
      }
    }

    // Only parse as JSON if content-type indicates JSON
    if (!isJson) {
      const text = await response.text();
      logger.error("Expected JSON response but got:", {
        contentType,
        preview: text.substring(0, 200),
      });
      throw new OBPErrorBase(
        `Expected JSON response from ${endpoint} but got ${contentType || "unknown content type"}`,
      );
    }

    const data = await response.json();
    logger.debug("Response from OBP", response.status, response.statusText);
    logger.debug("PUT done");
    return data;
  }

  async patch(endpoint: string, body: any, accessToken?: string): Promise<any> {
    const startTime = performance.now();
    logger.debug("PATCH", endpoint, body);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    const response = await fetch(`${this.base_url}${endpoint}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });

    const duration = performance.now() - startTime;
    if (duration > 400) {
      logger.warn(
        `⚠️ WARNING SLOW! PATCH ${endpoint} took ${duration.toFixed(2)}ms`,
      );
    } else {
      logger.debug(`PATCH ${endpoint} completed in ${duration.toFixed(2)}ms`);
    }

    // Log correlation ID
    const correlationId = response.headers.get("Correlation-Id");
    if (correlationId) {
      logger.debug(`Correlation ID: ${correlationId}`);
    }

    // Check content type before parsing
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    if (!response.ok) {
      // Try to get error details, but handle non-JSON responses
      let data;
      try {
        data = isJson ? await response.json() : await response.text();
      } catch (e) {
        data = null;
      }

      logger.error("Failed to patch OBP data:", {
        statusText: response.statusText,
        contentType,
        data: typeof data === "string" ? data.substring(0, 200) : data,
      });

      // Extract full error details - NEVER hide or simplify OBP error messages!
      const { code, message } = extractOBPError(data, response);
      if (code) {
        throw new OBPRequestError(code, message, response.status);
      } else {
        throw new OBPErrorBase(message, response.status);
      }
    }

    // Only parse as JSON if content-type indicates JSON
    if (!isJson) {
      const text = await response.text();
      logger.error("Expected JSON response but got:", {
        contentType,
        preview: text.substring(0, 200),
      });
      throw new OBPErrorBase(
        `Expected JSON response from ${endpoint} but got ${contentType || "unknown content type"}`,
      );
    }

    const data = await response.json();
    logger.debug("Response from OBP", response.status, response.statusText);
    logger.debug("PATCH done");
    return data;
  }
}

let obp_requests_instance: OBPRequests | null = null;

export const obp_requests = {
  get instance(): OBPRequests {
    if (!obp_requests_instance) {
      obp_requests_instance = new OBPRequests(env.PUBLIC_OBP_BASE_URL);
    }
    return obp_requests_instance;
  },

  get: function (endpoint: string, accessToken?: string) {
    return this.instance.get(endpoint, accessToken);
  },

  post: function (endpoint: string, data: any, accessToken?: string) {
    return this.instance.post(endpoint, data, accessToken);
  },

  put: function (endpoint: string, data: any, accessToken?: string) {
    return this.instance.put(endpoint, data, accessToken);
  },

  delete: function (endpoint: string, accessToken?: string) {
    return this.instance.delete(endpoint, accessToken);
  },
};
