import { loginWithRole, registerWithRole } from "./roleAuthService";

export async function loginStudent({ email, password }) {
  return loginWithRole({ email, password });
}

export async function registerStudent(payload) {
  return registerWithRole({
    ...payload,
    role: "student",
  });
}
