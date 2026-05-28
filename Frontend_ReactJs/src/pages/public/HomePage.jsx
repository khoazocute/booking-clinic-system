import { useEffect, useMemo, useState } from "react";
import heroDoctorImage from "../../assets/images/homepage/hero-doctor.jpg";
import {
  arrowForwardIcon,
  boltIcon,
  calendarMonthIcon,
  cardiologyIcon,
  childCareIcon,
  creditCardIcon,
  faceIcon,
  factCheckIcon,
  medicalServicesIcon,
  personSearchIcon,
  securityIcon,
  starIcon,
  stethoscopeIcon,
  workHistoryIcon,
  workspacePremiumIcon,
} from "../../assets/icons/homepage";
import { SafeAvatar } from "../../components/common/SafeAvatar";
import { getDoctors } from "../../services/doctorService";
import { getDoctorAvatar } from "../../utils/doctorHelpers";

const copy = {
  heroTitle:
    "Chăm sóc sức khỏe toàn diện, đặt lịch nhanh chóng",
  heroDescription:
    "Giải pháp đặt lịch khám online, chọn bác sĩ chuyên khoa đầu ngành, theo dõi bệnh án và nhận đơn thuốc điện tử ngay tại nhà.",
  heroPrimaryCta: "Đặt lịch ngay",
  heroSecondaryCta: "Xem bác sĩ",
  heroImageAlt: "Bác sĩ tư vấn",
  specialtiesHeading: "Chuyên khoa nổi bật",
  specialtiesDescription: "Các dịch vụ khám chữa bệnh hàng đầu",
  viewAll: "Xem tất cả",
  viewMore: "Xem thêm",
  doctorsHeading: "Bác sĩ tiêu biểu",
  doctorsDescription: "Đội ngũ chuyên gia uy tín hàng đầu",
  consultationFee: "Phí tư vấn",
  doctorDetails: "Xem chi tiết",
  processHeading: "Quy trình đặt lịch đơn giản",
  processDescription:
    "Chỉ với 4 bước nhanh chóng để kết nối với bác sĩ chuyên khoa",
  ctaHeading: "Sẵn sàng để bắt đầu hành trình sức khỏe của bạn?",
  ctaDescription:
    "Đăng ký tài khoản ngay hôm nay để trải nghiệm dịch vụ chăm sóc sức khỏe toàn diện và tiện lợi nhất.",
  ctaPrimary: "Bắt đầu ngay",
  ctaSecondary: "Đăng ký tài khoản",
  copyright: "© 2024 MediCare. Bảo lưu mọi quyền.",
};

const benefits = [
  {
    title: "Đặt lịch nhanh",
    icon: boltIcon,
    description: "Tiết kiệm thời gian chờ đợi.",
  },
  {
    title: "Bác sĩ chuyên gia",
    icon: workspacePremiumIcon,
    description: "Đội ngũ bác sĩ giàu kinh nghiệm từ các bệnh viện lớn.",
  },
  {
    title: "Hồ sơ bảo mật",
    icon: securityIcon,
    description: "Quản lý lịch sử khám và đơn thuốc trực tuyến an toàn.",
  },
  {
    title: "Thanh toán linh hoạt",
    icon: creditCardIcon,
    description: "Đa dạng phương thức thanh toán online tiện lợi.",
  },
];

const specialties = [
  {
    title: "Nội tổng quát",
    icon: stethoscopeIcon,
    description: "Chăm sóc sức khỏe ban đầu toàn diện.",
  },
  {
    title: "Da liễu",
    icon: faceIcon,
    description: "Điều trị các vấn đề về da liễu thẩm mỹ.",
  },
  {
    title: "Tim mạch",
    icon: cardiologyIcon,
    description: "Chuyên khoa tim mạch kỹ thuật cao.",
  },
  {
    title: "Nhi khoa",
    icon: childCareIcon,
    description: "Chăm sóc sức khỏe nhi đồng tận tâm.",
  },
];

const steps = [
  {
    title: "Chọn bác sĩ",
    icon: personSearchIcon,
    description: "Tìm kiếm theo khoa hoặc tên.",
  },
  {
    title: "Chọn khung giờ",
    icon: calendarMonthIcon,
    description: "Lịch khám trống cập nhật thời gian thực.",
  },
  {
    title: "Xác nhận đặt lịch",
    icon: factCheckIcon,
    description: "Nhận thông báo qua SMS hoặc email.",
  },
  {
    title: "Khám và nhận đơn",
    icon: medicalServicesIcon,
    description: "Đến khám đúng giờ và xem đơn thuốc trên ứng dụng.",
  },
];

function IconImage({ src, alt }) {
  return <img className="icon-symbol" src={src} alt={alt} />;
}

function unwrapList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
}

