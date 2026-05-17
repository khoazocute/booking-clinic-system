import React from 'react';

const AdminNotificationManagementPage = () => {
  return (
    <div className="p-margin max-w-[1140px] mx-auto w-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-lg gap-md">
        <div>
          <h2 className="text-h2 font-h2 text-on-surface">System Notifications</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-xs">Manage and track all medical facility alerts and communications.</p>
        </div>
        <div className="flex items-center gap-sm">
          <button className="flex items-center gap-xs px-md py-sm text-primary border border-primary rounded-lg font-button hover:bg-primary-fixed-dim transition-all active:scale-95">
            <span className="material-symbols-outlined">done_all</span>
            Mark all as read
          </button>
          <button className="flex items-center justify-center p-sm border border-outline-variant rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
        </div>
      </div>

      {/* Filters & Stats (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-lg">
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex items-center gap-md border border-outline-variant/30">
          <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center">
            <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
          </div>
          <div>
            <p className="text-label-caps font-label-caps text-on-surface-variant">ALERTS</p>
            <p className="text-h3 font-h3">04</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex items-center gap-md border border-outline-variant/30">
          <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
          </div>
          <div>
            <p className="text-label-caps font-label-caps text-on-surface-variant">INFO</p>
            <p className="text-h3 font-h3">12</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex items-center gap-md border border-outline-variant/30">
          <div className="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <div>
            <p className="text-label-caps font-label-caps text-on-surface-variant">SUCCESS</p>
            <p className="text-h3 font-h3">28</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex items-center gap-md border border-outline-variant/30">
          <div className="w-12 h-12 rounded-full bg-on-tertiary-fixed/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>
          <div>
            <p className="text-label-caps font-label-caps text-on-surface-variant">WARNING</p>
            <p className="text-h3 font-h3">07</p>
          </div>
        </div>
      </div>

      {/* Notifications List Container */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] overflow-hidden border border-outline-variant/50">
        {/* List Header */}
        <div className="grid grid-cols-12 gap-sm px-md py-sm bg-surface-container border-b border-outline-variant text-label-caps font-label-caps text-on-surface-variant">
          <div className="col-span-1 flex justify-center">STATUS</div>
          <div className="col-span-2">TYPE</div>
          <div className="col-span-6">NOTIFICATION</div>
          <div className="col-span-2 text-right">TIME</div>
          <div className="col-span-1"></div>
        </div>

        {/* Notification Item: Alert (Unread) */}
        <div className="grid grid-cols-12 gap-sm px-md py-md border-b border-outline-variant hover:bg-surface-container-low transition-colors items-center bg-primary-container/5">
          <div className="col-span-1 flex justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/20"></div>
          </div>
          <div className="col-span-2 flex items-center gap-xs">
            <span className="px-3 py-1 rounded-full text-label-caps bg-error-container text-on-error-container font-bold">ALERT</span>
          </div>
          <div className="col-span-6">
            <p className="text-body-md font-bold text-on-surface">Critical Supply Shortage: ICU 02</p>
            <p className="text-body-sm text-on-surface-variant">Cardiac monitor electrodes falling below safety threshold (Current: 15 units).</p>
          </div>
          <div className="col-span-2 text-right">
            <p className="text-body-sm text-on-surface-variant">2 mins ago</p>
          </div>
          <div className="col-span-1 flex justify-end">
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">more_vert</button>
          </div>
        </div>

        {/* Notification Item: Success (Read) */}
        <div className="grid grid-cols-12 gap-sm px-md py-md border-b border-outline-variant hover:bg-surface-container-low transition-colors items-center opacity-80">
          <div className="col-span-1 flex justify-center">
            {/* Read state icon */}
          </div>
          <div className="col-span-2 flex items-center gap-xs">
            <span className="px-3 py-1 rounded-full text-label-caps bg-primary-container/10 text-primary font-bold">SUCCESS</span>
          </div>
          <div className="col-span-6">
            <div className="flex items-center gap-sm">
              <p className="text-body-md font-body-md text-on-surface">Appointment Confirmed: Patient #9921</p>
              <button className="text-primary text-body-sm font-bold flex items-center gap-xs hover:underline decoration-2">
                View Related <span className="material-symbols-outlined text-sm">open_in_new</span>
              </button>
            </div>
            <p className="text-body-sm text-on-surface-variant">Dr. Miller has accepted the emergency consult for 2:30 PM.</p>
          </div>
          <div className="col-span-2 text-right">
            <p className="text-body-sm text-on-surface-variant">15 mins ago</p>
          </div>
          <div className="col-span-1 flex justify-end">
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">more_vert</button>
          </div>
        </div>

        {/* Notification Item: Warning (Unread) */}
        <div className="grid grid-cols-12 gap-sm px-md py-md border-b border-outline-variant hover:bg-surface-container-low transition-colors items-center bg-primary-container/5">
          <div className="col-span-1 flex justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/20"></div>
          </div>
          <div className="col-span-2 flex items-center gap-xs">
            <span className="px-3 py-1 rounded-full text-label-caps bg-tertiary-fixed text-on-tertiary-fixed-variant font-bold">WARNING</span>
          </div>
          <div className="col-span-6">
            <p className="text-body-md font-bold text-on-surface">System Maintenance Scheduled</p>
            <p className="text-body-sm text-on-surface-variant">Database optimization scheduled for 02:00 AM UTC. Minor latency expected.</p>
          </div>
          <div className="col-span-2 text-right">
            <p className="text-body-sm text-on-surface-variant">1 hour ago</p>
          </div>
          <div className="col-span-1 flex justify-end">
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">more_vert</button>
          </div>
        </div>

        {/* Notification Item: Info (Read) */}
        <div className="grid grid-cols-12 gap-sm px-md py-md border-b border-outline-variant hover:bg-surface-container-low transition-colors items-center opacity-80">
          <div className="col-span-1 flex justify-center">
            {/* Read state icon */}
          </div>
          <div className="col-span-2 flex items-center gap-xs">
            <span className="px-3 py-1 rounded-full text-label-caps bg-secondary-container/20 text-secondary font-bold">INFO</span>
          </div>
          <div className="col-span-6">
            <p className="text-body-md font-body-md text-on-surface">New Review Received</p>
            <p className="text-body-sm text-on-surface-variant">Patient "John D." left a 5-star review for Pediatric Services.</p>
          </div>
          <div className="col-span-2 text-right">
            <p className="text-body-sm text-on-surface-variant">3 hours ago</p>
          </div>
          <div className="col-span-1 flex justify-end">
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">more_vert</button>
          </div>
        </div>

        {/* Notification Item: Info (Unread) */}
        <div className="grid grid-cols-12 gap-sm px-md py-md border-b border-outline-variant hover:bg-surface-container-low transition-colors items-center bg-primary-container/5">
          <div className="col-span-1 flex justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/20"></div>
          </div>
          <div className="col-span-2 flex items-center gap-xs">
            <span className="px-3 py-1 rounded-full text-label-caps bg-secondary-container/20 text-secondary font-bold">INFO</span>
          </div>
          <div className="col-span-6">
            <p className="text-body-md font-bold text-on-surface">Policy Update Reminder</p>
            <p className="text-body-sm text-on-surface-variant">Updated HIPAA compliance guidelines are available in the staff portal.</p>
          </div>
          <div className="col-span-2 text-right">
            <p className="text-body-sm text-on-surface-variant">5 hours ago</p>
          </div>
          <div className="col-span-1 flex justify-end">
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">more_vert</button>
          </div>
        </div>

        {/* Notification Item: Success (Unread) */}
        <div className="grid grid-cols-12 gap-sm px-md py-md border-b border-outline-variant hover:bg-surface-container-low transition-colors items-center bg-primary-container/5">
          <div className="col-span-1 flex justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/20"></div>
          </div>
          <div className="col-span-2 flex items-center gap-xs">
            <span className="px-3 py-1 rounded-full text-label-caps bg-primary-container/10 text-primary font-bold">SUCCESS</span>
          </div>
          <div className="col-span-6">
            <div className="flex items-center gap-sm">
              <p className="text-body-md font-bold text-on-surface">Payment Processed: Invoice #4401</p>
              <button className="text-primary text-body-sm font-bold flex items-center gap-xs hover:underline decoration-2">
                View Related <span className="material-symbols-outlined text-sm">open_in_new</span>
              </button>
            </div>
            <p className="text-body-sm text-on-surface-variant">The billing for $1,250.00 from Aetna Insurance has been settled.</p>
          </div>
          <div className="col-span-2 text-right">
            <p className="text-body-sm text-on-surface-variant">6 hours ago</p>
          </div>
          <div className="col-span-1 flex justify-end">
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">more_vert</button>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-lg">
        <p className="text-body-sm text-on-surface-variant">Showing 6 of 51 notifications</p>
        <div className="flex items-center gap-xs">
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors disabled:opacity-30" disabled>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-on-primary font-bold shadow-sm">1</button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors">2</button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors">3</button>
          <span className="mx-xs text-on-surface-variant">...</span>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors">9</button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminNotificationManagementPage;
