export function DoctorScheduleForm({
  form,
  submitting,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}) {
  return (
    <form className="doctor-form" onSubmit={onSubmit}>
      <div className="doctor-form__grid">
        <label>
          <span>Ngày làm việc</span>
          <input
            required
            name="workDate"
            type="date"
            value={form.workDate}
            onChange={onChange}
          />
        </label>

        <label>
          <span>Giờ bắt đầu</span>
          <input
            required
            name="startTime"
            type="time"
            value={form.startTime}
            onChange={onChange}
          />
        </label>

        <label>
          <span>Giờ kết thúc</span>
          <input
            required
            name="endTime"
            type="time"
            value={form.endTime}
            onChange={onChange}
          />
        </label>
      </div>

      <div className="doctor-form__actions">
        <button
          className="button button--secondary"
          type="button"
          onClick={onCancel}
        >
          Hủy
        </button>
        <button className="button button--primary" disabled={submitting} type="submit">
          {submitting ? "Đang lưu..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
