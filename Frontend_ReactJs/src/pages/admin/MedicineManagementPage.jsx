import { useEffect, useState, useMemo } from 'react';
import { getMedicines, createMedicine, updateMedicine, updateMedicineStatus } from '../../services/medicineService';

const PAGE_SIZE = 10;

const STOCK_STATUS_STYLE = {
  IN_STOCK: 'bg-secondary-fixed text-on-secondary-fixed-variant',
  LOW_STOCK: 'bg-orange-100 text-orange-800',
  OUT_OF_STOCK: 'bg-error-container text-on-error-container',
};

const STOCK_STATUS_LABEL = {
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(value) {
  if (value == null) return '—';
  return `$${Number(value).toFixed(2)}`;
}

const EMPTY_FORM = { name: '', unitPrice: '', unit: '', stockQuantity: '' };

const MedicineManagementPage = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMedicines();
      setMedicines(res?.data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMedicines(); }, []);

  const stats = useMemo(() => {
    const total = medicines.length;
    const lowStock = medicines.filter(m => m.stockStatus === 'LOW_STOCK').length;
    const outOfStock = medicines.filter(m => m.stockStatus === 'OUT_OF_STOCK').length;
    const totalValue = medicines.reduce((sum, m) => sum + (Number(m.unitPrice) || 0) * (m.stockQuantity || 0), 0);
    return { total, lowStock, outOfStock, totalValue };
  }, [medicines]);

  const filtered = useMemo(() => {
    let list = filterStatus === 'ALL' ? medicines : medicines.filter(m => m.stockStatus === filterStatus);

    list = [...list].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price') return (b.unitPrice ?? 0) - (a.unitPrice ?? 0);
      return new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0);
    });

    return list;
  }, [medicines, filterStatus, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (med) => {
    setEditTarget(med);
    setForm({ name: med.name, unitPrice: med.unitPrice, unit: med.unit, stockQuantity: med.stockQuantity });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditTarget(null); };

  const handleFormChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        unitPrice: parseFloat(form.unitPrice),
        unit: form.unit.trim(),
        stockQuantity: parseInt(form.stockQuantity, 10),
      };
      if (editTarget) {
        await updateMedicine(editTarget.id, payload);
      } else {
        await createMedicine(payload);
      }
      closeModal();
      await fetchMedicines();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (med) => {
    if (!window.confirm(`Deactivate "${med.name}"? It will no longer be available for prescriptions.`)) return;
    try {
      await updateMedicineStatus(med.id, 'INACTIVE');
      await fetchMedicines();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleFilterChange = (e) => { setFilterStatus(e.target.value); setPage(1); };
  const handleSortChange = (e) => { setSortBy(e.target.value); setPage(1); };

  return (
    <div>
      {/* Add button row — title/description come from AdminWorkspace header */}
      <div className="flex justify-end mb-6">
        <button
          onClick={openAdd}
          className="bg-primary text-on-primary font-button px-lg py-sm rounded-lg flex items-center gap-xs shadow-md active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined" data-icon="add">add</span>
          <span>Add New Medicine</span>
        </button>
      </div>

      {/* Stats — 4 cards, equal height via consistent structure */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant flex flex-col">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-label-caps font-label-caps text-on-surface-variant">TOTAL PRODUCTS</span>
            <span className="material-symbols-outlined text-primary" data-icon="inventory_2">inventory_2</span>
          </div>
          <div className="text-h2 font-h2">{stats.total}</div>
          <div className="text-body-sm text-on-surface-variant mt-xs">Active medicines in system</div>
        </div>
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant flex flex-col">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-label-caps font-label-caps text-on-surface-variant">LOW STOCK</span>
            <span className="material-symbols-outlined text-secondary" data-icon="warning">warning</span>
          </div>
          <div className="text-h2 font-h2 text-secondary">{stats.lowStock}</div>
          <div className="text-body-sm text-on-surface-variant mt-xs">Requires immediate reorder</div>
        </div>
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant flex flex-col">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-label-caps font-label-caps text-on-surface-variant">OUT OF STOCK</span>
            <span className="material-symbols-outlined text-error" data-icon="error">error</span>
          </div>
          <div className="text-h2 font-h2 text-error">{stats.outOfStock}</div>
          <div className="text-body-sm text-on-surface-variant mt-xs">Critical stockouts detected</div>
        </div>
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant flex flex-col">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-label-caps font-label-caps text-on-surface-variant">TOTAL VALUE</span>
            <span className="material-symbols-outlined text-tertiary" data-icon="payments">payments</span>
          </div>
          <div className="text-h2 font-h2">{formatCurrency(stats.totalValue)}</div>
          <div className="text-body-sm text-on-surface-variant mt-xs">Current inventory valuation</div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
        {/* Toolbar */}
        <div className="p-md border-b border-outline-variant flex flex-col md:flex-row items-center justify-between gap-md bg-surface-container-low">
          <div className="flex flex-wrap items-center gap-sm w-full md:w-auto">
            <div className="flex items-center bg-white border border-outline px-sm py-xs rounded-lg text-body-sm min-w-[200px]">
              <span className="material-symbols-outlined text-outline mr-xs" data-icon="filter_alt">filter_alt</span>
              <select value={filterStatus} onChange={handleFilterChange} className="bg-transparent border-none focus:ring-0 w-full outline-none py-0">
                <option value="ALL">All Statuses</option>
                <option value="IN_STOCK">In Stock</option>
                <option value="LOW_STOCK">Low Stock</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
              </select>
            </div>
            <div className="flex items-center bg-white border border-outline px-sm py-xs rounded-lg text-body-sm">
              <span className="material-symbols-outlined text-outline mr-xs" data-icon="sort">sort</span>
              <select value={sortBy} onChange={handleSortChange} className="bg-transparent border-none focus:ring-0 outline-none py-0">
                <option value="createdAt">Created Date</option>
                <option value="name">Name A-Z</option>
                <option value="price">Price: High to Low</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-sm">
            <span className="text-body-sm text-on-surface-variant">
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} medicines
            </span>
            <div className="flex items-center space-x-xs">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-xs border border-outline rounded-lg hover:bg-surface-container transition-colors disabled:opacity-40"
              >
                <span className="material-symbols-outlined" data-icon="chevron_left">chevron_left</span>
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-xs border border-outline rounded-lg hover:bg-surface-container transition-colors disabled:opacity-40"
              >
                <span className="material-symbols-outlined" data-icon="chevron_right">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-outline-variant">
                <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">ID</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Medicine Name</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Unit</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Unit Price</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Stock</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Created Date</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-md py-lg text-center text-on-surface-variant text-body-md">Loading...</td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={8} className="px-md py-lg text-center text-error text-body-md">{error}</td>
                </tr>
              )}
              {!loading && !error && paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-md py-lg text-center text-on-surface-variant text-body-md">No medicines found.</td>
                </tr>
              )}
              {!loading && !error && paginated.map(med => (
                <tr key={med.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-md py-md text-body-sm text-on-surface-variant">#{med.id}</td>
                  <td className="px-md py-md">
                    <div className="flex items-center gap-sm">
                      <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined" data-icon="pill">pill</span>
                      </div>
                      <div>
                        <div className="text-body-md font-bold">{med.name}</div>
                        <div className="text-body-sm text-on-surface-variant">{med.status}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-md py-md text-body-sm">{med.unit}</td>
                  <td className="px-md py-md text-body-sm font-bold">{formatCurrency(med.unitPrice)}</td>
                  <td className="px-md py-md text-body-sm font-bold">{med.stockQuantity ?? 0}</td>
                  <td className="px-md py-md">
                    <span className={`px-sm py-1 rounded-full text-label-caps font-label-caps ${STOCK_STATUS_STYLE[med.stockStatus] ?? ''}`}>
                      {STOCK_STATUS_LABEL[med.stockStatus] ?? med.stockStatus}
                    </span>
                  </td>
                  <td className="px-md py-md text-body-sm text-on-surface-variant">{formatDate(med.createdAt)}</td>
                  <td className="px-md py-md text-right">
                    <div className="flex items-center justify-end space-x-xs">
                      <button onClick={() => openEdit(med)} className="p-xs text-primary hover:bg-primary-fixed rounded-lg">
                        <span className="material-symbols-outlined" data-icon="edit">edit</span>
                      </button>
                      <button onClick={() => handleDelete(med)} className="p-xs text-error hover:bg-error-container rounded-lg">
                        <span className="material-symbols-outlined" data-icon="delete">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        <div className="p-md bg-surface-container-low border-t border-outline-variant flex items-center justify-end">
          <div className="flex items-center gap-sm">
            <span className="text-body-sm text-on-surface-variant">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-md py-xs bg-white border border-outline rounded-lg text-body-sm hover:bg-surface-container transition-colors disabled:opacity-40"
            >Previous</button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-md py-xs bg-primary text-on-primary rounded-lg text-body-sm font-bold shadow-sm disabled:opacity-40"
            >Next</button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-lg">
            <h2 className="text-h3 font-h3 mb-md">{editTarget ? 'Edit Medicine' : 'Add New Medicine'}</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-sm">
              <div>
                <label className="text-label-caps font-label-caps text-on-surface-variant block mb-xs">Medicine Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                  maxLength={100}
                  className="w-full border border-outline rounded-lg px-sm py-xs text-body-md focus:outline-none focus:border-primary"
                  placeholder="e.g. Amoxicillin 500mg"
                />
              </div>
              <div>
                <label className="text-label-caps font-label-caps text-on-surface-variant block mb-xs">Unit</label>
                <input
                  name="unit"
                  value={form.unit}
                  onChange={handleFormChange}
                  required
                  maxLength={30}
                  className="w-full border border-outline rounded-lg px-sm py-xs text-body-md focus:outline-none focus:border-primary"
                  placeholder="e.g. Box (100 tabs)"
                />
              </div>
              <div>
                <label className="text-label-caps font-label-caps text-on-surface-variant block mb-xs">Unit Price ($)</label>
                <input
                  name="unitPrice"
                  value={form.unitPrice}
                  onChange={handleFormChange}
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="w-full border border-outline rounded-lg px-sm py-xs text-body-md focus:outline-none focus:border-primary"
                  placeholder="e.g. 12.50"
                />
              </div>
              <div>
                <label className="text-label-caps font-label-caps text-on-surface-variant block mb-xs">Stock Quantity</label>
                <input
                  name="stockQuantity"
                  value={form.stockQuantity}
                  onChange={handleFormChange}
                  required
                  type="number"
                  min="0"
                  step="1"
                  className="w-full border border-outline rounded-lg px-sm py-xs text-body-md focus:outline-none focus:border-primary"
                  placeholder="e.g. 100"
                />
              </div>
              {formError && <p className="text-error text-body-sm">{formError}</p>}
              <div className="flex justify-end gap-sm mt-sm">
                <button type="button" onClick={closeModal} className="px-md py-xs border border-outline rounded-lg text-body-sm hover:bg-surface-container transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="px-md py-xs bg-primary text-on-primary rounded-lg text-body-sm font-bold shadow-sm disabled:opacity-50">
                  {submitting ? 'Saving...' : editTarget ? 'Save Changes' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineManagementPage;
