"""Read-only client for the Spring backend's PUBLIC endpoints.

The AI service never sees a patient's JWT and never calls a write endpoint: live data
(doctors, free slots) is public, and booking is executed by the backend only after the
patient confirms in the UI.
"""

from typing import Protocol

import httpx

from app.retrieval.base import Specialty


class BackendClient(Protocol):
    def list_specialties(self) -> list[Specialty]: ...

    def list_doctors(self, specialty_id: int | None = None, keyword: str | None = None) -> list[dict]: ...

    def list_schedules(self, doctor_id: int, work_date: str | None = None) -> list[dict]: ...


class HttpBackendClient:
    def __init__(self, base_url: str, timeout: float = 5.0):
        self._http = httpx.Client(base_url=base_url.rstrip("/"), timeout=timeout)

    def _get(self, path: str, params: dict | None = None):
        response = self._http.get(path, params={k: v for k, v in (params or {}).items() if v is not None})
        response.raise_for_status()
        return response.json()["data"]

    def list_specialties(self) -> list[Specialty]:
        return [Specialty(int(s["id"]), s["name"], s.get("description") or "")
                for s in self._get("/api/v1/specialties")]

    def list_doctors(self, specialty_id=None, keyword=None):
        return self._get("/api/v1/doctors", {"specialtyId": specialty_id, "keyword": keyword})

    def list_schedules(self, doctor_id, work_date=None):
        return self._get(f"/api/v1/doctors/{doctor_id}/schedules", {"workDate": work_date})
