import api from "@/lib/api";

export const login = async (username: string, password: string) => {
  const response = await api.post("/account/login", {
    username,
    password,
  });
  return response.data; // { token, expiration, role, firstName, lastName }
};
