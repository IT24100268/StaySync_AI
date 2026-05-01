import apiClient from "../../../services/apiClient";
import { demoOwner } from "../data/dummyData";

function simulate(payload, shouldFail = false) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error("Unable to process this request right now."));
        return;
      }

      resolve(payload);
    }, 700);
  });
}

export async function loginOwner({ email, password }) {
  void apiClient;

  if (email !== demoOwner.email || password !== "password123") {
    return simulate(null, true);
  }

  return simulate({
    token: "temporary-owner-jwt-token",
    owner: demoOwner,
  });
}

export async function registerOwner(payload) {
  void apiClient;

  return simulate({
    token: "temporary-owner-jwt-token",
    owner: {
      id: `owner-${Date.now()}`,
      role: "owner",
      verificationStatus: "Pending",
      ...payload,
    },
  });
}
