import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { DoctorWorkspace } from "../../components/doctor/DoctorWorkspace";
import { getPrescriptionById } from "../../services/doctorPortalService";
import { formatCurrency, formatDateTime } from "../../utils/doctorHelpers";

export function PrescriptionDetailPage() {
  const { prescriptionId } = useParams();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pharmacySent, setPharmacySent] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPrescription() {
      try {
        const data = await getPrescriptionById(prescriptionId);
        if (active) {
          setPrescription(data);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPrescription();

    return () => {
      active = false;
    };
  }, [prescriptionId]);

  const medicineCount = prescription?.items?.length ?? 0;

  const timelineItems = useMemo(() => {
    if (!prescription) {
      return [];
    }

    return [
      {
        title: "Đã tạo đơn thuốc",
        subtitle: formatDateTime(prescription.createdAt),
        tone: "done",
      },
      {
        title: "Gửi đến nhà thuốc",
        subtitle: pharmacySent ? "Đang chờ nhà thuốc xử lý" : "Chưa gửi",
        tone: pharmacySent ? "progress" : "pending",
      },
      {
        title: "Sẵn sàng nhận thuốc",
        subtitle: "Chờ nhà thuốc xác nhận",
        tone: "pending",
      },
    ];
  }, [pharmacySent, prescription]);

  function handlePrint() {
    window.print();
  }

  function handleDownloadPdf() {
    window.print();
  }

  return (
    <DoctorWorkspace
      eyebrow={`Bác sĩ / Đơn thuốc / #RX-${prescriptionId ?? ""}`}
      title={prescription ? `Đơn thuốc ${prescription.id}` : "Chi tiết đơn thuốc"}
      description="Rà soát đơn thuốc, hướng dẫn dùng thuốc và tổng chi phí."
      actions={
        prescription ? (
          <>
            <button className="button button--secondary" type="button" onClick={handlePrint}>
              In đơn
            </button>
            <button className="button button--secondary" type="button" onClick={handleDownloadPdf}>
              Tải PDF
            </button>
            <button
              className="button button--primary"
              type="button"
              onClick={() => setPharmacySent(true)}
            >
              Gửi nhà thuốc
            </button>
          </>
        ) : null
      }
    >
      {error ? <p className="empty-state">{error}</p> : null}
      {loading ? (
        <p className="empty-state">Đang tải đơn thuốc...</p>
      ) : prescription ? (
        <section className="doctor-prescription-layout">
          <aside className="doctor-prescription-sidebar">
            <article className="doctor-prescription-card">
              <div className="doctor-prescription-card__title">
                <span className="doctor-prescription-card__icon material-symbols-outlined">
                  person
                </span>
                <div>
                  <h2>Thông tin bệnh nhân</h2>
                  <p>Thông tin chính gắn với đơn thuốc này.</p>
                </div>
              </div>

              <div className="doctor-prescription-meta">
                <div>
                  <span>Tên bệnh nhân</span>
                  <strong>{prescription.patientName}</strong>
                </div>
                <div>
                  <span>Mã bệnh nhân</span>
                  <strong>P-{prescription.patientId ?? "--"}</strong>
                </div>
                <div>
                  <span>Thời gian tạo</span>
                  <strong>{formatDateTime(prescription.createdAt)}</strong>
                </div>
                <div>
                  <span>Ghi chú chung</span>
                  <div className="doctor-prescription-note">
                    {prescription.generalNote || "--"}
                  </div>
                </div>
              </div>

              <div className="doctor-prescription-total">
                <span>Tổng tiền thuốc</span>
                <strong>{formatCurrency(prescription.totalMedicineFee)}</strong>
              </div>
            </article>

            <article className="doctor-prescription-card doctor-prescription-card--timeline">
              <div className="doctor-prescription-card__title">
                <span className="doctor-prescription-card__icon material-symbols-outlined">
                  local_pharmacy
                </span>
                <div>
                  <h2>Trạng thái nhà thuốc</h2>
                  <p>Theo dõi trạng thái xử lý đơn thuốc.</p>
                </div>
              </div>

              <div className="doctor-prescription-timeline">
                {timelineItems.map((item, index) => (
                  <div className="doctor-prescription-timeline__item" key={`${item.title}-${index}`}>
                    <span
                      className={`doctor-prescription-timeline__dot doctor-prescription-timeline__dot--${item.tone}`}
                    />
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.subtitle}</small>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </aside>

          <div className="doctor-prescription-main">
            <article className="doctor-prescription-card doctor-prescription-card--items">
              <div className="doctor-prescription-card__head">
                <div className="doctor-prescription-card__title">
                  <div>
                    <h2>Danh sách thuốc</h2>
                    <p>Chi tiết liều dùng và hướng dẫn.</p>
                  </div>
                </div>
                <span className="doctor-prescription-pill">
                  {medicineCount} thuốc đã thêm
                </span>
              </div>

              <div className="doctor-prescription-items">
                {prescription.items?.map((item) => (
                  <article className="doctor-prescription-item" key={item.id}>
                    <div className="doctor-prescription-item__head">
                      <div className="doctor-prescription-item__icon material-symbols-outlined">
                        medication
                      </div>
                      <div className="doctor-prescription-item__title">
                        <h3>{item.medicineName}</h3>
                        <p>{item.dosageText || "Kế hoạch dùng thuốc"}</p>
                      </div>
                      <div className="doctor-prescription-item__price">
                        <strong>{formatCurrency(item.lineTotal)}</strong>
                        <span>Thành tiền</span>
                      </div>
                    </div>

                    <div className="doctor-prescription-item__stats">
                      <div>
                        <span>Liều dùng</span>
                        <strong>{item.dosePerTime} mỗi lần</strong>
                      </div>
                      <div>
                        <span>Tần suất</span>
                        <strong>{item.timesPerDay} lần/ngày</strong>
                      </div>
                      <div>
                        <span>Thời gian</span>
                        <strong>{item.durationDays} ngày</strong>
                      </div>
                      <div>
                        <span>Số lượng</span>
                        <strong>{item.quantity} đơn vị</strong>
                      </div>
                    </div>

                    <div className="doctor-prescription-item__usage">
                      <span className="material-symbols-outlined">info</span>
                      <span>
                        Cách dùng: {item.instruction || item.note || "Dùng theo hướng dẫn của bác sĩ."}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <article className="doctor-prescription-verification">
              <div className="doctor-prescription-verification__badge">
                <span className="material-symbols-outlined">verified_user</span>
                <div>
                  <strong>Đã xác thực lâm sàng</strong>
                  <span>Chứng nhận số có hiệu lực đến năm 2027</span>
                </div>
              </div>

              <div className="doctor-prescription-verification__signature">
                <p>{prescription.doctorName}</p>
                <strong>Dr. {prescription.doctorName}</strong>
                <span>Bác sĩ kê đơn</span>
              </div>
            </article>
          </div>
        </section>
      ) : (
        <p className="empty-state">Không tìm thấy đơn thuốc.</p>
      )}
    </DoctorWorkspace>
  );
}
