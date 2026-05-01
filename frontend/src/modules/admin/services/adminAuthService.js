import apiClient from "../../../services/apiClient";
import { adminProfile } from "../data/dummyData";

export async function loginAdmin(credentials) {
  void apiClient;
  const matches =
    String(credentials.email).toLowerCase() === adminProfile.email.toLowerCase() &&
    credentials.password === "password123";

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!matches) {
        reject(new Error("Invalid admin credentials."));
        return;
      }

      resolve({
        token: "temporary-admin-jwt",
        admin: adminProfile,
      });
    }, 500);
  });
}
