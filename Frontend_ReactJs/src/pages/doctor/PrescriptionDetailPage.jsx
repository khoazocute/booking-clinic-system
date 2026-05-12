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
        title: "Prescription Created",
        subtitle: formatDateTime(prescription.createdAt),
        tone: "done",
      },
      {
        title: "Sent to Pharmacy",
        subtitle: pharmacySent ? "Queued for fulfillment" : "Waiting to send",
        tone: pharmacySent ? "progress" : "pending",
      },
      {
        title: "Ready for Pickup",
        subtitle: "Pending pharmacy confirmation",
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
      eyebrow={`Doctor / Prescriptions / #RX-${prescriptionId ?? ""}`}
      title={prescription ? `Prescription ${prescription.id}` : "Prescription detail"}
      description="Rao soat don thuoc, huong dan dung thuoc va tong chi phi."
      actions={
        prescription ? (
          <>
            <button className="button button--secondary" type="button" onClick={handlePrint}>
              Print
            </button>
            <button className="button button--secondary" type="button" onClick={handleDownloadPdf}>
              Download PDF
            </button>
            <button
              className="button button--primary"
              type="button"
              onClick={() => setPharmacySent(true)}
            >
              Send to Pharmacy
            </button>
          </>
        ) : null
      }
    >
      {error ? <p className="empty-state">{error}</p> : null}
      {loading ? (
        <p className="empty-state">Loading prescription...</p>
      ) : prescription ? (
        <section className="doctor-prescription-layout">
          <aside className="doctor-prescription-sidebar">
            <article className="doctor-prescription-card">
              <div className="doctor-prescription-card__title">
                <span className="doctor-prescription-card__icon material-symbols-outlined">
                  person
                </span>
                <div>
                  <h2>Patient Information</h2>
                  <p>Core details attached to this prescription.</p>
                </div>
              </div>

              <div className="doctor-prescription-meta">
                <div>
                  <span>Patient name</span>
                  <strong>{prescription.patientName}</strong>
                </div>
                <div>
                  <span>Patient ID</span>
                  <strong>P-{prescription.patientId ?? "--"}</strong>
                </div>
                <div>
                  <span>Created at</span>
                  <strong>{formatDateTime(prescription.createdAt)}</strong>
                </div>
                <div>
                  <span>General note</span>
                  <div className="doctor-prescription-note">
                    {prescription.generalNote || "--"}
                  </div>
                </div>
              </div>

              <div className="doctor-prescription-total">
                <span>Total medicine fee</span>
                <strong>{formatCurrency(prescription.totalMedicineFee)}</strong>
              </div>
            </article>

            <article className="doctor-prescription-card doctor-prescription-card--timeline">
              <div className="doctor-prescription-card__title">
                <span className="doctor-prescription-card__icon material-symbols-outlined">
                  local_pharmacy
                </span>
                <div>
                  <h2>Pharmacy Status</h2>
                  <p>Track the current handoff state.</p>
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
                    <h2>Medicine items</h2>
                    <p>Chi tiet lieu dung va huong dan.</p>
                  </div>
                </div>
                <span className="doctor-prescription-pill">
                  {medicineCount} medication{medicineCount > 1 ? "s" : ""} added
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
                        <p>{item.dosageText || "Medication plan"}</p>
                      </div>
                      <div className="doctor-prescription-item__price">
                        <strong>{formatCurrency(item.lineTotal)}</strong>
                        <span>Line total</span>
                      </div>
                    </div>

                    <div className="doctor-prescription-item__stats">
                      <div>
                        <span>Dosage</span>
                        <strong>{item.dosePerTime} per time</strong>
                      </div>
                      <div>
                        <span>Frequency</span>
                        <strong>{item.timesPerDay} times/day</strong>
                      </div>
                      <div>
                        <span>Duration</span>
                        <strong>{item.durationDays} day{item.durationDays > 1 ? "s" : ""}</strong>
                      </div>
                      <div>
                        <span>Quantity</span>
                        <strong>{item.quantity} Unit</strong>
                      </div>
                    </div>

                    <div className="doctor-prescription-item__usage">
                      <span className="material-symbols-outlined">info</span>
                      <span>
                        Usage: {item.instruction || item.note || "Follow doctor guidance."}
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
                  <strong>Clinically Verified</strong>
                  <span>Digital certificate valid until 2027</span>
                </div>
              </div>

              <div className="doctor-prescription-verification__signature">
                <p>{prescription.doctorName}</p>
                <strong>Dr. {prescription.doctorName}</strong>
                <span>Prescription author</span>
              </div>
            </article>
          </div>
        </section>
      ) : (
        <p className="empty-state">Prescription not found.</p>
      )}
    </DoctorWorkspace>
  );
}
