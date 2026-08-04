import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./hooks/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ToastProvider } from "./components/Toast";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { ForgotPasswordPage } from "./pages/ForgotPassword";
import { ResetPasswordPage } from "./pages/ResetPassword";
import { DashboardPage } from "./pages/Dashboard";
import { PropertiesPage } from "./pages/Properties";
import { PropertyDetailPage } from "./pages/PropertyDetail";
import { ContractsPage } from "./pages/Contracts";
import { ContractDetailPage } from "./pages/ContractDetail";
import { TenantsPage } from "./pages/Tenants";
import { TenantDetailPage } from "./pages/TenantDetail";
import { BillsPage } from "./pages/Bills";
import { ComplaintsPage } from "./pages/Complaints";
import { ComplaintDetailPage } from "./pages/ComplaintDetail";
import { ReportsPage } from "./pages/Reports";
import { ProfilePage } from "./pages/Profile";
import { AdminPage } from "./pages/Admin";
import { TenantDashboardPage } from "./pages/TenantDashboard";
import { TenantBillsPage } from "./pages/TenantBills";
import { TenantComplaintsPage } from "./pages/TenantComplaints";
import { TenantProfilePage } from "./pages/TenantProfile";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      // Jangan refetch saat window kembali aktif — menghindari query bertumpuk
      refetchOnWindowFocus: false,
      // Jangan retry kalau API error — supaya loading state tidak stuck/muter-muter
      retry: false,
    },
  },
});

function P({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Protected */}
              <Route
                path="/dashboard"
                element={
                  <P>
                    <DashboardPage />
                  </P>
                }
              />
              <Route
                path="/properties"
                element={
                  <P>
                    <PropertiesPage />
                  </P>
                }
              />
              <Route
                path="/properties/:propertyId"
                element={
                  <P>
                    <PropertyDetailPage />
                  </P>
                }
              />
              <Route
                path="/contracts"
                element={
                  <P>
                    <ContractsPage />
                  </P>
                }
              />
              <Route
                path="/contracts/:contractId"
                element={
                  <P>
                    <ContractDetailPage />
                  </P>
                }
              />
              <Route
                path="/tenants"
                element={
                  <P>
                    <TenantsPage />
                  </P>
                }
              />
              <Route
                path="/tenants/:tenantId"
                element={
                  <P>
                    <TenantDetailPage />
                  </P>
                }
              />
              <Route
                path="/bills"
                element={
                  <P>
                    <BillsPage />
                  </P>
                }
              />
              <Route
                path="/complaints"
                element={
                  <P>
                    <ComplaintsPage />
                  </P>
                }
              />
              <Route
                path="/complaints/:complaintId"
                element={
                  <P>
                    <ComplaintDetailPage />
                  </P>
                }
              />
              <Route
                path="/reports"
                element={
                  <P>
                    <ReportsPage />
                  </P>
                }
              />
              <Route
                path="/admin"
                element={
                  <P>
                    <AdminPage />
                  </P>
                }
              />
              <Route
                path="/profile"
                element={
                  <P>
                    <ProfilePage />
                  </P>
                }
              />
              <Route
                path="/tenant/dashboard"
                element={
                  <P>
                    <TenantDashboardPage />
                  </P>
                }
              />
              <Route
                path="/tenant/bills"
                element={
                  <P>
                    <TenantBillsPage />
                  </P>
                }
              />
              <Route
                path="/tenant/complaints"
                element={
                  <P>
                    <TenantComplaintsPage />
                  </P>
                }
              />
              <Route
                path="/tenant/profile"
                element={
                  <P>
                    <TenantProfilePage />
                  </P>
                }
              />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
