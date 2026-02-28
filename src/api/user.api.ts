import axiosInstance from "./axiosInstance";

export const userApi = {
    getAccessLevel: () => axiosInstance.get("/user/access-level"),
};
