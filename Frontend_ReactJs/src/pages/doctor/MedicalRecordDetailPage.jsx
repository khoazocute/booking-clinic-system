import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DoctorWorkspace } from "../../components/doctor/DoctorWorkspace";
import {
  getMedicalRecordById,
  getPrescriptionByMedicalRecordId,
} from "../../services/doctorPortalService";
import { formatCurrency, formatDate, formatDateTime } from "../../utils/doctorHelpers";

export function MedicalRecordDetailPage() {
  const { medicalRecordId } = useParams();
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMedicalRecord() {
      try {
        const medicalRecordData = await getMedicalRecordById(medicalRecordId);
        let prescriptionData = null;

        try {
          prescriptionData = await getPrescriptionByMedicalRecordId(medicalRecordId);
        } catch {
          prescriptionData = null;
        }

        if (!active) {
          return;
        }

        setMedicalRecord(medicalRecordData);
        setPrescription(prescriptionData);
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

    loadMedicalRecord();

    return () => {
      active = false;
    };
  }, [medicalRecordId]);

  function handlePrint() {
    window.print();
  }

  async function handleShare() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
      }
    } catch {
      // Ignore clipboard errors for now.
    }
  }

  const treatmentSteps = String(medicalRecord?.treatmentPlan ?? "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <DoctorWorkspace
      eyebrow={`Tổng quan / Bệnh nhân / ${medicalRecord?.patientName ?? "Hồ sơ"} / Hồ sơ #${medicalRecordId ?? ""}`}
      title={medicalRecord ? `Hồ sơ bệnh án #${medicalRecord.id}` : "Chi tiết hồ sơ bệnh án"}
      description={medicalRecord?.notes || "Rà soát hồ sơ bệnh án trước khi kê đơn và theo dõi điều trị."}
      actions={
        medicalRecord ? (
          <>
            <button className="button button--secondary" type="button" onClick={handlePrint}>
              In hồ sơ
            </button>
            <button className="button button--secondary" type="button" onClick={handleShare}>
              Chia sẻ
            </button>
            {prescription ? (
              <Link className="button button--primary" to={`/doctor/prescriptions/${prescription.id}`}>
                Xem đơn thuốc
              </Link>
            ) : (
              <Link className="button button--primary" to={`/doctor/prescriptions/create/${medicalRecord.id}`}>
                Tạo đơn thuốc
              </Link>
            )}
          </>
        ) : null
      }
    >
      {error ? <p className="empty-state">{error}</p> : null}
      {loading ? (
        <p className="empty-state">Đang tải hồ sơ bệnh án...</p>
      ) : medicalRecord ? (
        <section className="doctor-record-layout">
          <div className="doctor-record-top">
            <article className="doctor-record-card doctor-record-card--summary">
              <div className="doctor-record-card__title">
                <span className="doctor-record-card__icon doctor-record-card__icon--primary material-symbols-outlined">
                  person
                </span>
                <div>
                  <h2>Tóm tắt bệnh nhân</h2>
                  <p>Thông tin chính của bệnh nhân và bác sĩ phụ trách.</p>
                </div>
              </div>

              <div className="doctor-record-summary-grid">
                <div>
                  <span>Họ tên</span>
                  <strong>{medicalRecord.patientName}</strong>
                </div>
                <div>
                  <span>Mã bệnh nhân</span>
                  <strong>#{medicalRecord.patientId ?? "--"}</strong>
                </div>
                <div>
                  <span>Mã lịch hẹn</span>
                  <strong>#{medicalRecord.appointmentId ?? "--"}</strong>
                </div>
                <div>
                  <span>Bác sĩ phụ trách</span>
                  <strong>{medicalRecord.doctorName}</strong>
                </div>
              </div>
            </article>

            <article className="doctor-record-card doctor-record-card--symptoms">
              <div className="doctor-record-card__title">
                <span className="doctor-record-card__icon doctor-record-card__icon--danger material-symbols-outlined">
                  ecg_heart
                </span>
                <div>
                  <h2>Triệu chứng và ghi nhận</h2>
                  <p>Khiếu nại chính và các vấn đề lâm sàng được ghi nhận.</p>
                </div>
              </div>

              <div className="doctor-record-symptoms">
                <div>
                  <span>Triệu chứng chính</span>
                  <p>{medicalRecord.symptoms}</p>
                </div>
                <div className="doctor-record-tags">
                  {String(medicalRecord.symptoms)
                    .split(/[,.]/)
                    .map((item) => item.trim())
                    .filter(Boolean)
                    .slice(0, 4)
                    .map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                </div>
              </div>
            </article>
          </div>

          <article className="doctor-record-card doctor-record-card--diagnosis">
            <div className="doctor-record-card__title doctor-record-card__title--between">
              <div className="doctor-record-card__title">
                <span className="doctor-record-card__icon doctor-record-card__icon--primary material-symbols-outlined">
                  checklist
                </span>
                <div>
                  <h2>Chẩn đoán</h2>
                  <p>Kết luận cuối cùng từ buổi khám.</p>
                </div>
              </div>
              <span className="doctor-record-code">Hồ sơ #{medicalRecord.id}</span>
            </div>

            <h3 className="doctor-record-diagnosis">{medicalRecord.diagnosis}</h3>
            <p className="doctor-record-diagnosis-note">
              {medicalRecord.notes || "Chưa có ghi chú chẩn đoán bổ sung."}
            </p>
          </article>

          <div className="doctor-record-lower">
            <article className="doctor-record-card">
              <div className="doctor-record-card__title">
                <span className="doctor-record-card__icon doctor-record-card__icon--success material-symbols-outlined">
                  medical_services
                </span>
                <div>
                  <h2>Kế hoạch điều trị</h2>
                  <p>Trình tự chăm sóc đề xuất và hướng theo dõi.</p>
                </div>
              </div>

              <div className="doctor-record-plan">
                {(treatmentSteps.length ? treatmentSteps : [medicalRecord.treatmentPlan]).map((step, index) => (
                  <div key={`${index + 1}-${step}`} className="doctor-record-plan__step">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <strong>
                        {index === 0
                          ? "Can thiệp chính"
                          : index === 1
                            ? "Hỗ trợ triệu chứng"
                            : `Bước điều trị ${index + 1}`}
                      </strong>
                      <p>{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <aside className="doctor-record-prescription">
              <div className="doctor-record-prescription__head">
                <span className="material-symbols-outlined">prescriptions</span>
                <div>
                  <h2>Đơn thuốc hiện tại</h2>
                  <p>
                    {prescription
                      ? "Hướng dẫn dùng thuốc hiện tại gắn với hồ sơ bệnh án này."
                      : "Chưa có đơn thuốc nào được tạo."}
                  </p>
                </div>
              </div>

              {prescription ? (
                <>
                  <div className="doctor-record-prescription__items">
                    {prescription.items?.slice(0, 4).map((item) => (
                      <div
                        key={item.id ?? `${item.medicineName}-${item.dosePerTime}`}
                        className="doctor-record-prescription__item"
                      >
                        <strong>{item.medicineName}</strong>
                        <span>
                          {item.dosePerTime} {item.unit || ""} • {item.timesPerDay} lần/ngày •{" "}
                          {item.durationDays} ngày
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="doctor-record-prescription__footer">
                    <span>Tổng tiền thuốc</span>
                    <strong>{formatCurrency(prescription.totalMedicineFee)}</strong>
                  </div>
                </>
              ) : (
                <div className="doctor-record-prescription__empty">
                  <p>Tạo đơn thuốc để gắn hướng dẫn dùng thuốc vào hồ sơ bệnh án này.</p>
                  <Link className="button button--light" to={`/doctor/prescriptions/create/${medicalRecord.id}`}>
                    Tạo đơn thuốc
                  </Link>
                </div>
              )}
            </aside>
          </div>

          <article className="doctor-record-footer">
            <div>
              <span>Ngày tái khám</span>
              <strong>{medicalRecord.followUpDate ? formatDate(medicalRecord.followUpDate) : "--"}</strong>
            </div>
            <div>
              <span>Thời gian tạo hồ sơ</span>
              <strong>{formatDateTime(medicalRecord.createdAt)}</strong>
            </div>
            <div>
              <span>Chữ ký bác sĩ</span>
              <strong>{medicalRecord.doctorName}</strong>
            </div>
          </article>
        </section>
      ) : (
        <p className="empty-state">Không tìm thấy hồ sơ bệnh án.</p>
      )}
    </DoctorWorkspace>
  );
}
