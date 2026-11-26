"""Loading specialties from a JSON fixture (eval / tests). At runtime they come from the
backend's public API, see ``app.backend_client``."""

import json
from pathlib import Path

from app.retrieval.base import Specialty


def load_specialties_from_file(path: Path) -> list[Specialty]:
    return [Specialty(int(s["id"]), s["name"], s.get("description") or "")
            for s in json.loads(path.read_text("utf-8"))]
