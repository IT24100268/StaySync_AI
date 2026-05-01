import { loginWithRole, registerWithRole } from "../../../services/roleAuthService";
import { fetchDeliveryPartnerProfileWithToken } from "./deliveryProfileService";

export async function loginDeliveryPartner({ email, password }) {
  const authResponse = await loginWithRole({ email, password });
  const partner = await fetchDeliveryPartnerProfileWithToken(authResponse.token);

  return {
    token: authResponse.token,
    partner,
  };
}

export async function registerDeliveryPartner(payload) {
  const authResponse = await registerWithRole({
    ...payload,
    role: "delivery",
  });
  const partner = await fetchDeliveryPartnerProfileWithToken(authResponse.token);

  return {
    token: authResponse.token,
    partner,
  };
}
