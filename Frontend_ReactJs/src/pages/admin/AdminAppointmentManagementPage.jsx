import React from 'react';

const AdminAppointmentManagementPage = () => {
  return (
    <div className="p-md lg:p-xl flex-1 overflow-auto">
      {/* Summary Metrics (Bento Style) */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-lg">
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex flex-col justify-between border-l-4 border-primary">
          <span className="font-label-caps text-label-caps text-on-surface-variant">TOTAL APPOINTMENTS</span>
          <div className="flex items-end justify-between mt-sm">
            <span className="font-h2 text-h2">124</span>
            <span className="text-primary font-bold text-body-sm">+12%</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex flex-col justify-between border-l-4 border-secondary">
          <span className="font-label-caps text-label-caps text-on-surface-variant">CONFIRMED TODAY</span>
          <div className="flex items-end justify-between mt-sm">
            <span className="font-h2 text-h2">32</span>
            <div className="flex items-center gap-1 text-on-surface-variant">
              <span className="material-symbols-outlined text-sm" data-icon="check_circle">check_circle</span>
              <span className="text-body-sm">85% rate</span>
            </div>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex flex-col justify-between border-l-4 border-primary-container">
          <span className="font-label-caps text-label-caps text-on-surface-variant">MORNING SLOTS</span>
          <div className="flex items-end justify-between mt-sm">
            <span className="font-h2 text-h2">18</span>
            <span className="text-body-sm text-on-surface-variant">08:00 - 12:00</span>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] flex flex-col justify-between border-l-4 border-tertiary">
          <span className="font-label-caps text-label-caps text-on-surface-variant">AFTERNOON SLOTS</span>
          <div className="flex items-end justify-between mt-sm">
            <span className="font-h2 text-h2">14</span>
            <span className="text-body-sm text-on-surface-variant">13:00 - 18:00</span>
          </div>
        </div>
      </section>

      {/* Table Header & Filters */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="p-md border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-md">
          <h2 className="font-h3 text-h3 text-on-surface">Appointment Registry</h2>
          <div className="flex flex-wrap items-center gap-sm">
            {/* Date Range Picker Mockup */}
            <div className="flex items-center gap-2 bg-surface-container-low px-sm py-2 rounded-lg border border-outline-variant/30">
              <span className="material-symbols-outlined text-outline" data-icon="calendar_today">calendar_today</span>
              <span className="font-body-sm">Oct 24, 2023 - Oct 30, 2023</span>
            </div>
            {/* Dropdowns */}
            <select className="bg-surface-container-low border-none rounded-lg text-body-sm py-2 px-sm focus:ring-primary outline-none">
              <option>All Doctors</option>
              <option>Dr. Sarah Chen</option>
              <option>Dr. Marcus Wright</option>
              <option>Dr. Elena Rodriguez</option>
            </select>
            <select className="bg-surface-container-low border-none rounded-lg text-body-sm py-2 px-sm focus:ring-primary outline-none">
              <option>All Statuses</option>
              <option>Confirmed</option>
              <option>Pending</option>
              <option>Cancelled</option>
              <option>Completed</option>
            </select>
            <button className="bg-primary text-on-primary font-button px-md py-2.5 rounded-lg flex items-center gap-2 hover:opacity-90 transition-all shadow-sm">
              <span className="material-symbols-outlined text-[20px]" data-icon="add">add</span>
              New Appointment
            </button>
          </div>
        </div>

        {/* High-Density Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
                <th className="px-md py-4">ID</th>
                <th className="px-md py-4">Patient</th>
                <th className="px-md py-4">Doctor</th>
                <th className="px-md py-4">Date &amp; Time</th>
                <th className="px-md py-4">Reason</th>
                <th className="px-md py-4">Status</th>
                <th className="px-md py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {/* Table Row 1 */}
              <tr className="hover:bg-surface-container-low transition-colors group">
                <td className="px-md py-4 font-body-sm font-bold text-primary">#APT-4821</td>
                <td className="px-md py-4">
                  <div className="flex items-center gap-3">
                    <img alt="Patient" className="w-8 h-8 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCK9ies8GZctNuMz6AMz11kiiCEB6qzj3FDYCuA65qwJF7JoO-Pt1CsXFGKfmrAN6Hne9cfWoHfqyE-yJm2U7MXQU_1lKhq88Fz3LnDWq8LWjPiGSHOiarpdqmG7cA1JcZ1NkPcVtuWhJcdpSTaUdZqyQ_5FsGNlOo6g8mFg3ZL7kKiAcoSZdADMSzittfmq_hLLrF0BfvVkMsCm9sJq2yhvffGzPuSQsuuDc7jZGVwkgpq3Iilo8XH6SnBKJoPIVYBjyjtmmtpzA" />
                    <div>
                      <p className="font-body-md font-bold">Jonathan Miller</p>
                      <p className="text-[12px] text-on-surface-variant">ID: P-9921</p>
                    </div>
                  </div>
                </td>
                <td className="px-md py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[20px]" data-icon="medical_services">medical_services</span>
                    </div>
                    <p className="font-body-md">Dr. Marcus Wright</p>
                  </div>
                </td>
                <td className="px-md py-4">
                  <p className="font-body-md">Oct 26, 2023</p>
                  <p className="text-body-sm text-on-surface-variant">09:30 AM</p>
                </td>
                <td className="px-md py-4">
                  <span className="font-body-sm">Annual Cardiovascular Checkup</span>
                </td>
                <td className="px-md py-4">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[12px] font-bold">Confirmed</span>
                </td>
                <td className="px-md py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-primary/10 text-primary rounded-lg" title="Edit"><span className="material-symbols-outlined text-[20px]" data-icon="edit">edit</span></button>
                    <button className="p-2 hover:bg-error/10 text-error rounded-lg" title="Cancel"><span className="material-symbols-outlined text-[20px]" data-icon="cancel">cancel</span></button>
                  </div>
                </td>
              </tr>
              {/* Table Row 2 */}
              <tr className="hover:bg-surface-container-low transition-colors group">
                <td className="px-md py-4 font-body-sm font-bold text-primary">#APT-4822</td>
                <td className="px-md py-4">
                  <div className="flex items-center gap-3">
                    <img alt="Patient" className="w-8 h-8 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6NgYbJ8npEJsfVmZCqw2Qg1IrZEhXFJVFvWaCl4aEW5NgsbfOfzMAQCL9s4wxCYqBsWsBvjWwwT8-lF8hdumY42FBXphi1QWxYbEf-zS3vwyqvpTlGoCfFjl8NzoikctsPFJFh6eYxkioO696Zvd3IJ_LEtRL-aa_r-MdQHX6voaKjzcCe-6NLAlrAAg0OTM-nDj0MuHXMBycGKGWBJ50vjdF8J6Z3EnyRnqi9iiXgicQb3OJfy7txx45wu3Dc37WpJcSaiqaAw" />
                    <div>
                      <p className="font-body-md font-bold">Sarah Williams</p>
                      <p className="text-[12px] text-on-surface-variant">ID: P-1023</p>
                    </div>
                  </div>
                </td>
                <td className="px-md py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary-container/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-secondary text-[20px]" data-icon="medical_services">medical_services</span>
                    </div>
                    <p className="font-body-md">Dr. Elena Rodriguez</p>
                  </div>
                </td>
                <td className="px-md py-4">
                  <p className="font-body-md">Oct 26, 2023</p>
                  <p className="text-body-sm text-on-surface-variant">10:15 AM</p>
                </td>
                <td className="px-md py-4">
                  <span className="font-body-sm">Pediatric Consultation</span>
                </td>
                <td className="px-md py-4">
                  <span className="bg-secondary-fixed/50 text-on-secondary-container px-3 py-1 rounded-full text-[12px] font-bold">Pending</span>
                </td>
                <td className="px-md py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-primary/10 text-primary rounded-lg" title="Edit"><span className="material-symbols-outlined text-[20px]" data-icon="edit">edit</span></button>
                    <button className="p-2 hover:bg-error/10 text-error rounded-lg" title="Cancel"><span className="material-symbols-outlined text-[20px]" data-icon="cancel">cancel</span></button>
                  </div>
                </td>
              </tr>
              {/* Table Row 3 */}
              <tr className="hover:bg-surface-container-low transition-colors group">
                <td className="px-md py-4 font-body-sm font-bold text-primary">#APT-4823</td>
                <td className="px-md py-4">
                  <div className="flex items-center gap-3">
                    <img alt="Patient" className="w-8 h-8 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQbu8evVDqviVGX3fbM64vYwGNoCcPyx4iXjj6p2RcZJ_o8FDVE7R4dLLB0oTA3EN0S6MKH1KhkFY7MhNjXbgULwu7_esijPDusUleWR4yeM_Y71iJirDHNPerqtAnDA4fshwX3xNZ_bZS6QUNz0BjgzQDK1QNNazUBSAOiKlYaAvjIvcPNMTnuv5prSKe8MiA4Rjj6QGet-EX63MsjAfVToxTFmgv-t3UrKw703JdWE2Zd18ZF0NLf7LC7M2PZgiAh6NiROHJhg" />
                    <div>
                      <p className="font-body-md font-bold">Emma Thompson</p>
                      <p className="text-[12px] text-on-surface-variant">ID: P-8821</p>
                    </div>
                  </div>
                </td>
                <td className="px-md py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[20px]" data-icon="medical_services">medical_services</span>
                    </div>
                    <p className="font-body-md">Dr. Sarah Chen</p>
                  </div>
                </td>
                <td className="px-md py-4">
                  <p className="font-body-md">Oct 26, 2023</p>
                  <p className="text-body-sm text-on-surface-variant">11:00 AM</p>
                </td>
                <td className="px-md py-4">
                  <span className="font-body-sm">Post-Op Review</span>
                </td>
                <td className="px-md py-4">
                  <span className="bg-tertiary-container/20 text-tertiary-container px-3 py-1 rounded-full text-[12px] font-bold">Completed</span>
                </td>
                <td className="px-md py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-primary/10 text-primary rounded-lg" title="Edit"><span className="material-symbols-outlined text-[20px]" data-icon="edit">edit</span></button>
                    <button className="p-2 hover:bg-error/10 text-error rounded-lg" title="Cancel"><span className="material-symbols-outlined text-[20px]" data-icon="cancel">cancel</span></button>
                  </div>
                </td>
              </tr>
              {/* Table Row 4 */}
              <tr className="hover:bg-surface-container-low transition-colors group">
                <td className="px-md py-4 font-body-sm font-bold text-primary">#APT-4824</td>
                <td className="px-md py-4">
                  <div className="flex items-center gap-3">
                    <img alt="Patient" className="w-8 h-8 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBufXYOk3bDg72AknC16f_sI6ATX85w1y1SJkn4hiXkMyh97PTO_a9awCi3NdPlOjLGWM9OvxgXe7tQndH-qpzoUA_ZhMAl-UdpqIccudhd8jTY7waqawIB4TgOGF8tsRLFuYmo9rBgK0N7bPDqpZRPuhsUaPcyVZk2UkMLhTri6qlS6_UDPl-WH5atgz6S0WulFMT7fwUuQZI1ldDlZFboW0jeK4Ks2O_hV50KVzROdQYa2kejtqP_Yg9vxNytKHBx_8dQ6q189g" />
                    <div>
                      <p className="font-body-md font-bold">Robert Davis</p>
                      <p className="text-[12px] text-on-surface-variant">ID: P-4423</p>
                    </div>
                  </div>
                </td>
                <td className="px-md py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[20px]" data-icon="medical_services">medical_services</span>
                    </div>
                    <p className="font-body-md">Dr. Marcus Wright</p>
                  </div>
                </td>
                <td className="px-md py-4">
                  <p className="font-body-md">Oct 26, 2023</p>
                  <p className="text-body-sm text-on-surface-variant">02:30 PM</p>
                </td>
                <td className="px-md py-4">
                  <span className="font-body-sm">Neurology Screening</span>
                </td>
                <td className="px-md py-4">
                  <span className="bg-error-container text-on-error-container px-3 py-1 rounded-full text-[12px] font-bold">Cancelled</span>
                </td>
                <td className="px-md py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-primary/10 text-primary rounded-lg" title="Edit"><span className="material-symbols-outlined text-[20px]" data-icon="edit">edit</span></button>
                    <button className="p-2 hover:bg-error/10 text-error rounded-lg" title="Cancel"><span className="material-symbols-outlined text-[20px]" data-icon="cancel">cancel</span></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="p-md bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between">
          <p className="text-body-sm text-on-surface-variant">Showing 1 to 4 of 124 entries</p>
          <div className="flex items-center gap-xs">
            <button className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-highest transition-all"><span className="material-symbols-outlined text-sm" data-icon="chevron_left">chevron_left</span></button>
            <button className="w-8 h-8 rounded-lg bg-primary text-on-primary font-bold text-body-sm">1</button>
            <button className="w-8 h-8 rounded-lg border border-outline-variant hover:bg-surface-container-highest transition-all text-body-sm">2</button>
            <button className="w-8 h-8 rounded-lg border border-outline-variant hover:bg-surface-container-highest transition-all text-body-sm">3</button>
            <button className="p-2 rounded-lg border border-outline-variant hover:bg-surface-container-highest transition-all"><span className="material-symbols-outlined text-sm" data-icon="chevron_right">chevron_right</span></button>
          </div>
        </div>
      </div>

      {/* Focus Feature: Quick View Slot (Asymmetric Layout) */}
      <section className="mt-lg grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-2 bg-surface-container-lowest p-md rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-md">
            <h3 className="font-h3 text-h3">Weekly Capacity</h3>
            <button className="text-primary font-bold text-body-sm hover:underline">View Calendar</button>
          </div>
          <div className="flex items-end justify-between gap-2 h-40">
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-primary/20 rounded-t-lg h-24 relative overflow-hidden">
                <div className="absolute bottom-0 w-full bg-primary h-2/3"></div>
              </div>
              <span className="font-label-caps text-[10px]">MON</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-primary/20 rounded-t-lg h-24 relative overflow-hidden">
                <div className="absolute bottom-0 w-full bg-primary h-full"></div>
              </div>
              <span className="font-label-caps text-[10px]">TUE</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-primary/20 rounded-t-lg h-24 relative overflow-hidden">
                <div className="absolute bottom-0 w-full bg-primary h-[85%]"></div>
              </div>
              <span class="font-label-caps text-[10px]">WED</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-primary/20 rounded-t-lg h-24 relative overflow-hidden">
                <div className="absolute bottom-0 w-full bg-primary h-[40%]"></div>
              </div>
              <span className="font-label-caps text-[10px]">THU</span>
            </div>
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-primary/20 rounded-t-lg h-24 relative overflow-hidden">
                <div className="absolute bottom-0 w-full bg-primary h-[95%]"></div>
              </div>
              <span className="font-label-caps text-[10px]">FRI</span>
            </div>
          </div>
        </div>
        <div className="bg-primary text-on-primary p-md rounded-xl shadow-lg flex flex-col justify-between">
          <div>
            <span className="material-symbols-outlined text-[32px] mb-2" data-icon="rocket_launch">rocket_launch</span>
            <h3 className="font-h3 text-h3 leading-tight">Optimization Alert</h3>
            <p className="font-body-sm mt-2 opacity-90">3 afternoon slots are currently available for Dr. Chen tomorrow. Consider notifying the waiting list?</p>
          </div>
          <button className="w-full bg-on-primary text-primary font-button py-3 rounded-lg mt-md hover:bg-inverse-on-surface transition-all">
            Notify Patients
          </button>
        </div>
      </section>

      {/* FAB for quick action */}
      <button className="fixed bottom-10 right-10 bg-primary text-on-primary w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50">
        <span className="material-symbols-outlined" data-icon="add">add</span>
      </button>
    </div>
  );
};

export default AdminAppointmentManagementPage;
