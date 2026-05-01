import apiClient from "./apiClient";
import { demoUser } from "../data/dummyData";

export async function updateProfile(payload) {
  void apiClient;

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...demoUser,
        ...payload,
      });
    }, 500);
  });
}
