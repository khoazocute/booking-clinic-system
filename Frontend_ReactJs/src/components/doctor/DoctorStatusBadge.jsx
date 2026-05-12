import { getStatusLabel } from "../../utils/doctorHelpers";

export function DoctorStatusBadge({ status }) {
  return (
    <span className={`doctor-badge doctor-badge--${String(status).toLowerCase()}`}>
      {getStatusLabel(status)}
    </span>
  );
}
