import React from 'react';

const MedicineManagementPage = () => {
  return (
    <div className="p-margin flex-grow">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-lg gap-md">
        <div>
          <h1 className="font-h1 text-h1 text-on-background">Medicine Management</h1>
          <p className="text-body-lg text-on-surface-variant mt-xs">Track and manage your pharmaceutical inventory levels in real-time.</p>
        </div>
        <button className="bg-primary text-on-primary font-button px-lg py-sm rounded-lg flex items-center gap-xs shadow-md active:scale-95 transition-transform">
          <span className="material-symbols-outlined" data-icon="add">add</span>
          <span>Add New Medicine</span>
        </button>
      </div>
      
      {/* Dashboard Statistics Bento Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter mb-lg">
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-label-caps font-label-caps text-on-surface-variant">TOTAL PRODUCTS</span>
            <span className="material-symbols-outlined text-primary" data-icon="inventory_2">inventory_2</span>
          </div>
          <div className="text-h2 font-h2">1,284</div>
          <div className="text-body-sm text-on-surface-variant mt-xs">+12 from last month</div>
        </div>
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-label-caps font-label-caps text-on-surface-variant">LOW STOCK</span>
            <span className="material-symbols-outlined text-secondary" data-icon="warning">warning</span>
          </div>
          <div className="text-h2 font-h2 text-secondary">42</div>
          <div className="text-body-sm text-on-surface-variant mt-xs">Requires immediate reorder</div>
        </div>
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-label-caps font-label-caps text-on-surface-variant">OUT OF STOCK</span>
            <span className="material-symbols-outlined text-error" data-icon="error">error</span>
          </div>
          <div className="text-h2 font-h2 text-error">15</div>
          <div className="text-body-sm text-on-surface-variant mt-xs">Critical stockouts detected</div>
        </div>
        <div className="bg-surface-container-lowest p-md rounded-xl shadow-sm border border-outline-variant">
          <div className="flex items-center justify-between mb-sm">
            <span className="text-label-caps font-label-caps text-on-surface-variant">TOTAL VALUE</span>
            <span className="material-symbols-outlined text-tertiary" data-icon="payments">payments</span>
          </div>
          <div className="text-h2 font-h2">$42,850</div>
          <div className="text-body-sm text-on-surface-variant mt-xs">Current inventory valuation</div>
        </div>
      </div>

      {/* Filters & Table Section */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
        <div className="p-md border-b border-outline-variant flex flex-col md:flex-row items-center justify-between gap-md bg-surface-container-low">
          <div className="flex flex-wrap items-center gap-sm w-full md:w-auto">
            <div className="flex items-center bg-white border border-outline px-sm py-xs rounded-lg text-body-sm min-w-[200px]">
              <span className="material-symbols-outlined text-outline mr-xs" data-icon="filter_alt">filter_alt</span>
              <select className="bg-transparent border-none focus:ring-0 w-full outline-none py-0">
                <option>All Statuses</option>
                <option>In Stock</option>
                <option>Low Stock</option>
                <option>Out of Stock</option>
              </select>
            </div>
            <div className="flex items-center bg-white border border-outline px-sm py-xs rounded-lg text-body-sm">
              <span className="material-symbols-outlined text-outline mr-xs" data-icon="sort">sort</span>
              <select className="bg-transparent border-none focus:ring-0 outline-none py-0">
                <option>Created Date</option>
                <option>Name A-Z</option>
                <option>Price: High to Low</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-sm">
            <span className="text-body-sm text-on-surface-variant">Showing 1-10 of 1,284 medicines</span>
            <div className="flex items-center space-x-xs">
              <button className="p-xs border border-outline rounded-lg hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined" data-icon="chevron_left">chevron_left</span>
              </button>
              <button className="p-xs border border-outline rounded-lg hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined" data-icon="chevron_right">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high border-b border-outline-variant">
                <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">ID</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Medicine Name</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Unit</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Unit Price</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">Created Date</th>
                <th className="px-md py-sm font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {/* Row 1 */}
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="px-md py-md text-body-sm text-on-surface-variant">#MD-1002</td>
                <td className="px-md py-md">
                  <div className="flex items-center gap-sm">
                    <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined" data-icon="pill">pill</span>
                    </div>
                    <div>
                      <div className="text-body-md font-bold">Amoxicillin 500mg</div>
                      <div className="text-body-sm text-on-surface-variant">Antibiotics</div>
                    </div>
                  </div>
                </td>
                <td className="px-md py-md text-body-sm">Box (100 tabs)</td>
                <td className="px-md py-md text-body-sm font-bold">$12.50</td>
                <td className="px-md py-md">
                  <span className="px-sm py-1 rounded-full text-label-caps font-label-caps bg-secondary-fixed text-on-secondary-fixed-variant">In Stock</span>
                </td>
                <td className="px-md py-md text-body-sm text-on-surface-variant">Oct 12, 2023</td>
                <td className="px-md py-md text-right">
                  <div className="flex items-center justify-end space-x-xs">
                    <button className="p-xs text-primary hover:bg-primary-fixed rounded-lg"><span className="material-symbols-outlined" data-icon="edit">edit</span></button>
                    <button className="p-xs text-error hover:bg-error-container rounded-lg"><span className="material-symbols-outlined" data-icon="delete">delete</span></button>
                    <button className="p-xs text-on-surface-variant hover:bg-surface-variant rounded-lg"><span className="material-symbols-outlined" data-icon="more_vert">more_vert</span></button>
                  </div>
                </td>
              </tr>
              {/* Row 2 */}
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="px-md py-md text-body-sm text-on-surface-variant">#MD-1005</td>
                <td className="px-md py-md">
                  <div className="flex items-center gap-sm">
                    <div className="w-10 h-10 rounded-lg bg-secondary-fixed-dim flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined" data-icon="vaccines">vaccines</span>
                    </div>
                    <div>
                      <div className="text-body-md font-bold">Insulin Glargine</div>
                      <div className="text-body-sm text-on-surface-variant">Antidiabetics</div>
                    </div>
                  </div>
                </td>
                <td className="px-md py-md text-body-sm">Vial (10ml)</td>
                <td className="px-md py-md text-body-sm font-bold">$84.20</td>
                <td className="px-md py-md">
                  <span className="px-sm py-1 rounded-full text-label-caps font-label-caps bg-orange-100 text-orange-800">Low Stock</span>
                </td>
                <td className="px-md py-md text-body-sm text-on-surface-variant">Nov 05, 2023</td>
                <td className="px-md py-md text-right">
                  <div className="flex items-center justify-end space-x-xs">
                    <button className="p-xs text-primary hover:bg-primary-fixed rounded-lg"><span className="material-symbols-outlined" data-icon="edit">edit</span></button>
                    <button className="p-xs text-error hover:bg-error-container rounded-lg"><span className="material-symbols-outlined" data-icon="delete">delete</span></button>
                    <button className="p-xs text-on-surface-variant hover:bg-surface-variant rounded-lg"><span className="material-symbols-outlined" data-icon="more_vert">more_vert</span></button>
                  </div>
                </td>
              </tr>
              {/* Row 3 */}
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="px-md py-md text-body-sm text-on-surface-variant">#MD-1011</td>
                <td className="px-md py-md">
                  <div className="flex items-center gap-sm">
                    <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined" data-icon="medical_information">medical_information</span>
                    </div>
                    <div>
                      <div className="text-body-md font-bold">Atorvastatin 20mg</div>
                      <div className="text-body-sm text-on-surface-variant">Statins</div>
                    </div>
                  </div>
                </td>
                <td className="px-md py-md text-body-sm">Bottle (30 caps)</td>
                <td className="px-md py-md text-body-sm font-bold">$18.00</td>
                <td className="px-md py-md">
                  <span className="px-sm py-1 rounded-full text-label-caps font-label-caps bg-error-container text-on-error-container">Out of Stock</span>
                </td>
                <td className="px-md py-md text-body-sm text-on-surface-variant">Dec 20, 2023</td>
                <td className="px-md py-md text-right">
                  <div className="flex items-center justify-end space-x-xs">
                    <button className="p-xs text-primary hover:bg-primary-fixed rounded-lg"><span className="material-symbols-outlined" data-icon="edit">edit</span></button>
                    <button className="p-xs text-error hover:bg-error-container rounded-lg"><span className="material-symbols-outlined" data-icon="delete">delete</span></button>
                    <button className="p-xs text-on-surface-variant hover:bg-surface-variant rounded-lg"><span className="material-symbols-outlined" data-icon="more_vert">more_vert</span></button>
                  </div>
                </td>
              </tr>
              {/* Row 4 */}
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="px-md py-md text-body-sm text-on-surface-variant">#MD-1014</td>
                <td className="px-md py-md">
                  <div className="flex items-center gap-sm">
                    <div className="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined" data-icon="medication">medication</span>
                    </div>
                    <div>
                      <div className="text-body-md font-bold">Metformin 850mg</div>
                      <div className="text-body-sm text-on-surface-variant">Antidiabetics</div>
                    </div>
                  </div>
                </td>
                <td className="px-md py-md text-body-sm">Strip (15 tabs)</td>
                <td className="px-md py-md text-body-sm font-bold">$5.75</td>
                <td className="px-md py-md">
                  <span className="px-sm py-1 rounded-full text-label-caps font-label-caps bg-secondary-fixed text-on-secondary-fixed-variant">In Stock</span>
                </td>
                <td className="px-md py-md text-body-sm text-on-surface-variant">Jan 12, 2024</td>
                <td className="px-md py-md text-right">
                  <div className="flex items-center justify-end space-x-xs">
                    <button className="p-xs text-primary hover:bg-primary-fixed rounded-lg"><span className="material-symbols-outlined" data-icon="edit">edit</span></button>
                    <button className="p-xs text-error hover:bg-error-container rounded-lg"><span className="material-symbols-outlined" data-icon="delete">delete</span></button>
                    <button className="p-xs text-on-surface-variant hover:bg-surface-variant rounded-lg"><span className="material-symbols-outlined" data-icon="more_vert">more_vert</span></button>
                  </div>
                </td>
              </tr>
              {/* Row 5 */}
              <tr className="hover:bg-surface-container-low transition-colors">
                <td className="px-md py-md text-body-sm text-on-surface-variant">#MD-1022</td>
                <td className="px-md py-md">
                  <div className="flex items-center gap-sm">
                    <div className="w-10 h-10 rounded-lg bg-secondary-fixed-dim flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined" data-icon="thermometer">thermometer</span>
                    </div>
                    <div>
                      <div className="text-body-md font-bold">Paracetamol 500mg</div>
                      <div className="text-body-sm text-on-surface-variant">Analgesics</div>
                    </div>
                  </div>
                </td>
                <td className="px-md py-md text-body-sm">Box (200 tabs)</td>
                <td className="px-md py-md text-body-sm font-bold">$8.00</td>
                <td className="px-md py-md">
                  <span className="px-sm py-1 rounded-full text-label-caps font-label-caps bg-secondary-fixed text-on-secondary-fixed-variant">In Stock</span>
                </td>
                <td className="px-md py-md text-body-sm text-on-surface-variant">Feb 02, 2024</td>
                <td className="px-md py-md text-right">
                  <div className="flex items-center justify-end space-x-xs">
                    <button className="p-xs text-primary hover:bg-primary-fixed rounded-lg"><span className="material-symbols-outlined" data-icon="edit">edit</span></button>
                    <button className="p-xs text-error hover:bg-error-container rounded-lg"><span className="material-symbols-outlined" data-icon="delete">delete</span></button>
                    <button className="p-xs text-on-surface-variant hover:bg-surface-variant rounded-lg"><span className="material-symbols-outlined" data-icon="more_vert">more_vert</span></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-md bg-surface-container-low border-t border-outline-variant flex items-center justify-between">
          <button className="flex items-center gap-xs text-body-sm font-bold text-primary hover:underline">
            <span className="material-symbols-outlined" data-icon="download">download</span>
            Export Inventory Report
          </button>
          <div className="flex items-center gap-sm">
            <span className="text-body-sm text-on-surface-variant">Page 1 of 129</span>
            <div className="flex items-center space-x-xs">
              <button className="px-md py-xs bg-white border border-outline rounded-lg text-body-sm hover:bg-surface-container transition-colors">Previous</button>
              <button className="px-md py-xs bg-primary text-on-primary rounded-lg text-body-sm font-bold shadow-sm">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Contextual Card: Inventory Health */}
      <div className="mt-lg grid grid-cols-1 md:grid-cols-2 gap-gutter">
        <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm flex items-start gap-md">
          <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-primary-container text-[32px]" data-icon="trending_up">trending_up</span>
          </div>
          <div>
            <h3 className="text-h3 font-h3 mb-sm">Inventory Growth</h3>
            <p className="text-body-md text-on-surface-variant">Your pharmaceutical stock has increased by 12% compared to the previous quarter. This alignment with seasonal health trends ensures higher patient fulfillment rates.</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm flex items-start gap-md relative overflow-hidden">
          <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-error-container text-[32px]" data-icon="priority_high">priority_high</span>
          </div>
          <div className="z-10">
            <h3 className="text-h3 font-h3 mb-sm">Low Stock Alerts</h3>
            <p className="text-body-md text-on-surface-variant">42 items are currently below the critical reorder point. Immediate procurement is recommended for diabetic supplies and chronic care medications.</p>
            <button className="mt-md text-primary font-bold flex items-center gap-xs hover:underline">
              View Reorder List
              <span className="material-symbols-outlined" data-icon="arrow_forward">arrow_forward</span>
            </button>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-5">
            <span className="material-symbols-outlined text-[160px]" data-icon="inventory">inventory</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicineManagementPage;
