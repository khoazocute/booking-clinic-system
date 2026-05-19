import { apiClient } from "./apiClient";

export function getMedicines() {
  return apiClient("/medicines");
}

export function createMedicine(data) {
  return apiClient("/medicines", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateMedicine(id, data) {
  return apiClient(`/medicines/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function updateMedicineStatus(id, status) {
  return apiClient(`/medicines/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
