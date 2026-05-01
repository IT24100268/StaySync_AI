import React from "react";
import { OwnerAuthProvider } from "./OwnerAuthContext";
import { OwnerListingsProvider } from "./OwnerListingsContext";

export default function OwnerAppProviders({ children }) {
  return (
    <OwnerAuthProvider>
      <OwnerListingsProvider>{children}</OwnerListingsProvider>
    </OwnerAuthProvider>
  );
}
