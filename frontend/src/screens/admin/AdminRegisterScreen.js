import React from "react";
import RegisterFormScreen from "../auth/RegisterFormScreen";
import { ROLES } from "../../constants/auth";

export default function AdminRegisterScreen(props) {
  return (
    <RegisterFormScreen
      {...props}
      role={ROLES.ADMIN}
      title="Admin Registration"
      description="Create your admin account to monitor the platform."
      fields={[
        { name: "name", label: "Full Name", placeholder: "Enter your full name" },
        {
          name: "email",
          label: "Email",
          placeholder: "Enter your email",
          keyboardType: "email-address",
          autoCapitalize: "none",
        },
        { name: "adminCode", label: "Admin Code", placeholder: "Enter admin code" },
      ]}
    />
  );
}
