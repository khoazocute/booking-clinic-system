import { useEffect, useState } from "react";
import { heroDoctorImage } from "../../assets/images/homepage";
import { getDoctors } from "../../services/doctorService";
import { SafeAvatar } from "../../components/common/SafeAvatar";
import {
  arrowForwardIcon,
  boltIcon,
  calendarMonthIcon,
  cardiologyIcon,
  childCareIcon,
  creditCardIcon,
  faceIcon,
  factCheckIcon,
  locationOnIcon,
  mailIcon,
  medicalServicesIcon,
  personSearchIcon,
  phoneIcon,
  securityIcon,
  starIcon,
  stethoscopeIcon,
  workHistoryIcon,
  workspacePremiumIcon,
} from "../../assets/icons/homepage";

const copy = {
  heroTitle:
    "Ch\u0103m s\u00f3c s\u1ee9c kh\u1ecfe to\u00e0n di\u1ec7n, \u0111\u1eb7t l\u1ecbch nhanh ch\u00f3ng",
  heroDescription:
    "Gi\u1ea3i ph\u00e1p \u0111\u1eb7t l\u1ecbch kh\u00e1m online, ch\u1ecdn b\u00e1c s\u0129 chuy\u00ean khoa \u0111\u1ea7u ng\u00e0nh, theo d\u00f5i b\u1ec7nh \u00e1n v\u00e0 nh\u1eadn \u0111\u01a1n thu\u1ed1c \u0111i\u1ec7n t\u1eed ngay t\u1ea1i nh\u00e0.",
  heroPrimaryCta: "\u0110\u1eb7t l\u1ecbch ngay",
  heroSecondaryCta: "Xem b\u00e1c s\u0129",
  heroImageAlt: "B\u00e1c s\u0129 t\u01b0 v\u1ea5n",
  specialtiesHeading: "Chuy\u00ean khoa n\u1ed5i b\u1eadt",
  specialtiesDescription: "C\u00e1c d\u1ecbch v\u1ee5 kh\u00e1m ch\u1eefa b\u1ec7nh h\u00e0ng \u0111\u1ea7u",
  viewAll: "Xem t\u1ea5t c\u1ea3",
  viewMore: "Xem th\u00eam",
  doctorsHeading: "B\u00e1c s\u0129 ti\u00eau bi\u1ec3u",
  doctorsDescription: "\u0110\u1ed9i ng\u0169 chuy\u00ean gia uy t\u00edn h\u00e0ng \u0111\u1ea7u",
  consultationFee: "Ph\u00ed t\u01b0 v\u1ea5n",
  doctorDetails: "Xem chi ti\u1ebft",
  processHeading: "Quy tr\u00ecnh \u0111\u1eb7t l\u1ecbch \u0111\u01a1n gi\u1ea3n",
  processDescription:
    "Ch\u1ec9 v\u1edbi 4 b\u01b0\u1edbc nhanh ch\u00f3ng \u0111\u1ec3 k\u1ebft n\u1ed1i v\u1edbi b\u00e1c s\u0129 chuy\u00ean khoa",
  ctaHeading: "S\u1eb5n s\u00e0ng \u0111\u1ec3 b\u1eaft \u0111\u1ea7u h\u00e0nh tr\u00ecnh s\u1ee9c kh\u1ecfe c\u1ee7a b\u1ea1n?",
  ctaDescription:
    "\u0110\u0103ng k\u00fd t\u00e0i kho\u1ea3n ngay h\u00f4m nay \u0111\u1ec3 tr\u1ea3i nghi\u1ec7m d\u1ecbch v\u1ee5 ch\u0103m s\u00f3c s\u1ee9c kh\u1ecfe to\u00e0n di\u1ec7n v\u00e0 ti\u1ec7n l\u1ee3i nh\u1ea5t.",
  ctaPrimary: "B\u1eaft \u0111\u1ea7u ngay",
  ctaSecondary: "\u0110\u0103ng k\u00fd t\u00e0i kho\u1ea3n",
  copyright: "\u00a9 2024 MediCare. Bảo lưu mọi quyền.",
};

const benefits = [
  {
    title: "\u0110\u1eb7t l\u1ecbch nhanh",
    icon: boltIcon,
    description: "Ti\u1ebft ki\u1ec7m th\u1eddi gian ch\u1edd \u0111\u1ee3i.",
  },
  {
    title: "B\u00e1c s\u0129 chuy\u00ean gia",
    icon: workspacePremiumIcon,
    description: "\u0110\u1ed9i ng\u0169 b\u00e1c s\u0129 gi\u00e0u kinh nghi\u1ec7m t\u1eeb c\u00e1c b\u1ec7nh vi\u1ec7n l\u1edbn.",
  },
  {
    title: "H\u1ed3 s\u01a1 b\u1ea3o m\u1eadt",
    icon: securityIcon,
    description: "Qu\u1ea3n l\u00fd l\u1ecbch s\u1eed kh\u00e1m v\u00e0 \u0111\u01a1n thu\u1ed1c tr\u1ef1c tuy\u1ebfn an to\u00e0n.",
  },
  {
    title: "Thanh to\u00e1n linh ho\u1ea1t",
    icon: creditCardIcon,
    description: "\u0110a d\u1ea1ng ph\u01b0\u01a1ng th\u1ee9c thanh to\u00e1n online ti\u1ec7n l\u1ee3i.",
  },
];

