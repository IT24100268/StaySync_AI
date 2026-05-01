import React from "react";
import RegisterFormScreen from "../auth/RegisterFormScreen";
import { ROLES } from "../../constants/auth";

export default function OwnerRegisterScreen(props) {
  return (
    <RegisterFormScreen
      {...props}
      role={ROLES.OWNER}
      title="Owner Registration"
      description="Create your owner account to manage hostel and room listings."
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
        {
          name: "hostelName",
          label: "Hostel / Business Name",
          placeholder: "Enter your hostel or business name",
        },
      ]}
    />
  );
}
