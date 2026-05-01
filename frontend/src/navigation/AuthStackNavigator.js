import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/auth/LoginScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import ChooseAccountTypeScreen from "../screens/auth/ChooseAccountTypeScreen";
import StudentRegisterScreen from "../screens/student/StudentRegisterScreen";
import OwnerRegisterScreen from "../screens/owner/OwnerRegisterScreen";
import RestaurantRegisterScreen from "../screens/restaurant/RestaurantRegisterScreen";
import DeliveryPartnerRegisterScreen from "../screens/delivery/DeliveryPartnerRegisterScreen";

const Stack = createNativeStackNavigator();

export default function AuthStackNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ChooseAccountType" component={ChooseAccountTypeScreen} />
      <Stack.Screen name="StudentRegister" component={StudentRegisterScreen} />
      <Stack.Screen name="OwnerRegister" component={OwnerRegisterScreen} />
      <Stack.Screen name="RestaurantRegister" component={RestaurantRegisterScreen} />
      <Stack.Screen
        name="DeliveryPartnerRegister"
        component={DeliveryPartnerRegisterScreen}
      />
    </Stack.Navigator>
  );
}
