import React from "react";
import { AdminAuthProvider } from "./AdminAuthContext";
import { ApprovalManagementProvider } from "./ApprovalManagementContext";
import { UserManagementProvider } from "./UserManagementContext";
import { MonitoringProvider } from "./MonitoringContext";

export default function AdminAppProviders({ children }) {
  return (
    <AdminAuthProvider>
      <ApprovalManagementProvider>
        <UserManagementProvider>
          <MonitoringProvider>{children}</MonitoringProvider>
        </UserManagementProvider>
      </ApprovalManagementProvider>
    </AdminAuthProvider>
  );
}
