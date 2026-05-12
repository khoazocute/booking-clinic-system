import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthLayout } from "./layouts/AuthLayout";
import { MainLayout } from "./layouts/MainLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { HomePage } from "./pages/public/HomePage";
import { UsersPage } from "./pages/public/UsersPage";
import { PatientProfilePage } from "./pages/patient/account/PatientProfilePage";
import { PatientProfileUpdate } from "./pages/patient/account/PatientProfileUpdate";
import { ChangePassword } from "./pages/patient/account/ChangePassword";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="register" element={<RegisterPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
        </Route>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="profile" element={<PatientProfilePage />} />
          <Route path="profile/edit" element={<PatientProfileUpdate />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
