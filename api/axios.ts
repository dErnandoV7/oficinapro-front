import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3030",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const sessionToken = sessionStorage.getItem("token");

    const cookieToken = (() => {
      const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
      return match ? decodeURIComponent(match[1]) : null;
    })();

    const token = sessionToken ?? cookieToken;
    if (token) {
      config.headers = config.headers ?? {};
      if (!(config.headers as Record<string, unknown>).Authorization) {
        (config.headers as Record<string, unknown>).Authorization = `Bearer ${token}`;
      }
    }
  }

  return config;
});

export default api