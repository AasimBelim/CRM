import apiCall from "@/utils/axios";

const authService = {
    login: async (email: string, password: string) => {
        const response = await apiCall.post("/auth/sign-in", { email, password });
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await apiCall.get("/profile");
        return response.data;
    },

    logout: () => {
        localStorage.removeItem("kit_crm_token");
        localStorage.removeItem("kit_crm_user");
    },
};

export default authService;
