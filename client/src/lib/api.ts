import axios from "axios";

export const api = axios.create({ baseURL: "/api", withCredentials: true });

// Remonte le message du serveur (`{ message }`) pour les toasts et formulaires
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.message;
    return Promise.reject(new Error(typeof message === "string" ? message : "Une erreur est survenue."));
  },
);

export const get = <T>(url: string, params?: object) => api.get<T>(url, { params }).then((r) => r.data);
export const post = <T = void>(url: string, data?: unknown) => api.post<T>(url, data).then((r) => r.data);
export const put = <T = void>(url: string, data?: unknown) => api.put<T>(url, data).then((r) => r.data);
export const patch = <T = void>(url: string, data?: unknown) => api.patch<T>(url, data).then((r) => r.data);
export const del = <T = void>(url: string) => api.delete<T>(url).then((r) => r.data);