const specialties = [
  {
    title: "N\u1ed9i t\u1ed5ng qu\u00e1t",
    icon: stethoscopeIcon,
    description: "Ch\u0103m s\u00f3c s\u1ee9c kh\u1ecfe ban \u0111\u1ea7u to\u00e0n di\u1ec7n.",
  },
  {
    title: "Da li\u1ec5u",
    icon: faceIcon,
    description: "\u0110i\u1ec1u tr\u1ecb c\u00e1c v\u1ea5n \u0111\u1ec1 v\u1ec1 da li\u1ec5u th\u1ea9m m\u1ef9.",
  },
  {
    title: "Tim m\u1ea1ch",
    icon: cardiologyIcon,
    description: "Chuy\u00ean khoa tim m\u1ea1ch k\u1ef9 thu\u1eadt cao.",
  },
  {
    title: "Nhi khoa",
    icon: childCareIcon,
    description: "Ch\u0103m s\u00f3c s\u1ee9c kh\u1ecfe nhi \u0111\u1ed3ng t\u1eadn t\u00e2m.",
  },
];



const steps = [
  {
    title: "Ch\u1ecdn b\u00e1c s\u0129",
    icon: personSearchIcon,
    description: "T\u00ecm ki\u1ebfm theo khoa ho\u1eb7c t\u00ean.",
  },
  {
    title: "Ch\u1ecdn khung gi\u1edd",
    icon: calendarMonthIcon,
    description: "L\u1ecbch kh\u00e1m tr\u1ed1ng c\u1eadp nh\u1eadt th\u1eddi gian th\u1ef1c.",
  },
  {
    title: "X\u00e1c nh\u1eadn \u0111\u1eb7t l\u1ecbch",
    icon: factCheckIcon,
    description: "Nh\u1eadn th\u00f4ng b\u00e1o qua SMS ho\u1eb7c email.",
  },
  {
    title: "Kh\u00e1m v\u00e0 nh\u1eadn \u0111\u01a1n",
    icon: medicalServicesIcon,
    description: "\u0110\u1ebfn kh\u00e1m \u0111\u00fang gi\u1edd v\u00e0 xem \u0111\u01a1n thu\u1ed1c tr\u00ean \u1ee9ng d\u1ee5ng.",
  },
];

function IconImage({ src, alt }) {
  return <img className="icon-symbol" src={src} alt={alt} />;
}

export function HomePage() {
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  useEffect(() => {
    let active = true;
    getDoctors()
      .then((res) => {
        if (!active) return;
        const allDoctors = res?.data?.items ?? res?.data ?? [];
        const sorted = [...allDoctors].sort((a, b) => {
          const ratingA = a.averageRating == null ? 0 : Number(a.averageRating);
          const ratingB = b.averageRating == null ? 0 : Number(b.averageRating);
          return ratingB - ratingA;
        });
        setFeaturedDoctors(sorted.slice(0, 4));
        setLoadingDoctors(false);
      })
      .catch((err) => {
        console.error("Failed to fetch doctors", err);
        if (active) setLoadingDoctors(false);
      });

    return () => {
      active = false;
    };
  }, []);

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
            {loadingDoctors ? (
              <p style={{ textAlign: "center", gridColumn: "1 / -1", padding: "2rem" }}>Đang tải danh sách bác sĩ...</p>
            ) : featuredDoctors.length === 0 ? (
              <p style={{ textAlign: "center", gridColumn: "1 / -1", padding: "2rem" }}>Chưa có dữ liệu bác sĩ.</p>
            ) : (
              featuredDoctors.map((doctor) => (
                <article className="doctor-card" key={doctor.id}>
                  <div className="doctor-image">
                    <SafeAvatar
                      src={doctor.avatarUrl}
                      fallbackSrc="/default-doctor.png"
                      name={doctor.fullName}
                      imageClassName=""
                      fallbackClassName="mc-avatar-initial"
                    />
                  </div>
                  <div className="doctor-body">
                    <div className="doctor-header">
                      <h3>{doctor.fullName ?? `Bác sĩ #${doctor.id}`}</h3>
                      <span className="doctor-rating">
                        <IconImage alt="" src={starIcon} />
                        {doctor.averageRating != null ? Number(doctor.averageRating).toFixed(1) : "0.0"}
                      </span>
                    </div>
                    <p className="doctor-specialty">{doctor.specialtyName ?? "Chuyên khoa"}</p>
                    <p className="doctor-experience">
                      <IconImage alt="" src={workHistoryIcon} />
                      {doctor.experienceYears != null ? `${doctor.experienceYears} năm kinh nghiệm` : "Chưa cập nhật"}
                    </p>
                  </div>
                  <div className="doctor-footer">
                    <div>
                      <p className="doctor-fee-label">{copy.consultationFee}</p>
                      <strong>
                        {doctor.consultationFee == null || Number(doctor.consultationFee) <= 0
                          ? "Chưa cập nhật"
                          : `${Number(doctor.consultationFee).toLocaleString("vi-VN")} đ`}
                      </strong>
                    </div>
                    <a className="button button--soft" href={`/doctors/${doctor.id}`}>
                      {copy.doctorDetails}
                    </a>
                  </div>
                </article>
              ))
            )}
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
