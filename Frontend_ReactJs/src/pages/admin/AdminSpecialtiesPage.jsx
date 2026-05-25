import { useEffect, useMemo, useState } from "react";
import { AdminWorkspace } from "../../layouts/AdminWorkspace";
import {
  createSpecialty,
  deleteSpecialty,
  getSpecialties,
  updateSpecialty,
} from "../../services/specialtyService";

const PAGE_SIZE = 8;
const defaultForm = { name: "", description: "" };

function normalizeList(response) {
  const data = response?.data ?? response ?? [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.content)) return data.content;
  return [];
}

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("vi-VN");
}

function iconByName(name) {
  const normalized = String(name ?? "").toLowerCase();
  if (normalized.includes("cardio") || normalized.includes("tim")) return "favorite";
  if (normalized.includes("neuro") || normalized.includes("thần kinh")) return "psychology";
  if (normalized.includes("nhi") || normalized.includes("pediatric")) return "child_care";
  if (normalized.includes("da") || normalized.includes("derma")) return "spa";
  if (normalized.includes("ung bướu") || normalized.includes("onco")) return "biotech";
  return "category";
}

export function AdminSpecialtiesPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [specialties, setSpecialties] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(defaultForm);

  async function loadSpecialties() {
    setLoading(true);
    setError("");
    try {
      const response = await getSpecialties();
      const list = normalizeList(response);
      list.sort((a, b) => {
        const dateA = new Date(a.createdAt ?? 0).getTime();
        const dateB = new Date(b.createdAt ?? 0).getTime();
        return dateB - dateA;
      });
      setSpecialties(list);
    } catch (requestError) {
      setError(requestError.message ?? "Không thể tải danh sách chuyên khoa.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSpecialties();
  }, []);

  useEffect(() => {
    if (!success) return undefined;
    const timerId = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(timerId);
  }, [success]);

  const filteredSpecialties = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return specialties;
    return specialties.filter((item) => {
      const block = [item.name, item.description].filter(Boolean).join(" ").toLowerCase();
      return block.includes(keyword);
    });
  }, [specialties, searchKeyword]);

  useEffect(() => {
    setPage(1);
  }, [searchKeyword]);

  const totalPages = Math.max(1, Math.ceil(filteredSpecialties.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedSpecialties = filteredSpecialties.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const stats = useMemo(() => {
    return {
      total: specialties.length,
      withDescription: specialties.filter((x) => String(x.description ?? "").trim().length > 0).length,
      newThisMonth: specialties.filter((x) => {
        const created = new Date(x.createdAt ?? 0);
        if (Number.isNaN(created.getTime())) return false;
        const now = new Date();
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).length,
    };
  }, [specialties]);

  function openCreateModal() {
    setEditingItem(null);
    setForm(defaultForm);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  }

  function openEditModal(item) {
    setEditingItem(item);
    setForm({
      name: item.name ?? "",
      description: item.description ?? "",
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
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
      };

      if (editingItem) {
        await updateSpecialty(editingItem.id, payload);
        setSuccess("Cập nhật chuyên khoa thành công.");
      } else {
        await createSpecialty(payload);
        setSuccess("Tạo chuyên khoa thành công.");
      }

      setIsModalOpen(false);
      await loadSpecialties();
    } catch (requestError) {
      setError(requestError.message ?? "Thao tác thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item) {
    const accepted = window.confirm(`Xóa chuyên khoa "${item.name}"?`);
    if (!accepted) return;

    setError("");
    setSuccess("");
    try {
      await deleteSpecialty(item.id);
      setSuccess("Xóa chuyên khoa thành công.");
      await loadSpecialties();
    } catch (requestError) {
      setError(requestError.message ?? "Không thể xóa chuyên khoa.");
    }
  }

  return (
    <AdminWorkspace
      eyebrow="Admin / Chuyên khoa"
      title="Quản lý chuyên khoa"
      description="Quản lý danh mục chuyên khoa và mô tả nghiệp vụ."
      actions={
        <button className="button button--primary" type="button" onClick={openCreateModal}>
          <span className="material-symbols-outlined">add</span>
          Tạo chuyên khoa
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
          <div>
            <p className="admin-stat-card__label">Tổng chuyên khoa</p>
            <p className="admin-stat-card__value">{loading ? "--" : stats.total}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div>
            <p className="admin-stat-card__label">Có mô tả</p>
            <p className="admin-stat-card__value">{loading ? "--" : stats.withDescription}</p>
          </div>
        </div>
        <div className="admin-stat-card">
          <div>
            <p className="admin-stat-card__label">Mới trong tháng</p>
            <p className="admin-stat-card__value">{loading ? "--" : stats.newThisMonth}</p>
          </div>
        </div>
      </section>

      <section className="admin-table-card">
        <div className="admin-table-toolbar">
          <strong>Danh sách chuyên khoa</strong>
          <label className="admin-search-box" aria-label="Tìm chuyên khoa">
            <span className="material-symbols-outlined">search</span>
            <input
              type="search"
              placeholder="Tìm chuyên khoa..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </label>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Mô tả</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {!loading && pagedSpecialties.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-empty">
                    Không có chuyên khoa phù hợp.
                  </td>
                </tr>
              ) : (
                pagedSpecialties.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id ?? "--"}</td>
                    <td>
                      <div className="admin-person-cell">
                        <span>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                            {iconByName(item.name)}
                          </span>
                        </span>
                        <strong>{item.name ?? "--"}</strong>
                      </div>
                    </td>
                    <td>{item.description ?? "--"}</td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>
                      <div className="admin-table__actions">
                        <button className="admin-action-btn" type="button" onClick={() => openEditModal(item)}>
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button className="admin-action-btn admin-action-btn--danger" type="button" onClick={() => handleDelete(item)}>
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="admin-table-toolbar" style={{ justifyContent: "space-between" }}>
          <span>
            Hiển thị {(currentPage - 1) * PAGE_SIZE + (pagedSpecialties.length > 0 ? 1 : 0)}-
            {(currentPage - 1) * PAGE_SIZE + pagedSpecialties.length} trong {filteredSpecialties.length} chuyên khoa
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="button button--ghost"
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </button>
            <span>Trang {currentPage}/{totalPages}</span>
            <button
              className="button button--ghost"
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Sau
            </button>
          </div>
        </div>
      </section>

      {isModalOpen ? (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true">
          <form className="admin-modal" onSubmit={handleSubmitForm}>
            <div className="admin-modal__header">
              <h2>{editingItem ? "Cập nhật chuyên khoa" : "Tạo chuyên khoa"}</h2>
              <button type="button" className="admin-modal__close" onClick={closeModal} aria-label="Đóng">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="admin-modal__body" style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                Tên chuyên khoa
                <input
                  required
                  value={form.name}
                  onChange={(event) => handleFormChange("name", event.target.value)}
                  style={{ minHeight: 40, borderRadius: 8, border: "1px solid #e5e7eb", padding: "0 10px" }}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                Mô tả
                <textarea
                  required
                  rows={4}
                  value={form.description}
                  onChange={(event) => handleFormChange("description", event.target.value)}
                  style={{ borderRadius: 8, border: "1px solid #e5e7eb", padding: "10px" }}
                />
              </label>

              <div className="admin-modal__footer" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="button button--ghost" onClick={closeModal}>
                  Hủy
                </button>
                <button type="submit" className="button button--primary" disabled={submitting}>
                  {submitting ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </AdminWorkspace>
  );
}
