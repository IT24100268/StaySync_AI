import apiClient from "../../../services/apiClient";
import { demoOwner } from "../data/dummyData";

export async function updateOwnerProfile(payload) {
  void apiClient;

  return new Promise((resolve) => {
    setTimeout(() => resolve({ ...demoOwner, ...payload }), 500);
  });
}
