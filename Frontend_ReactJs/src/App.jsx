import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthLayout } from "./layouts/AuthLayout";
import { MainLayout } from "./layouts/MainLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { SpecialtiesPage } from "./pages/patient/browsing/SpecialtiesPage";
import { SpecialtyDetailPage } from "./pages/patient/browsing/SpecialtyDetailPage";
import { DoctorsPage } from "./pages/patient/browsing/DoctorsPage";
import { DoctorDetailPage } from "./pages/patient/browsing/DoctorDetailPage";
import { BookingPage } from "./pages/patient/browsing/BookingPage";
import { PatientProfilePage } from "./pages/patient/profile/PatientProfilePage";
import { HomePage } from "./pages/public/HomePage";
import { UsersPage } from "./pages/public/UsersPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="register" element={<RegisterPage />} />
          <Route path="login" element={<LoginPage />} />
        </Route>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="specialties" element={<SpecialtiesPage />} />
          <Route path="specialties/:id" element={<SpecialtyDetailPage />} />
          <Route path="doctors" element={<DoctorsPage />} />
          <Route path="doctors/:id" element={<DoctorDetailPage />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="profile" element={<PatientProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
