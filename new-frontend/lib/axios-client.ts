import axios from "axios";
import { ENV } from "./get-env";

const baseURL = ENV.NEXT_PUBLIC_API_BASE_URL;

const options = {
  baseURL,
  withCredentials: true,
  timeout: 10000,
};

// Custom error type
export interface CustomError extends Error {
  errorCode?: string;
  response?: any;
}

//*** FOR API WITH TOKEN */
export const API = axios.create(options);

API.interceptors.request.use((config) => {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  if (accessToken) {
    config.headers["Authorization"] = "Bearer " + accessToken;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;

    if (!response) {
      const customError: CustomError = {
        ...error,
        message: error.message || "Network error",
        errorCode: "NETWORK_ERROR",
      };
      return Promise.reject(customError);
    }

    const { data, status } = response;
    if ((data === "Unauthorized" || status === 401) && typeof window !== 'undefined') {
      // Don't redirect if we're already on auth pages
      if (!window.location.pathname.startsWith('/auth/')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        localStorage.removeItem('expiresAt');
        window.location.href = "/auth/signin";
      }
    }

    const customError: CustomError = {
      ...error,
      message: data?.message || error.message,
      errorCode: data?.errorCode || "UNKNOWN_ERROR",
    };

    return Promise.reject(customError);
  }
);

//*** FOR API DONT NEED TOKEN */
export const PublicAPI = axios.create(options);

PublicAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;

    if (!response) {
      const customError: CustomError = {
        ...error,
        message: error.message || "Network error",
        errorCode: "NETWORK_ERROR",
      };
      return Promise.reject(customError);
    }

    const { data } = response;
    const customError: CustomError = {
      ...error,
      message: data?.message,
      errorCode: data?.errorCode || "UNKNOWN_ERROR",
    };
    return Promise.reject(customError);
  }
);
