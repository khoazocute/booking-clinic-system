import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthLayout } from "./layouts/AuthLayout";
import { MainLayout } from "./layouts/MainLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { CreateMedicalRecordPage } from "./pages/doctor/CreateMedicalRecordPage";
import { CreatePrescriptionPage } from "./pages/doctor/CreatePrescriptionPage";
import { CreateDoctorSchedulePage } from "./pages/doctor/CreateDoctorSchedulePage";
import { DoctorAppointmentDetailPage } from "./pages/doctor/DoctorAppointmentDetailPage";
import { DoctorAppointmentsPage } from "./pages/doctor/DoctorAppointmentsPage";
import { DoctorDashboardPage } from "./pages/doctor/DoctorDashboardPage";
import { DoctorNotificationsPage } from "./pages/doctor/DoctorNotificationsPage";
import { DoctorProfilePage } from "./pages/doctor/DoctorProfilePage";
import { DoctorReviewsPage } from "./pages/doctor/DoctorReviewsPage";
import { DoctorSchedulesPage } from "./pages/doctor/DoctorSchedulesPage";
import { DoctorSettingsPage } from "./pages/doctor/DoctorSettingsPage";
import { EditDoctorProfilePage } from "./pages/doctor/EditDoctorProfilePage";
import { EditDoctorSchedulePage } from "./pages/doctor/EditDoctorSchedulePage";
import { MedicalRecordDetailPage } from "./pages/doctor/MedicalRecordDetailPage";
import { PrescriptionDetailPage } from "./pages/doctor/PrescriptionDetailPage";
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
        </Route>
        <Route path="/doctor" element={<DoctorDashboardPage />} />
        <Route path="/doctor/profile" element={<DoctorProfilePage />} />
        <Route path="/doctor/profile/edit" element={<EditDoctorProfilePage />} />
        <Route path="/doctor/appointments" element={<DoctorAppointmentsPage />} />
        <Route path="/doctor/schedules" element={<DoctorSchedulesPage />} />
        <Route
          path="/doctor/schedules/create"
          element={<CreateDoctorSchedulePage />}
        />
        <Route
          path="/doctor/schedules/:scheduleId/edit"
          element={<EditDoctorSchedulePage />}
        />
        <Route
          path="/doctor/appointments/:appointmentId"
          element={<DoctorAppointmentDetailPage />}
        />
        <Route
          path="/doctor/medical-records/create/:appointmentId"
          element={<CreateMedicalRecordPage />}
        />
        <Route
          path="/doctor/medical-records/:medicalRecordId"
          element={<MedicalRecordDetailPage />}
        />
        <Route
          path="/doctor/prescriptions/create/:medicalRecordId"
          element={<CreatePrescriptionPage />}
        />
        <Route
          path="/doctor/prescriptions/:prescriptionId"
          element={<PrescriptionDetailPage />}
        />
        <Route path="/doctor/reviews" element={<DoctorReviewsPage />} />
        <Route path="/doctor/settings" element={<DoctorSettingsPage />} />
        <Route
          path="/doctor/notifications"
          element={<DoctorNotificationsPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}
