import {
  doctorFourImage,
  doctorOneImage,
  doctorThreeImage,
  doctorTwoImage,
  heroDoctorImage,
} from "../../assets/images/homepage";
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

const benefits = [
  {
    title: "Äáº·t lá»‹ch nhanh",
    icon: boltIcon,
    description: "Tiáº¿t kiá»‡m thá»i gian chá» Ä‘á»£i.",
  },
  {
    title: "BÃ¡c sÄ© chuyÃªn gia",
    icon: workspacePremiumIcon,
    description: "Äá»™i ngÅ© bÃ¡c sÄ© giÃ u kinh nghiá»‡m tá»« cÃ¡c bá»‡nh viá»‡n lá»›n.",
  },
  {
    title: "Há»“ sÆ¡ báº£o máº­t",
    icon: securityIcon,
    description: "Quáº£n lÃ½ lá»‹ch sá»­ khÃ¡m vÃ  Ä‘Æ¡n thuá»‘c trá»±c tuyáº¿n an toÃ n.",
  },
  {
    title: "Thanh toÃ¡n linh hoáº¡t",
    icon: creditCardIcon,
    description: "Äa dáº¡ng phÆ°Æ¡ng thá»©c thanh toÃ¡n online tiá»‡n lá»£i.",
  },
];

const specialties = [
  {
    title: "Ná»™i tá»•ng quÃ¡t",
    icon: stethoscopeIcon,
    description: "ChÄƒm sÃ³c sá»©c khá»e ban Ä‘áº§u toÃ n diá»‡n.",
  },
  {
    title: "Da liá»…u",
    icon: faceIcon,
    description: "Äiá»u trá»‹ cÃ¡c váº¥n Ä‘á» vá» da liá»…u tháº©m má»¹.",
  },
  {
    title: "Tim máº¡ch",
    icon: cardiologyIcon,
    description: "ChuyÃªn khoa tim máº¡ch ká»¹ thuáº­t cao.",
  },
  {
    title: "Nhi khoa",
    icon: childCareIcon,
    description: "ChÄƒm sÃ³c sá»©c khá»e nhi Ä‘á»“ng táº­n tÃ¢m.",
  },
];

const doctors = [
  {
    name: "PGS.TS. Nguyá»…n VÄƒn A",
    specialty: "Tim máº¡ch",
    experience: "15 nÄƒm kinh nghiá»‡m",
    rating: "4.9",
    fee: "300.000Ä‘",
    image: doctorOneImage,
  },
  {
    name: "ThS.BS. Tráº§n Thá»‹ B",
    specialty: "Nhi khoa",
    experience: "10 nÄƒm kinh nghiá»‡m",
    rating: "4.8",
    fee: "250.000Ä‘",
    image: doctorTwoImage,
  },
  {
    name: "BS.CKII. LÃª VÄƒn C",
    specialty: "Ná»™i tá»•ng quÃ¡t",
    experience: "20 nÄƒm kinh nghiá»‡m",
    rating: "5.0",
    fee: "400.000Ä‘",
    image: doctorThreeImage,
  },
  {
    name: "BS. Pháº¡m Thá»‹ D",
    specialty: "Da liá»…u",
    experience: "8 nÄƒm kinh nghiá»‡m",
    rating: "4.7",
    fee: "200.000Ä‘",
    image: doctorFourImage,
  },
];

const steps = [
  {
    title: "Chá»n bÃ¡c sÄ©",
    icon: personSearchIcon,
    description: "TÃ¬m kiáº¿m theo khoa hoáº·c tÃªn.",
  },
  {
    title: "Chá»n khung giá»",
    icon: calendarMonthIcon,
    description: "Lá»‹ch khÃ¡m trá»‘ng cáº­p nháº­t thá»i gian thá»±c.",
  },
  {
    title: "XÃ¡c nháº­n Ä‘áº·t lá»‹ch",
    icon: factCheckIcon,
    description: "Nháº­n thÃ´ng bÃ¡o qua SMS hoáº·c email.",
  },
  {
    title: "KhÃ¡m vÃ  nháº­n Ä‘Æ¡n",
    icon: medicalServicesIcon,
    description: "Äáº¿n khÃ¡m Ä‘Ãºng giá» vÃ  xem Ä‘Æ¡n thuá»‘c trÃªn á»©ng dá»¥ng.",
  },
];

function IconImage({ src, alt }) {
  return <img className="icon-symbol" src={src} alt={alt} />;
}

