import { createContext, useContext } from "react";
import { useAdminNotifications } from "../hooks/useAdminNotifications";

const AdminNotificationContext = createContext(null);

export function AdminNotificationProvider({ children }) {
  const state = useAdminNotifications();
  return (
    <AdminNotificationContext.Provider value={state}>
      {children}
    </AdminNotificationContext.Provider>
  );
}

export function useAdminNotificationContext() {
  return useContext(AdminNotificationContext);
}
