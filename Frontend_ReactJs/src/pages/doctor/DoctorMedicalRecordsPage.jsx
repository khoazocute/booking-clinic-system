import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DoctorWorkspace } from "../../components/doctor/DoctorWorkspace";
import { getDoctorMedicalRecordSummaries } from "../../services/doctorPortalService";
import { formatDate, formatDateTime } from "../../utils/doctorHelpers";

export function DoctorMedicalRecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    getDoctorMedicalRecordSummaries()
      .then((result) => {
        if (active) setRecords(result.records ?? []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return records;

    return records.filter(({ appointment, medicalRecord }) => {
      return (
        appointment.patientName?.toLowerCase().includes(keyword) ||
        medicalRecord.patientName?.toLowerCase().includes(keyword) ||
        medicalRecord.diagnosis?.toLowerCase().includes(keyword) ||
        String(medicalRecord.id ?? "").includes(keyword) ||
        String(appointment.id ?? "").includes(keyword)
      );
    });
  }, [records, search]);

  return (
    <DoctorWorkspace
      eyebrow="Doctor / Medical Records"
      title="Ho so kham"
      description="Danh sach ho so benh an da tao sau cac lich kham hoan thanh."
      actions={
        <Link className="button button--primary" to="/doctor/appointments">
          Tao tu lich hen
        </Link>
      }
    >
      <section className="doctor-appointments-filters doctor-list-toolbar">
        <label className="doctor-appointments-search">
          <input
            placeholder="Tim theo benh nhan, chan doan, ma ho so..."
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </section>

      {error ? <p className="empty-state">{error}</p> : null}

      <article className="doctor-management-table doctor-management-table--records">
        <header className="doctor-management-table__head">
          <span>Benh nhan</span>
          <span>Lich hen</span>
          <span>Chan doan</span>
          <span>Ngay tao</span>
          <span>Thao tac</span>
        </header>

        {loading ? (
          <p className="empty-state">Dang tai ho so kham...</p>
        ) : filteredRecords.length === 0 ? (
          <p className="empty-state">Chua co ho so kham phu hop.</p>
        ) : (
          filteredRecords.map(({ appointment, medicalRecord }) => (
            <div className="doctor-management-row" key={medicalRecord.id}>
              <span>
                <strong>{medicalRecord.patientName ?? appointment.patientName ?? "Benh nhan"}</strong>
                <small>ID #{medicalRecord.patientId ?? appointment.patientId ?? "--"}</small>
              </span>
              <span>
                <strong>#{appointment.id}</strong>
                <small>{formatDate(appointment.appointmentDate)}</small>
              </span>
              <span>{medicalRecord.diagnosis || medicalRecord.symptoms || "--"}</span>
              <span>{formatDateTime(medicalRecord.createdAt)}</span>
              <span>
                <Link className="button button--secondary" to={`/doctor/medical-records/${medicalRecord.id}`}>
                  Xem
                </Link>
              </span>
            </div>
          ))
        )}
      </article>
    </DoctorWorkspace>
  );
}
