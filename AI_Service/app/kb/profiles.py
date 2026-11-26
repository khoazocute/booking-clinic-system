"""Specialty retrieval profiles (document expansion), see knowledge/specialty_profiles.md."""

import re
from functools import lru_cache
from pathlib import Path

from app.text import normalize

PROFILES_FILE = Path(__file__).resolve().parents[2] / "knowledge" / "specialty_profiles.md"

# normalized specialty name -> phrase groups (one per "- " line)
Profiles = dict[str, list[str]]


@lru_cache
def load_specialty_profiles(path: Path = PROFILES_FILE) -> Profiles:
    text = re.sub(r"<!--.*?-->", "", path.read_text("utf-8"), flags=re.S)
    profiles: Profiles = {}
    for section in re.split(r"^## ", text, flags=re.M)[1:]:
        name, _, body = section.partition("\n")
        lines = [line[2:].strip() for line in body.splitlines() if line.startswith("- ") and line[2:].strip()]
        profiles[normalize(name)] = lines
    return profiles


def profile_for(name: str, profiles: Profiles | None) -> list[str]:
    return (profiles or {}).get(normalize(name), [])
