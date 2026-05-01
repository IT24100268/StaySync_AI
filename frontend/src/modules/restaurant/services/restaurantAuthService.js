import { loginWithRole, registerWithRole } from "../../../services/roleAuthService";
import { fetchRestaurantProfileWithToken } from "./restaurantProfileService";

export async function loginRestaurant({ email, password }) {
  const authResponse = await loginWithRole({ email, password });
  const restaurant = await fetchRestaurantProfileWithToken(authResponse.token);

  return {
    token: authResponse.token,
    restaurant,
  };
}

export async function registerRestaurant(payload) {
  const authResponse = await registerWithRole({
    ...payload,
    role: "restaurant",
  });
  const restaurant = await fetchRestaurantProfileWithToken(authResponse.token);

  return {
    token: authResponse.token,
    restaurant,
  };
}
