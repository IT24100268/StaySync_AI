import React from "react";
import RegisterFormScreen from "../auth/RegisterFormScreen";
import { ROLES } from "../../constants/auth";
import { GENDER_PREFERENCE_OPTIONS } from "../../utils/constants";

export default function StudentRegisterScreen(props) {
  return (
    <RegisterFormScreen
      {...props}
      role={ROLES.STUDENT}
      title="Student Registration"
      description="Create your student account to start room search and food ordering."
      fields={[
        { name: "name", label: "Full Name", placeholder: "Enter your full name" },
        {
          name: "email",
          label: "Email",
          placeholder: "Enter your email",
          keyboardType: "email-address",
          autoCapitalize: "none",
        },
        {
          name: "phone",
          label: "Phone Number",
          placeholder: "Enter your phone number",
          keyboardType: "phone-pad",
          autoCapitalize: "none",
        },
        { name: "university", label: "University", placeholder: "Enter your university" },
        {
          name: "genderPreference",
          label: "Gender Preference",
          type: "select",
          placeholder: "Select gender preference",
          options: GENDER_PREFERENCE_OPTIONS,
        },
      ]}
    />
  );
}
