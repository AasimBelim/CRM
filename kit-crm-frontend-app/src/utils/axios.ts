import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL ?? "";
let token: string | null = localStorage.getItem("kit_crm_token");

export const setAuthToken = (newToken: string) => {
    token = newToken;
};

const apiCall = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json",
    },
});

apiCall.interceptors.request.use((config) => {
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiCall.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginPage = window.location.pathname.includes("/signin");

    // ✅ Only redirect if NOT on login page
    if (error.response?.status === 401 && !isLoginPage) {
      localStorage.removeItem("kit_crm_token");
      localStorage.removeItem("kit_crm_user");
      window.location.href = "/signin";
    }

    return Promise.reject(error);
  }
);

export default apiCall;