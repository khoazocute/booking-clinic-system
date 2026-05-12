export const doctorProfile = {
  fullName: "Dr. Nguyễn Minh Khang",
  specialty: "Nội tổng quát",
  qualification: "Thạc sĩ Y khoa, Bác sĩ CKI",
  experienceYears: 11,
  consultationFee: "350.000đ",
  biography:
    "Phụ trách khám và theo dõi các ca nội tổng quát, tập trung vào trải nghiệm tư vấn rõ ràng, đủ thông tin cho bệnh nhân.",
  clinic: "MediCare Central Clinic",
  email: "doctor.khang@medicare.vn",
  phone: "0901 234 567",
};

export const doctorStats = [
  { label: "Lịch hôm nay", value: "08", tone: "primary" },
  { label: "Chờ xác nhận", value: "03", tone: "warning" },
  { label: "Đã hoàn tất", value: "14", tone: "success" },
  { label: "Thông báo mới", value: "05", tone: "secondary" },
];

export const doctorAppointments = [
  {
    id: "APT-1024",
    patientName: "Trần Hoàng Nam",
    patientAge: 31,
    patientGender: "Nam",
    date: "06/05/2026",
    time: "08:30",
    reason: "Sốt nhẹ, đau họng và mệt mỏi kéo dài 3 ngày.",
    status: "PENDING",
    hasMedicalRecord: false,
    hasPrescription: false,
  },
  {
    id: "APT-1025",
    patientName: "Lê Phương Anh",
    patientAge: 27,
    patientGender: "Nữ",
    date: "06/05/2026",
    time: "10:00",
    reason: "Khám tái phát viêm dạ dày, cần theo dõi thêm.",
    status: "CONFIRMED",
    hasMedicalRecord: true,
    hasPrescription: true,
  },
  {
    id: "APT-1026",
    patientName: "Phạm Quốc Việt",
    patientAge: 45,
    patientGender: "Nam",
    date: "06/05/2026",
    time: "14:15",
    reason: "Đau đầu, chóng mặt và khó ngủ gần 1 tuần.",
    status: "COMPLETED",
    hasMedicalRecord: true,
    hasPrescription: true,
  },
  {
    id: "APT-1027",
    patientName: "Ngô Bích Hà",
    patientAge: 39,
    patientGender: "Nữ",
    date: "07/05/2026",
    time: "09:00",
    reason: "Hủy lịch do bận việc gia đình.",
    status: "CANCELLED",
    hasMedicalRecord: false,
    hasPrescription: false,
  },
];

export const activeAppointment = {
  ...doctorAppointments[1],
  patientPhone: "0988 222 111",
  patientEmail: "phuonganh@gmail.com",
  notes:
    "Bệnh nhân đã từng điều trị viêm dạ dày, cần đánh giá lại chế độ ăn và thuốc đang sử dụng.",
};

export const medicalRecordDetail = {
  id: "MR-2026-019",
  appointmentId: "APT-1025",
  symptoms: "Đau tức vùng thượng vị, đầy hơi sau ăn, khó chịu về đêm.",
  diagnosis: "Viêm dạ dày tái phát mức độ nhẹ.",
  treatmentPlan:
    "Theo dõi chế độ ăn, dùng thuốc giảm tiết acid và tái khám sau 2 tuần nếu triệu chứng chưa giảm.",
  notes: "Hạn chế đồ cay nóng, không bỏ bữa, ngủ đúng giờ.",
  followUpDate: "20/05/2026",
};

export const prescriptionDetail = {
  id: "PR-2026-077",
  appointmentId: "APT-1025",
  doctorName: doctorProfile.fullName,
  patientName: activeAppointment.patientName,
  createdDate: "06/05/2026",
  totalMedicineCost: "185.000đ",
  items: [
    {
      medicine: "Omeprazole 20mg",
      dosePerTime: "1 viên",
      timesPerDay: "2 lần/ngày",
      durationDays: "14 ngày",
      instruction: "Uống trước bữa sáng và tối 30 phút",
      note: "Không tự ý ngừng thuốc",
    },
    {
      medicine: "Sucralfate",
      dosePerTime: "1 gói",
      timesPerDay: "2 lần/ngày",
      durationDays: "10 ngày",
      instruction: "Uống sau ăn 1 giờ",
      note: "Dùng cách thuốc khác ít nhất 2 giờ",
    },
  ],
};

export const doctorReviews = [
  {
    id: "RV-7001",
    patientName: "Lê Phương Anh",
    rating: 5,
    comment: "Bác sĩ tư vấn kỹ, giải thích dễ hiểu và theo dõi rất sát.",
    appointmentId: "APT-1025",
    date: "06/05/2026",
  },
  {
    id: "RV-7002",
    patientName: "Trần Hoàng Nam",
    rating: 4,
    comment: "Khám nhanh, thái độ nhẹ nhàng, cần thêm hướng dẫn dinh dưỡng.",
    appointmentId: "APT-1018",
    date: "03/05/2026",
  },
  {
    id: "RV-7003",
    patientName: "Phạm Quốc Việt",
    rating: 5,
    comment: "Bác sĩ rất tận tâm và đưa kế hoạch điều trị rõ ràng.",
    appointmentId: "APT-1026",
    date: "06/05/2026",
  },
];

export const doctorNotifications = [
  {
    id: "NT-3101",
    title: "Lịch khám mới",
    message: "Bạn có lịch khám mới từ bệnh nhân Trần Hoàng Nam lúc 08:30.",
    type: "APPOINTMENT_CREATED",
    isRead: false,
    createdAt: "5 phút trước",
  },
  {
    id: "NT-3102",
    title: "Lịch khám đã hủy",
    message: "Bệnh nhân Ngô Bích Hà đã hủy lịch khám ngày 07/05/2026.",
    type: "APPOINTMENT_CANCELLED",
    isRead: false,
    createdAt: "30 phút trước",
  },
  {
    id: "NT-3103",
    title: "Nhắc cập nhật hồ sơ",
    message: "2 lịch khám đã hoàn tất nhưng chưa có hồ sơ khám hoàn chỉnh.",
    type: "SYSTEM",
    isRead: true,
    createdAt: "Hôm qua",
  },
];

export const upcomingAppointments = doctorAppointments.filter(
  (appointment) => appointment.status !== "CANCELLED",
).slice(0, 3);
