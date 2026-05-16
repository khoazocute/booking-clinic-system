import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthLayout } from "./layouts/AuthLayout";
import { MainLayout } from "./layouts/MainLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
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
import { SpecialtiesPage } from "./pages/patient/browsing/SpecialtiesPage";
import { SpecialtyDetailPage } from "./pages/patient/browsing/SpecialtyDetailPage";
import { DoctorsPage } from "./pages/patient/browsing/DoctorsPage";
import { DoctorDetailPage } from "./pages/patient/browsing/DoctorDetailPage";
import { BookingPage } from "./pages/patient/browsing/BookingPage";
import { HomePage } from "./pages/public/HomePage";
import { UsersPage } from "./pages/public/UsersPage";
import { PatientProfilePage } from "./pages/patient/account/PatientProfilePage";
import { PatientProfileUpdate } from "./pages/patient/account/PatientProfileUpdate";
import { ChangePassword } from "./pages/patient/account/ChangePassword";
import { MyAppointmentsPage } from "./pages/patient/appointments/MyAppointmentsPage";
import { AppointmentDetailPage } from "./pages/patient/appointments/AppointmentDetailPage";
import { PatientMedicalRecordDetailPage } from "./pages/patient/medical/MedicalRecordDetailPage";
import { MyPrescriptionsPage } from "./pages/patient/prescriptions/MyPrescriptionsPage";
import { PatientPrescriptionDetailPage } from "./pages/patient/prescriptions/PrescriptionDetailPage";
import { MyReviewsPage } from "./pages/patient/reviews/MyReviewsPage";
import { CreateReviewPage } from "./pages/patient/reviews/CreateReviewPage";
import { EditReviewPage } from "./pages/patient/reviews/EditReviewPage";
import { MyNotificationsPage } from "./pages/patient/notifications/MyNotificationsPage";

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
          <Route path="specialties" element={<SpecialtiesPage />} />
          <Route path="specialties/:id" element={<SpecialtyDetailPage />} />
          <Route path="doctors" element={<DoctorsPage />} />
          <Route path="doctors/:id" element={<DoctorDetailPage />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="my-appointments" element={<MyAppointmentsPage />} />
          <Route path="my-appointments/:appointmentId" element={<AppointmentDetailPage />} />
          <Route path="medical-records/:medicalRecordId" element={<PatientMedicalRecordDetailPage />} />
          <Route path="prescriptions" element={<MyPrescriptionsPage />} />
          <Route path="prescriptions/:prescriptionId" element={<PatientPrescriptionDetailPage />} />
          <Route path="reviews" element={<MyReviewsPage />} />
          <Route path="reviews/create/:appointmentId" element={<CreateReviewPage />} />
          <Route path="reviews/:reviewId/edit" element={<EditReviewPage />} />
          <Route path="notifications" element={<MyNotificationsPage />} />
          <Route path="profile" element={<PatientProfilePage />} />
          <Route path="profile/edit" element={<PatientProfileUpdate />} />
          <Route path="change-password" element={<ChangePassword />} />
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