export function HomePage() {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="site-container hero-grid">
          <div className="hero-copy">
            <h1 className="hero-title">
              ChÄƒm sÃ³c sá»©c khá»e toÃ n diá»‡n, Ä‘áº·t lá»‹ch nhanh chÃ³ng
            </h1>
            <p className="hero-description">
              Giáº£i phÃ¡p Ä‘áº·t lá»‹ch khÃ¡m online, chá»n bÃ¡c sÄ© chuyÃªn khoa Ä‘áº§u
              ngÃ nh, theo dÃµi bá»‡nh Ã¡n vÃ  nháº­n Ä‘Æ¡n thuá»‘c Ä‘iá»‡n tá»­ ngay táº¡i nhÃ .
            </p>

            <div className="hero-actions">
              <a className="button button--primary button--large" href="#booking">
                Äáº·t lá»‹ch ngay
              </a>
              <a className="button button--secondary button--large" href="#doctors">
                Xem bÃ¡c sÄ©
              </a>
            </div>
          </div>

          <div className="hero-visual">
            <img alt="BÃ¡c sÄ© tÆ° váº¥n" src={heroDoctorImage} />
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
              <h2>ChuyÃªn khoa ná»•i báº­t</h2>
              <p>CÃ¡c dá»‹ch vá»¥ khÃ¡m chá»¯a bá»‡nh hÃ ng Ä‘áº§u</p>
            </div>
            <a className="section-more" href="/specialties">
              Xem táº¥t cáº£
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
                  Xem thÃªm
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
            <h2>BÃ¡c sÄ© tiÃªu biá»ƒu</h2>
            <p>Äá»™i ngÅ© chuyÃªn gia uy tÃ­n hÃ ng Ä‘áº§u</p>
          </div>

          <div className="doctor-grid">
            {doctors.map((doctor) => (
              <article className="doctor-card" key={doctor.name}>
                <div className="doctor-image">
                  <img alt={doctor.name} src={doctor.image} />
                </div>
                <div className="doctor-body">
                  <div className="doctor-header">
                    <h3>{doctor.name}</h3>
                    <span className="doctor-rating">
                      <IconImage alt="" src={starIcon} />
                      {doctor.rating}
                    </span>
                  </div>
                  <p className="doctor-specialty">{doctor.specialty}</p>
                  <p className="doctor-experience">
                    <IconImage alt="" src={workHistoryIcon} />
                    {doctor.experience}
                  </p>
                </div>
                <div className="doctor-footer">
                  <div>
                    <p className="doctor-fee-label">PhÃ­ tÆ° váº¥n</p>
                    <strong>{doctor.fee}</strong>
                  </div>
                  <a className="button button--soft" href="/doctors">
                    Xem chi tiáº¿t
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
            <h2>Quy trÃ¬nh Ä‘áº·t lá»‹ch Ä‘Æ¡n giáº£n</h2>
            <p>Chá»‰ vá»›i 4 bÆ°á»›c nhanh chÃ³ng Ä‘á»ƒ káº¿t ná»‘i vá»›i bÃ¡c sÄ© chuyÃªn khoa</p>
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
          <h2>Sáºµn sÃ ng Ä‘á»ƒ báº¯t Ä‘áº§u hÃ nh trÃ¬nh sá»©c khá»e cá»§a báº¡n?</h2>
          <p>
            ÄÄƒng kÃ½ tÃ i khoáº£n ngay hÃ´m nay Ä‘á»ƒ tráº£i nghiá»‡m dá»‹ch vá»¥ chÄƒm sÃ³c sá»©c
            khá»e toÃ n diá»‡n vÃ  tiá»‡n lá»£i nháº¥t.
          </p>
          <div className="cta-banner__actions">
            <a className="button button--light button--large" href="/booking">
              Báº¯t Ä‘áº§u ngay
            </a>
            <a className="button button--outline-light button--large" href="/register">
              ÄÄƒng kÃ½ tÃ i khoáº£n
            </a>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-container footer-shell">
          <div className="footer-brand">
            <span className="footer-logo">MediCare</span>
            <div className="footer-contact">
              <p>
                <IconImage alt="" src={locationOnIcon} />
                123 Healthcare Ave, Medical District
              </p>
              <p>
                <IconImage alt="" src={mailIcon} />
                contact@medicare.vn
              </p>
              <p>
                <IconImage alt="" src={phoneIcon} />
                1900 1234
              </p>
            </div>
          </div>

          <div className="footer-links">
            <a href="/">Privacy Policy</a>
            <a href="/">Terms of Service</a>
            <a href="/">Contact Support</a>
            <a href="/">Careers</a>
            <a href="/">Help Center</a>
          </div>
        </div>

        <div className="site-container footer-bottom">
          Â© 2024 MediCare Systems. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