function formatCurrency(value) {
  if (value == null || Number(value) === 0) return "Miễn phí";
  return Number(value).toLocaleString("vi-VN") + "đ";
}

export function HomePage() {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    let active = true;

    getDoctors()
      .then((response) => {
        if (active) {
          setDoctors(unwrapList(response).slice(0, 4));
        }
      })
      .catch(() => {
        if (active) {
          setDoctors([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const featuredDoctors = useMemo(() => doctors.slice(0, 4), [doctors]);

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="site-container hero-grid">
          <div className="hero-copy">
            <h1 className="hero-title">{copy.heroTitle}</h1>
            <p className="hero-description">{copy.heroDescription}</p>

            <div className="hero-actions">
              <a className="button button--primary button--large" href="#booking">
                {copy.heroPrimaryCta}
              </a>
              <a className="button button--secondary button--large" href="#doctors">
                {copy.heroSecondaryCta}
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <img alt={copy.heroImageAlt} src={heroDoctorImage} />
            <div className="hero-visual__overlay" />
          </div>
        </div>
      </section>

      <section className="section-block section-block--surface">
        <div className="site-container benefit-grid">
          {benefits.map((item) => (
            <article className="info-card" key={item.title}>
              <div className="feature-icon">
                <IconImage alt={item.title} src={item.icon} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block section-block--white" id="specialties">
        <div className="site-container">
          <div className="section-heading section-heading--row">
            <div>
              <h2>{copy.specialtiesHeading}</h2>
              <p>{copy.specialtiesDescription}</p>
            </div>
            <a className="section-more" href="/specialties">
              {copy.viewAll}
              <IconImage alt="" src={arrowForwardIcon} />
            </a>
          </div>

          <div className="specialty-grid">
            {specialties.map((item) => (
              <article className="specialty-card" key={item.title}>
                <span className="specialty-icon">
                  <IconImage alt={item.title} src={item.icon} />
                </span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <a className="text-link" href="/specialties">
                  {copy.viewMore}
                  <IconImage alt="" src={arrowForwardIcon} />
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block section-block--surface" id="doctors">
        <div className="site-container">
          <div className="section-heading">
            <h2>{copy.doctorsHeading}</h2>
            <p>{copy.doctorsDescription}</p>
          </div>

          <div className="doctor-grid">
            {featuredDoctors.map((doctor) => (
              <article className="doctor-card" key={doctor.id ?? doctor.fullName}>
                <div className="doctor-image">
                  <SafeAvatar
                    src={doctor.avatarUrl}
                    alt={doctor.fullName}
                    name={doctor.fullName}
                    imageClassName="doctor-image__photo"
                    fallbackClassName="doctor-avatar-initial"
                    defaultSrc={getDoctorAvatar(doctor.id)}
                  />
                </div>
                <div className="doctor-body">
                  <div className="doctor-header">
                    <h3>{doctor.fullName ?? `Bác sĩ #${doctor.id}`}</h3>
                    <span className="doctor-rating">
                      <IconImage alt="" src={starIcon} />
                      {doctor.averageRating != null ? Number(doctor.averageRating).toFixed(1) : "5.0"}
                    </span>
                  </div>
                  <p className="doctor-specialty">{doctor.specialtyName ?? "Chuyên khoa"}</p>
                  <p className="doctor-experience">
                    <IconImage alt="" src={workHistoryIcon} />
                    {doctor.experienceYears != null ? `${doctor.experienceYears} năm kinh nghiệm` : "Chưa cập nhật kinh nghiệm"}
                  </p>
                </div>
                <div className="doctor-footer">
                  <div>
                    <p className="doctor-fee-label">{copy.consultationFee}</p>
                    <strong>{formatCurrency(doctor.consultationFee)}</strong>
                  </div>
                  <a className="button button--soft" href={doctor.id ? `/doctors/${doctor.id}` : "/doctors"}>
                    {copy.doctorDetails}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block section-block--white" id="booking">
        <div className="site-container process-shell">
          <div className="section-heading section-heading--center">
            <h2>{copy.processHeading}</h2>
            <p>{copy.processDescription}</p>
          </div>

          <div className="step-list">
            {steps.map((step, index) => (
              <article className="step-card" key={step.title}>
                <span className="step-index">{index + 1}</span>
                <span className="step-icon">
                  <IconImage alt={step.title} src={step.icon} />
                </span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-strip">
        <div className="site-container cta-banner">
          <h2>{copy.ctaHeading}</h2>
          <p>{copy.ctaDescription}</p>
          <div className="cta-banner__actions">
            <a className="button button--light button--large" href="/booking">
              {copy.ctaPrimary}
            </a>
            <a className="button button--outline-light button--large" href="/register">
              {copy.ctaSecondary}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
