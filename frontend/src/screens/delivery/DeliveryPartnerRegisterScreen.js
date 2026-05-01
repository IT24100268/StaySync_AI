import React from "react";
import RegisterFormScreen from "../auth/RegisterFormScreen";
import { ROLES } from "../../constants/auth";

export default function DeliveryPartnerRegisterScreen(props) {
  return (
    <RegisterFormScreen
      {...props}
      role={ROLES.DELIVERY}
      title="Delivery Partner Registration"
      description="Create your delivery account to start accepting delivery jobs."
      fields={[
        { name: "name", label: "Full Name", placeholder: "Enter your full name" },
        {
          name: "email",
          label: "Email",
          placeholder: "Enter your email",
          keyboardType: "email-address",
          autoCapitalize: "none",
        },
        { name: "phone", label: "Phone Number", placeholder: "Enter your phone number" },
        { name: "vehicleType", label: "Vehicle Type", placeholder: "Bike / Scooter / Car" },
      ]}
    />
  );
}
