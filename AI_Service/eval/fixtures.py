"""Offline stand-in for the Spring backend (tests and the chat eval)."""

import json
from datetime import date, timedelta

from app.knowledge import load_specialties_from_file
from app.retrieval.base import Specialty
from eval.metrics import DATA_DIR


class FixtureBackend:
    """Doctors from backend_fixture.json; schedules generated relative to ``today``:
    days -1 (past), +1, +2, +3 at 08:00 / 09:00 / 14:00. Slot n=2 of day +1 is BOOKED."""

    def __init__(self, today: date | None = None):
        self.today = today or date.today()
        self._doctors = json.loads((DATA_DIR / "backend_fixture.json").read_text("utf-8"))["doctors"]
        self._specialties = load_specialties_from_file(DATA_DIR / "specialties.json")

    def list_specialties(self) -> list[Specialty]:
        return list(self._specialties)

    def list_doctors(self, specialty_id=None, keyword=None):
        return [d for d in self._doctors
                if (specialty_id is None or d["specialtyId"] == specialty_id)
                and (not keyword or keyword.lower() in d["fullName"].lower())]

    def list_schedules(self, doctor_id, work_date=None):
        slots = []
        for offset in (-1, 1, 2, 3):
            day = self.today + timedelta(days=offset)
            for n, (start, end) in enumerate([("08:00:00", "08:30:00"), ("09:00:00", "09:30:00"),
                                              ("14:00:00", "14:30:00")], start=1):
                status = "BOOKED" if (offset == 1 and n == 2) else "AVAILABLE"
                slots.append({"id": doctor_id * 1000 + (offset + 1) * 10 + n, "doctorId": doctor_id,
                              "workDate": day.isoformat(), "startTime": start, "endTime": end, "status": status})
        return [s for s in slots if work_date is None or s["workDate"] == work_date]
