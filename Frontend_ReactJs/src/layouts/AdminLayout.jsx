import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearAccessToken } from '../services/authService';

export const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAccessToken();
    navigate('/login');
  };

  return (
    <div className="font-body-md text-body-md overflow-x-hidden bg-[#f8f9fa] text-[#191c1d]">
      {/* Sidebar Navigation */}
      <aside className="flex flex-col h-screen fixed left-0 top-0 py-lg px-sm space-y-base bg-surface-container-lowest border-r border-outline-variant shadow-md w-64 z-50">
        <div className="px-sm mb-lg">
          <div className="flex items-center space-x-sm mb-xs">
            <img alt="Clinic Logo" className="w-10 h-10 rounded-lg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYgrDKpqi2HasFhQsSh5u7c6bzg9Duer-DUhKxFwZHpBMr6RcYS8_Ic2hS9IgtD75KQ6xACNVgVqeg5swfLjU4jRSBmajIYQefRTveWdhFzQQUnxO6h-pNrYkPSr76Pm63LrLldZ5gshebpd5EURvasEfMY0njwFirpVBIv9KGT-iE4Q9Yh3ZnNZz7e-xnJn1MRKjOo_BOCatQrc7CxnEM257gY_-WzvVDmv9qi_W7GIqOO7Al31VuSXiu4GUKLCR2RfZfPTBkAA" />
            <span className="text-h3 font-h3 font-bold text-primary">MediFlow Admin</span>
          </div>
          <p className="text-body-sm font-body-sm text-on-surface-variant ml-12">General Hospital</p>
        </div>
        <nav className="flex-grow space-y-xs overflow-y-auto px-xs">
          <NavLink 
            to="/admin" 
            end
            className={({ isActive }) => `flex items-center space-x-sm px-md py-sm rounded-lg transition-all duration-200 ${isActive ? 'bg-primary-container text-on-primary-container font-bold translate-x-1' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
          >
            <span className="material-symbols-outlined" data-icon="dashboard">dashboard</span>
            <span className="text-body-sm font-body-sm">Dashboard</span>
          </NavLink>
          
          <a className="flex items-center space-x-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 rounded-lg" href="#">
            <span className="material-symbols-outlined" data-icon="group">group</span>
            <span className="text-body-sm font-body-sm">Users</span>
          </a>
          <a className="flex items-center space-x-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 rounded-lg" href="#">
            <span className="material-symbols-outlined" data-icon="medical_services">medical_services</span>
            <span className="text-body-sm font-body-sm">Doctors</span>
          </a>
          <a className="flex items-center space-x-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 rounded-lg" href="#">
            <span className="material-symbols-outlined" data-icon="category">category</span>
            <span className="text-body-sm font-body-sm">Specialties</span>
          </a>
          
          <NavLink 
            to="/admin/medicines" 
            className={({ isActive }) => `flex items-center space-x-sm px-md py-sm rounded-lg transition-all duration-200 ${isActive ? 'bg-primary-container text-on-primary-container font-bold translate-x-1' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
          >
            <span className="material-symbols-outlined" data-icon="pill">pill</span>
            <span className="text-body-sm font-body-sm">Medicines</span>
          </NavLink>

          <NavLink 
            to="/admin/appointments" 
            className={({ isActive }) => `flex items-center space-x-sm px-md py-sm rounded-lg transition-all duration-200 ${isActive ? 'bg-primary-container text-on-primary-container font-bold translate-x-1' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
          >
            <span className="material-symbols-outlined" data-icon="calendar_today">calendar_today</span>
            <span className="text-body-sm font-body-sm">Appointments</span>
          </NavLink>
          <a className="flex items-center space-x-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 rounded-lg" href="#">
            <span className="material-symbols-outlined" data-icon="payments">payments</span>
            <span className="text-body-sm font-body-sm">Payments</span>
          </a>
          <a className="flex items-center space-x-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-high transition-all duration-200 rounded-lg" href="#">
            <span className="material-symbols-outlined" data-icon="rate_review">rate_review</span>
            <span className="text-body-sm font-body-sm">Reviews</span>
          </a>
          <NavLink 
            to="/admin/notifications" 
            className={({ isActive }) => `flex items-center space-x-sm px-md py-sm rounded-lg transition-all duration-200 ${isActive ? 'bg-primary-container text-on-primary-container font-bold translate-x-1' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
          >
            <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
            <span className="text-body-sm font-body-sm">Notifications</span>
          </NavLink>
        </nav>
        <div className="px-xs pt-base border-t border-outline-variant space-y-xs">
          <a className="flex items-center space-x-sm px-md py-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg" href="#">
            <span className="material-symbols-outlined" data-icon="help">help</span>
            <span className="text-body-sm font-body-sm">Support</span>
          </a>
          <button onClick={handleLogout} className="flex items-center space-x-sm px-md py-sm text-error hover:bg-error-container rounded-lg w-full text-left">
            <span className="material-symbols-outlined" data-icon="logout">logout</span>
            <span className="text-body-sm font-body-sm">Logout</span>
          </button>
        </div>
      </aside>
      
      {/* Main Content Area */}
      <main className="ml-64 flex flex-col min-h-screen">
        {/* Top Nav Bar */}
        <header className="flex justify-between items-center w-full px-md h-16 sticky top-0 z-40 bg-surface border-b border-outline-variant shadow-sm">
          <div className="flex items-center bg-surface-container-low rounded-full px-md py-xs border border-outline-variant w-96">
            <span className="material-symbols-outlined text-outline mr-sm" data-icon="search">search</span>
            <input className="bg-transparent border-none focus:ring-0 text-body-sm w-full outline-none" placeholder="Search..." type="text" />
          </div>
          <div className="flex items-center space-x-md">
            <button className="relative p-base hover:bg-surface-container transition-colors rounded-full text-on-surface-variant">
              <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface"></span>
            </button>
            <button className="p-base hover:bg-surface-container transition-colors rounded-full text-on-surface-variant">
              <span className="material-symbols-outlined" data-icon="settings">settings</span>
            </button>
            <div className="h-8 w-px bg-outline-variant mx-xs"></div>
            <div className="flex items-center space-x-sm">
              <img alt="Admin profile photo" className="w-8 h-8 rounded-full border border-outline-variant" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDz_x0j239O5G04z6TWFxvORUYBmrCFZpZn2FyxSnlLZ9dU0NW7CI-BKDzgJgbrkVa0fALI9ZrhbT0R682s5AnHajZqJbyJhFOmm0v6Ela-J4-3_AHbObpip6IYrdAEsMeUbxxqLYs-H_5JSidzUkqKu9aRZLSBY1wrXLV47TYSdQ8x9zeqJpyLX9kcv9p843eNxPspnH2V9Uid4329MD2vGjqY0tlmfecuJsT673ZklZVid12CfyDN1O41zv-G13kWv98eqFgu0w" />
              <span className="text-body-sm font-bold text-primary">Clinic Admin</span>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <Outlet />

        {/* Footer */}
        <footer className="mt-auto px-margin py-lg border-t border-outline-variant flex flex-col md:flex-row items-center justify-between gap-md text-on-surface-variant bg-[#f8f9fa]">
          <span className="text-body-sm">© 2024 MediFlow Admin System. Professional Healthcare Management.</span>
          <div className="flex items-center gap-lg text-body-sm font-bold">
            <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-primary transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-primary transition-colors" href="#">Contact Support</a>
          </div>
        </footer>
      </main>
    </div>
  );
};
