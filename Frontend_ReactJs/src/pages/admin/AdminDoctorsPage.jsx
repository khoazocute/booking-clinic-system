import { useEffect, useMemo, useState } from "react";
import { AdminWorkspace } from "../../layouts/AdminWorkspace";
import {
  createDoctor,
  getDoctors,
  updateDoctor,
  updateDoctorStatus,
} from "../../services/doctorService";
import { getSpecialties } from "../../services/specialtyService";
import { getUsers } from "../../services/userService";

const PAGE_SIZE = 8;
const STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "INACTIVE", label: "Ngưng hoạt động" },
];

const defaultForm = {
  userId: "",
  specialtyId: "",
  experienceYears: "",
  qualification: "",
  biography: "",
  clinicRoom: "",
  consultationFee: "",
};

function normalizeList(response) {
  const data = response?.data ?? response ?? [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.content)) return data.content;
  return [];
}

function getStatusMeta(status) {
  const normalized = String(status ?? "").toUpperCase();
  if (normalized === "INACTIVE") return { label: "Ngưng hoạt động", tone: "neutral" };
  return { label: "Hoạt động", tone: "success" };
}

function formatMoney(value) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return "--";
  return `${amount.toLocaleString("vi-VN")} đ`;
}

export function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchKeyword, setSearchKeyword] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [form, setForm] = useState(defaultForm);

  async function loadDoctors({ specialtyId, keyword }) {
    const doctorRes = await getDoctors({
      specialtyId: specialtyId === "ALL" ? undefined : Number(specialtyId),
      keyword: keyword || undefined,
    });
    setDoctors(normalizeList(doctorRes));
  }

  async function loadPageData() {
    setLoading(true);
    setError("");
    try {
      const [doctorsRes, specialtiesRes, usersRes] = await Promise.allSettled([
        getDoctors(),
        getSpecialties(),
        getUsers(),
      ]);

      const nextDoctors =
        doctorsRes.status === "fulfilled" ? normalizeList(doctorsRes.value) : [];
      const nextSpecialties =
        specialtiesRes.status === "fulfilled" ? normalizeList(specialtiesRes.value) : [];
      const nextUsers = usersRes.status === "fulfilled" ? normalizeList(usersRes.value) : [];

      setDoctors(nextDoctors);
      setSpecialties(nextSpecialties);
      setUsers(nextUsers);

      if (
        doctorsRes.status === "rejected" &&
        specialtiesRes.status === "rejected" &&
        usersRes.status === "rejected"
      ) {
        setError("Không thể tải dữ liệu bác sĩ.");
      } else if (specialtiesRes.status === "rejected") {
        setError("Không thể tải danh sách chuyên khoa.");
      }
    } catch {
      setError("Không thể tải dữ liệu bác sĩ.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPageData();
  }, []);

  useEffect(() => {
    if (!success) return undefined;
    const timerId = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(timerId);
  }, [success]);

  useEffect(() => {
    const timerId = setTimeout(async () => {
      try {
        setError("");
        await loadDoctors({ specialtyId: specialtyFilter, keyword: searchKeyword.trim() });
        setPage(1);
      } catch (requestError) {
        setError(requestError.message ?? "Không thể tải danh sách bác sĩ.");
      }
    }, 300);
    return () => clearTimeout(timerId);
  }, [searchKeyword, specialtyFilter]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      if (statusFilter === "ALL") return true;
      return String(doctor.status ?? "").toUpperCase() === statusFilter;
    });
  }, [doctors, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedDoctors = filteredDoctors.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const userOptions = useMemo(() => {
    const doctorUserIds = new Set(doctors.map((doctor) => doctor.userId).filter(Boolean));
    return users.filter((user) => {
      const role = String(user.role ?? "").toUpperCase();
      if (role === "ADMIN") return false;
      return !doctorUserIds.has(user.id);
    });
  }, [users, doctors]);

  async function ensureSpecialtiesLoaded() {
    if (specialties.length > 0) return;
    try {
      const response = await getSpecialties();
      setSpecialties(normalizeList(response));
    } catch {
      setError("Không thể tải danh sách chuyên khoa.");
    }
  }

  async function openCreateModal() {
    await ensureSpecialtiesLoaded();
    setEditingDoctor(null);
    setForm(defaultForm);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  }

  async function openEditModal(doctor) {
    await ensureSpecialtiesLoaded();
    setEditingDoctor(doctor);
    setForm({
      userId: String(doctor.userId ?? ""),
      specialtyId: String(doctor.specialtyId ?? ""),
      experienceYears: String(doctor.experienceYears ?? ""),
      qualification: doctor.qualification ?? "",
      biography: doctor.biography ?? "",
      clinicRoom: doctor.clinicRoom ?? "",
      consultationFee: String(doctor.consultationFee ?? ""),
    });
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;
    setIsModalOpen(false);
  }

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmitForm(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      if (editingDoctor) {
        await updateDoctor(editingDoctor.id, {
          specialtyId: Number(form.specialtyId),
          experienceYears: Number(form.experienceYears),
          qualification: form.qualification.trim(),
          biography: form.biography.trim(),
          clinicRoom: form.clinicRoom.trim(),
          consultationFee: Number(form.consultationFee),
        });
        setSuccess("Cập nhật bác sĩ thành công.");
      } else {
        await createDoctor({
          userId: Number(form.userId),
          specialtyId: Number(form.specialtyId),
          experienceYears: Number(form.experienceYears),
          qualification: form.qualification.trim(),
          biography: form.biography.trim(),
          clinicRoom: form.clinicRoom.trim(),
          consultationFee: Number(form.consultationFee),
        });
        setSuccess("Tạo bác sĩ thành công.");
      }

      setIsModalOpen(false);
      await loadDoctors({ specialtyId: specialtyFilter, keyword: searchKeyword.trim() });
    } catch (requestError) {
      setError(requestError.message ?? "Thao tác thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(doctor) {
    const currentStatus = String(doctor.status ?? "ACTIVE").toUpperCase();
    const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      setError("");
      setSuccess("");
      await updateDoctorStatus(doctor.id, nextStatus);
      await loadDoctors({ specialtyId: specialtyFilter, keyword: searchKeyword.trim() });
      setSuccess("Cập nhật trạng thái bác sĩ thành công.");
    } catch (requestError) {
      setError(requestError.message ?? "Không thể cập nhật trạng thái bác sĩ.");
    }
  }

  const specialtyOptions = useMemo(() => {
    const names = specialties.map((item) => ({ id: item.id, name: item.name })).filter((x) => x.id && x.name);
    return [{ id: "ALL", name: "All Specialties" }, ...names];
  }, [specialties]);

  return (
    <AdminWorkspace
      eyebrow="Admin / Bác sĩ"
      title="Doctor Management"
      description="Quản lý hồ sơ bác sĩ và trạng thái làm việc."
      actions={
        <button className="button button--primary" type="button" onClick={openCreateModal}>
          <span className="material-symbols-outlined">person_add</span>
          Add New Doctor
        </button>
      }
    >
      {error ? (
        <div className="admin-alert admin-alert--error">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      ) : null}
      {success ? (
        <div className="admin-alert admin-alert--success">
          <span className="material-symbols-outlined">check_circle</span>
          <span>{success}</span>
        </div>
      ) : null}

      <section className="admin-stats-row">
        <div className="admin-stat-card">
          <div style={{ width: "100%" }}>
            <label htmlFor="admin-doctor-specialty-filter">Specialty Filter</label>
            <select
              id="admin-doctor-specialty-filter"
              value={specialtyFilter}
              onChange={(event) => setSpecialtyFilter(event.target.value)}
              style={{ width: "100%", minHeight: 40, borderRadius: 8, border: "1px solid #e5e7eb", padding: "0 10px" }}
            >
              {specialtyOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-stat-card">
          <div style={{ width: "100%" }}>
            <label htmlFor="admin-doctor-status-filter">Status Filter</label>
            <select
              id="admin-doctor-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              style={{ width: "100%", minHeight: 40, borderRadius: 8, border: "1px solid #e5e7eb", padding: "0 10px" }}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-stat-card">
          <div>
            <p className="admin-stat-card__label">Total Staff</p>
            <p className="admin-stat-card__value">{loading ? "--" : filteredDoctors.length}</p>
          </div>
        </div>
      </section>

      <section className="admin-table-card admin-doctor-table-card">
        <div className="admin-table-toolbar admin-doctor-table-toolbar">
          <strong>Doctors List</strong>
          <label className="admin-search-box" aria-label="Tìm bác sĩ">
            <span className="material-symbols-outlined">search</span>
            <input
              type="search"
              placeholder="Search doctors..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </label>
        </div>

        <div className="admin-table-wrap admin-doctor-table-wrap">
          <table className="admin-table admin-doctor-table">
            <thead>
              <tr>
                <th>Doctor Name</th>
                <th>Specialty</th>
                <th>Contact</th>
                <th>Experience</th>
                <th>Rating</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && pagedDoctors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-empty">
                    Không có bác sĩ phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                pagedDoctors.map((doctor) => {
                  const status = getStatusMeta(doctor.status);
                  return (
                    <tr key={doctor.id}>
                      <td className="admin-doctor-col-name">
                        <div className="admin-person-cell">
                          <span>{(doctor.fullName ?? "BS").slice(0, 2).toUpperCase()}</span>
                          <div>
                            <strong>{doctor.fullName ?? "--"}</strong>
                            <div style={{ color: "#64748b", fontSize: 12 }}>{doctor.email ?? "--"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="admin-doctor-col-specialty">{doctor.specialtyName ?? "--"}</td>
                      <td className="admin-doctor-col-contact">
                        <div>
                          <span>{doctor.email ?? "--"}</span>
                          <div style={{ color: "#64748b", fontSize: 12 }}>{doctor.phone ?? "--"}</div>
                        </div>
                      </td>
                      <td className="admin-doctor-col-exp">{doctor.experienceYears ?? "--"} năm</td>
                      <td className="admin-doctor-col-rating">{doctor.averageRating ?? "--"}</td>
                      <td className="admin-doctor-col-fee">{formatMoney(doctor.consultationFee)}</td>
                      <td className="admin-doctor-col-status">
                        <span className={`patient-badge patient-badge--${status.tone}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="admin-doctor-col-actions">
                        <div className="admin-table__actions">
                          <button className="admin-action-btn" type="button" onClick={() => openEditModal(doctor)}>
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button
                            className="admin-action-btn admin-action-btn--danger"
                            type="button"
                            onClick={() => handleToggleStatus(doctor)}
                          >
                            <span className="material-symbols-outlined">
                              {String(doctor.status ?? "").toUpperCase() === "ACTIVE" ? "block" : "check_circle"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-table-toolbar" style={{ justifyContent: "flex-end", gap: 10 }}>
          <button
            type="button"
            className="button button--ghost"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span>Page {currentPage}/{totalPages}</span>
          <button
            type="button"
            className="button button--ghost"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </section>

      {isModalOpen ? (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <form className="admin-modal" onSubmit={handleSubmitForm}>
            <div className="admin-modal__header">
              <h2>{editingDoctor ? "Update Doctor" : "Create Doctor"}</h2>
              <button type="button" className="admin-modal__close" onClick={closeModal} aria-label="Close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="admin-modal__body" style={{ display: "grid", gap: 12 }}>

            {!editingDoctor ? (
              <label style={{ display: "grid", gap: 6 }}>
                User
                <select
                  required
                  value={form.userId}
                  onChange={(event) => handleFormChange("userId", event.target.value)}
                  style={{ minHeight: 40, borderRadius: 8, border: "1px solid #e5e7eb", padding: "0 10px" }}
                >
                  <option value="">Chọn user</option>
                  {userOptions.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} ({user.email})
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <label style={{ display: "grid", gap: 6 }}>
              Specialty
              <select
                required
                value={form.specialtyId}
                onChange={(event) => handleFormChange("specialtyId", event.target.value)}
                style={{ minHeight: 40, borderRadius: 8, border: "1px solid #e5e7eb", padding: "0 10px" }}
              >
                <option value="">Chọn chuyên khoa</option>
                {specialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Experience Years
              <input
                required
                min={0}
                type="number"
                value={form.experienceYears}
                onChange={(event) => handleFormChange("experienceYears", event.target.value)}
                style={{ minHeight: 40, borderRadius: 8, border: "1px solid #e5e7eb", padding: "0 10px" }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Qualification
              <input
                required
                value={form.qualification}
                onChange={(event) => handleFormChange("qualification", event.target.value)}
                style={{ minHeight: 40, borderRadius: 8, border: "1px solid #e5e7eb", padding: "0 10px" }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Clinic Room
              <input
                required
                value={form.clinicRoom}
                onChange={(event) => handleFormChange("clinicRoom", event.target.value)}
                style={{ minHeight: 40, borderRadius: 8, border: "1px solid #e5e7eb", padding: "0 10px" }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Consultation Fee
              <input
                required
                min={0}
                type="number"
                value={form.consultationFee}
                onChange={(event) => handleFormChange("consultationFee", event.target.value)}
                style={{ minHeight: 40, borderRadius: 8, border: "1px solid #e5e7eb", padding: "0 10px" }}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              Biography
              <textarea
                required
                rows={3}
                value={form.biography}
                onChange={(event) => handleFormChange("biography", event.target.value)}
                style={{ borderRadius: 8, border: "1px solid #e5e7eb", padding: "10px" }}
              />
            </label>
            <div className="admin-modal__footer" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" className="button button--ghost" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="button button--primary" disabled={submitting}>
                {submitting ? "Saving..." : "Save"}
              </button>
            </div>
            </div>
          </form>
        </div>
      ) : null}
    </AdminWorkspace>
  );
}
