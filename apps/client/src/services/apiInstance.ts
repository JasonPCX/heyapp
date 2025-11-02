import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";

import { ENV } from "../lib/env";
import { getAuthToken } from "./tokenService";

function createApiService(baseURL: string) {
  const axiosInstance = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  axiosInstance.interceptors.request.use((req) => {
    const token = getAuthToken();
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }

    return req;
  });

  axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      if (error.response) {
        console.error("Server responded with an error status code");
        if (ENV.MODE == "development") {
          console.error("Response data: ", error.response.data);
          console.error("Response status: ", error.response.status);
          console.error("Response headers: ", error.response.headers);
        }
      } else if (error.request) {
        console.error("Response was no received: ", error.request);
      } else {
        console.error("Error while setting up the request: ", error.message);
        console.error(error.config);
      }
      throw error;
    }
  );

  return {
    async get<T>(
      url: string,
      config?: AxiosRequestConfig
    ): Promise<AxiosResponse<T>> {
      return await axiosInstance.get<T>(url, config);
    },

    async post<T, U = any>(
      url: string,
      data: T,
      config?: AxiosRequestConfig
    ): Promise<AxiosResponse<U>> {
      return await axiosInstance.post<U>(url, data, config);
    },

    async put<T>(
      url: string,
      data: T,
      config?: AxiosRequestConfig
    ): Promise<AxiosResponse<T>> {
      return await axiosInstance.put<T>(url, data, config);
    },

    async patch<T>(
      url: string,
      data: T,
      config?: AxiosRequestConfig
    ): Promise<AxiosResponse<T>> {
      return await axiosInstance.patch<T>(url, data, config);
    },

    async delete(
      url: string,
      config?: AxiosRequestConfig
    ): Promise<AxiosResponse> {
      return await axiosInstance.delete(url, config);
    },
  };
}

export const API = createApiService(ENV.VITE_API_URL);