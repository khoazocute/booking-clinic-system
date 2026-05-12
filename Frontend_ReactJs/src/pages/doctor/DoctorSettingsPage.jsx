import { useState } from "react";
import { DoctorWorkspace } from "../../components/doctor/DoctorWorkspace";

export function DoctorSettingsPage() {
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    appointmentAlerts: true,
    dailySummary: false,
    compactMode: false,
    language: "en",
    timezone: "Asia/Ho_Chi_Minh",
  });
  const [saved, setSaved] = useState(false);

  function handleCheckboxChange(event) {
    const { name, checked } = event.target;
    setPreferences((current) => ({
      ...current,
      [name]: checked,
    }));
    setSaved(false);
  }

  function handleSelectChange(event) {
    const { name, value } = event.target;
    setPreferences((current) => ({
      ...current,
      [name]: value,
    }));
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
  }

  return (
    <DoctorWorkspace
      eyebrow="Doctor / Settings"
      title="Doctor Settings"
      description="Adjust workspace preferences, notifications, and session behavior for your clinical portal."
      actions={
        <button className="button button--primary" type="button" onClick={handleSave}>
          <span className="material-symbols-outlined">save</span>
          <span>Save Preferences</span>
        </button>
      }
    >
      {saved ? <p className="doctor-settings__saved">Preferences saved locally for this session.</p> : null}

      <section className="doctor-settings-layout">
        <article className="doctor-panel">
          <div className="doctor-panel__head">
            <div>
              <h2>Notification Preferences</h2>
              <p>Control how appointment activity and reminders reach you.</p>
            </div>
          </div>

          <div className="doctor-settings-list">
            <label className="doctor-setting-item">
              <div>
                <strong>Email Notifications</strong>
                <p>Receive email updates for important account activity.</p>
              </div>
              <input
                checked={preferences.emailNotifications}
                name="emailNotifications"
                type="checkbox"
                onChange={handleCheckboxChange}
              />
            </label>

            <label className="doctor-setting-item">
              <div>
                <strong>Appointment Alerts</strong>
                <p>Show alerts for new bookings, changes, and cancellations.</p>
              </div>
              <input
                checked={preferences.appointmentAlerts}
                name="appointmentAlerts"
                type="checkbox"
                onChange={handleCheckboxChange}
              />
            </label>

            <label className="doctor-setting-item">
              <div>
                <strong>Daily Summary</strong>
                <p>Receive one daily digest of pending tasks and today's activity.</p>
              </div>
              <input
                checked={preferences.dailySummary}
                name="dailySummary"
                type="checkbox"
                onChange={handleCheckboxChange}
              />
            </label>
          </div>
        </article>

        <article className="doctor-panel">
          <div className="doctor-panel__head">
            <div>
              <h2>Workspace Preferences</h2>
              <p>Set the display behavior and language used in your portal.</p>
            </div>
          </div>

          <div className="doctor-form doctor-form--editor">
            <div className="doctor-form__grid">
              <label>
                <span>Language</span>
                <select
                  name="language"
                  value={preferences.language}
                  onChange={handleSelectChange}
                >
                  <option value="en">English</option>
                  <option value="vi">Vietnamese</option>
                </select>
              </label>

              <label>
                <span>Timezone</span>
                <select
                  name="timezone"
                  value={preferences.timezone}
                  onChange={handleSelectChange}
                >
                  <option value="Asia/Ho_Chi_Minh">Asia/Ho Chi Minh</option>
                  <option value="Asia/Bangkok">Asia/Bangkok</option>
                  <option value="UTC">UTC</option>
                </select>
              </label>
            </div>

            <label className="doctor-setting-item doctor-setting-item--inline">
              <div>
                <strong>Compact Workspace Mode</strong>
                <p>Reduce spacing density for a tighter view on large screens.</p>
              </div>
              <input
                checked={preferences.compactMode}
                name="compactMode"
                type="checkbox"
                onChange={handleCheckboxChange}
              />
            </label>
          </div>
        </article>

        <article className="doctor-panel doctor-settings-security">
          <div className="doctor-panel__head">
            <div>
              <h2>Security & Session</h2>
              <p>Review account safety options for your current doctor workspace.</p>
            </div>
          </div>

          <div className="doctor-settings-security__cards">
            <div className="doctor-settings-security__card">
              <span className="material-symbols-outlined">shield_lock</span>
              <strong>Active Session</strong>
              <p>Your session is protected by token-based authentication and auto refresh.</p>
            </div>

            <div className="doctor-settings-security__card">
              <span className="material-symbols-outlined">password</span>
              <strong>Password Policy</strong>
              <p>Use a strong password and update it regularly from your account settings.</p>
            </div>
          </div>
        </article>
      </section>
    </DoctorWorkspace>
  );
}
