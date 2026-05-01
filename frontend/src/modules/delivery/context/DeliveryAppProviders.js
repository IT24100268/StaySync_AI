import React from "react";
import { DeliveryAuthProvider } from "./DeliveryAuthContext";
import { DeliveryJobsProvider } from "./DeliveryJobsContext";

export default function DeliveryAppProviders({ children }) {
  return (
    <DeliveryAuthProvider>
      <DeliveryJobsProvider>{children}</DeliveryJobsProvider>
    </DeliveryAuthProvider>
  );
}
