import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearAccessToken } from '../services/authService';
import { AdminNotificationProvider, useAdminNotificationContext } from '../contexts/AdminNotificationContext';

function AdminLayoutInner() {
  const navigate = useNavigate();
  const { notifications } = useAdminNotificationContext();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = () => {
    clearAccessToken();
    navigate('/login');
  };

  return (
    <div className="font-body-md text-body-md overflow-x-hidden bg-[#f8f9fa] text-[#191c1d]">
      {/* Điều hướng bên */}
      <aside className="flex flex-col h-screen fixed left-0 top-0 py-lg px-sm space-y-base bg-surface-container-lowest border-r border-outline-variant shadow-md w-64 z-50">
        <div className="px-sm mb-lg">
          <div className="flex items-center space-x-sm mb-xs">
            <img alt="Logo phòng khám" className="w-10 h-10 rounded-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYgrDKpqi2HasFhQsSh5u7c6bzg9Duer-DUhKxFwZHpBMr6RcYS8_Ic2hS9IgtD75KQ6xACNVgVqeg5swfLjU4jRSBmajIYQefRTveWdhFzQQUnxO6h-pNrYkPSr76Pm63LrLldZ5gshebpd5EURvasEfMY0njwFirpVBIv9KGT-iE4Q9Yh3ZnNZz7e-xnJn1MRKjOo_BOCatQrc7CxnEM257gY_-WzvVDmv9qi_W7GIqOO7Al31VuSXiu4GUKLCR2RfZfPTBkAA" />
            <span className="text-h3 font-h3 font-bold text-primary">MediFlow Admin</span>
          </div>
          <p className="text-body-sm font-body-sm text-on-surface-variant ml-12">Bệnh viện đa khoa</p>
        </div>
        <nav className="flex-grow space-y-xs overflow-y-auto px-xs">
          <NavLink 
            to="/admin" 
            end
            className={({ isActive }) => `flex items-center space-x-sm px-md py-sm rounded-lg transition-all duration-200 ${isActive ? 'bg-primary-container text-on-primary-container font-bold translate-x-1' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
          >
            <span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
            <span className="text-body-sm font-body-sm">Tổng quan</span>
          </NavLink>
          
          <a className="flex items-center space-x-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 rounded-lg" href="#">
            <span className="material-symbols-outlined" data-icon="group">group</span>
            <span className="text-body-sm font-body-sm">Người dùng</span>
          </a>
          <a className="flex items-center space-x-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 rounded-lg" href="#">
            <span className="material-symbols-outlined" data-icon="medical_services">medical_services</span>
            <span className="text-body-sm font-body-sm">Bác sĩ</span>
          </a>
          <a className="flex items-center space-x-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 rounded-lg" href="#">
            <span className="material-symbols-outlined" data-icon="category">category</span>
            <span className="text-body-sm font-body-sm">Chuyên khoa</span>
          </a>
          
          <NavLink 
            to="/admin/medicines" 
            className={({ isActive }) => `flex items-center space-x-sm px-md py-sm rounded-lg transition-all duration-200 ${isActive ? 'bg-primary-container text-on-primary-container font-bold translate-x-1' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
          >
            <span className="material-symbols-outlined" data-icon="pill">pill</span>
            <span className="text-body-sm font-body-sm">Thuốc</span>
          </NavLink>

          <NavLink 
            to="/admin/appointments" 
            className={({ isActive }) => `flex items-center space-x-sm px-md py-sm rounded-lg transition-all duration-200 ${isActive ? 'bg-primary-container text-on-primary-container font-bold translate-x-1' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
          >
            <span className="material-symbols-outlined" data-icon="calendar_today">calendar_today</span>
            <span className="text-body-sm font-body-sm">Lịch hẹn</span>
          </NavLink>
          <a className="flex items-center space-x-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 rounded-lg" href="#">
            <span className="material-symbols-outlined" data-icon="payments">payments</span>
            <span className="text-body-sm font-body-sm">Thanh toán</span>
          </a>
          <a className="flex items-center space-x-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 rounded-lg" href="#">
            <span className="material-symbols-outlined" data-icon="rate_review">rate_review</span>
            <span className="text-body-sm font-body-sm">Đánh giá</span>
          </a>
          <NavLink 
            to="/admin/notifications" 
            className={({ isActive }) => `flex items-center space-x-sm px-md py-sm rounded-lg transition-all duration-200 ${isActive ? 'bg-primary-container text-on-primary-container font-bold translate-x-1' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
          >
            <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
            <span className="text-body-sm font-body-sm">Thông báo</span>
          </NavLink>
        </nav>
        <div className="px-xs pt-base border-t border-outline-variant space-y-xs">
          <a className="flex items-center space-x-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg" href="#">
            <span className="material-symbols-outlined" data-icon="help">help</span>
            <span className="text-body-sm font-body-sm">Hỗ trợ</span>
          </a>
          <button onClick={handleLogout} className="flex items-center space-x-sm px-md py-sm text-error hover:bg-error-container rounded-lg w-full text-left">
            <span className="material-symbols-outlined" data-icon="logout">logout</span>
            <span className="text-body-sm font-body-sm">Đăng xuất</span>
          </button>
        </div>
      </aside>
      
      {/* Nội dung chính */}
      <main className="ml-64 flex flex-col min-h-screen">
        {/* Thanh trên */}
        <header className="flex justify-between items-center w-full px-md h-16 sticky top-0 z-40 bg-surface border-b border-outline-variant shadow-sm">
          <div className="flex items-center bg-surface-container-low rounded-full px-md py-xs border border-outline-variant w-96">
            <span className="material-symbols-outlined text-outline mr-sm" data-icon="search">search</span>
            <input className="bg-transparent border-none focus:ring-0 text-body-sm w-full outline-none" placeholder="Tìm kiếm..." type="text" />
          </div>
          <div className="flex items-center space-x-md">
            <button
              onClick={() => navigate('/admin/notifications')}
              className="relative p-base hover:bg-surface-container transition-colors rounded-full text-on-surface-variant"
            >
              <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-[4px] bg-error text-on-error text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-surface">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <button className="p-base hover:bg-surface-container transition-colors rounded-full text-on-surface-variant">
              <span className="material-symbols-outlined" data-icon="settings">settings</span>
            </button>
            <div className="h-8 w-px bg-outline-variant mx-xs"></div>
            <div className="flex items-center space-x-sm">
              <img alt="Ảnh đại diện quản trị" className="w-8 h-8 rounded-full border border-outline-variant" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDz_x0j239O5G04z6TWFxvORUYBmrCFZpZn2FyxSnlLZ9dU0NW7CI-BKDzgJgbrkVa0fALI9ZrhbT0R682s5AnHajZqJbyJhFOmm0v6Ela-J4-3_AHbObpip6IYrdAEsMeUbxxqLYs-H_5JSidzUkqKu9aRZLSBY1wrXLV47TYSdQ8x9zeqJpyLX9kcv9p843eNxPspnH2V9Uid4329MD2vGjqY0tlmfecuJsT673ZklZVid12CfyDN1O41zv-G13kWv98eqFgu0w" />
              <span className="text-body-sm font-bold text-primary">Quản trị phòng khám</span>
            </div>
          </div>
        </header>

        {/* Nội dung động */}
        <Outlet />

        {/* Footer */}
        <footer className="mt-auto px-margin py-lg border-t border-outline-variant flex flex-col md:flex-row items-center justify-between gap-md text-on-surface-variant bg-[#f8f9fa]">
          <span className="text-body-sm">© 2024 MediFlow Admin. Hệ thống quản lý phòng khám.</span>
          <div className="flex items-center gap-lg text-body-sm font-bold">
            <a className="hover:text-primary transition-colors" href="#">Chính sách bảo mật</a>
            <a className="hover:text-primary transition-colors" href="#">Điều khoản sử dụng</a>
            <a className="hover:text-primary transition-colors" href="#">Liên hệ hỗ trợ</a>
          </div>
        </footer>
      </main>
    </div>
  );
}

export const AdminLayout = () => (
  <AdminNotificationProvider>
    <AdminLayoutInner />
  </AdminNotificationProvider>
);
