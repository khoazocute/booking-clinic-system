import { useState } from "react";
import { DoctorWorkspace } from "../../components/doctor/DoctorWorkspace";

export function DoctorSettingsPage() {
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    appointmentAlerts: true,
    dailySummary: false,
    compactMode: false,
    language: "vi",
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
      eyebrow="Bác sĩ / Cài đặt"
      title="Cài đặt bác sĩ"
      description="Điều chỉnh tuỳ chọn làm việc, thông báo và phiên đăng nhập cho cổng bác sĩ."
      actions={
        <button className="button button--primary" type="button" onClick={handleSave}>
          <span className="material-symbols-outlined">save</span>
          <span>Lưu tuỳ chọn</span>
        </button>
      }
    >
      {saved ? <p className="doctor-settings__saved">Đã lưu tuỳ chọn cho phiên làm việc hiện tại.</p> : null}

      <section className="doctor-settings-layout">
        <article className="doctor-panel">
          <div className="doctor-panel__head">
            <div>
              <h2>Tuỳ chọn thông báo</h2>
              <p>Kiểm soát cách hệ thống gửi hoạt động lịch hẹn và nhắc nhở cho bạn.</p>
            </div>
          </div>

          <div className="doctor-settings-list">
            <label className="doctor-setting-item">
              <div>
                <strong>Thông báo email</strong>
                <p>Nhận cập nhật qua email cho các hoạt động quan trọng của tài khoản.</p>
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
                <strong>Cảnh báo lịch hẹn</strong>
                <p>Hiển thị cảnh báo khi có đặt lịch mới, thay đổi hoặc hủy lịch.</p>
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
                <strong>Tóm tắt hằng ngày</strong>
                <p>Nhận một bản tóm tắt công việc chờ xử lý và hoạt động trong ngày.</p>
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
              <h2>Tuỳ chọn không gian làm việc</h2>
              <p>Thiết lập cách hiển thị và ngôn ngữ dùng trong cổng bác sĩ.</p>
            </div>
          </div>

          <div className="doctor-form doctor-form--editor">
            <div className="doctor-form__grid">
              <label>
                <span>Ngôn ngữ</span>
                <select
                  name="language"
                  value={preferences.language}
                  onChange={handleSelectChange}
                >
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">Tiếng Anh</option>
                </select>
              </label>

              <label>
                <span>Múi giờ</span>
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
                <strong>Chế độ hiển thị gọn</strong>
                <p>Giảm khoảng cách hiển thị để xem được nhiều thông tin hơn trên màn hình lớn.</p>
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
              <h2>Bảo mật và phiên đăng nhập</h2>
              <p>Kiểm tra các tuỳ chọn bảo mật cho tài khoản bác sĩ hiện tại.</p>
            </div>
          </div>

          <div className="doctor-settings-security__cards">
            <div className="doctor-settings-security__card">
              <span className="material-symbols-outlined">shield_lock</span>
              <strong>Phiên đang hoạt động</strong>
              <p>Phiên đăng nhập được bảo vệ bằng xác thực token và tự động làm mới.</p>
            </div>

            <div className="doctor-settings-security__card">
              <span className="material-symbols-outlined">password</span>
              <strong>Chính sách mật khẩu</strong>
              <p>Dùng mật khẩu mạnh và cập nhật định kỳ trong phần cài đặt tài khoản.</p>
            </div>
          </div>
        </article>
      </section>
    </DoctorWorkspace>
  );
}
