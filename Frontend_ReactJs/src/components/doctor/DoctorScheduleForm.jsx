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
          <span>Work date</span>
          <input
            required
            name="workDate"
            type="date"
            value={form.workDate}
            onChange={onChange}
          />
        </label>

        <label>
          <span>Start time</span>
          <input
            required
            name="startTime"
            type="time"
            value={form.startTime}
            onChange={onChange}
          />
        </label>

        <label>
          <span>End time</span>
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
          Cancel
        </button>
        <button className="button button--primary" disabled={submitting} type="submit">
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
