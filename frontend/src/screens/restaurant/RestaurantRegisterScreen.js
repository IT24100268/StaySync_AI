import React from "react";
import RegisterFormScreen from "../auth/RegisterFormScreen";
import { ROLES } from "../../constants/auth";
import { CUISINE_TYPE_OPTIONS } from "../../utils/constants";

export default function RestaurantRegisterScreen(props) {
  return (
    <RegisterFormScreen
      {...props}
      role={ROLES.RESTAURANT}
      title="Restaurant Registration"
      description="Create your restaurant account to manage menu items and orders."
      fields={[
        { name: "name", label: "Restaurant Name", placeholder: "Enter restaurant name" },
        {
          name: "email",
          label: "Email",
          placeholder: "Enter restaurant email",
          keyboardType: "email-address",
          autoCapitalize: "none",
        },
        { name: "phone", label: "Phone Number", placeholder: "Enter phone number" },
        {
          name: "address",
          label: "Address",
          placeholder: "Enter restaurant address",
          multiline: true,
        },
        {
          name: "cuisineType",
          label: "Cuisine Type",
          type: "select",
          placeholder: "Select cuisine type",
          options: CUISINE_TYPE_OPTIONS,
        },
      ]}
    />
  );
}
