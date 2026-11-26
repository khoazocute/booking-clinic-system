from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class Specialty:
    id: int
    name: str
    description: str


@dataclass(frozen=True)
class Ranked:
    specialty: Specialty
    score: float


@dataclass(frozen=True)
class RoutingResult:
    refused: bool
    ranked: list[Ranked]


class SpecialtyRouter(Protocol):
    """Maps a patient message to specialties. Every approach being compared implements this."""

    name: str

    def rank(self, query: str) -> list[Ranked]:
        """All specialties, best first, with raw similarity scores (no refusal applied)."""

    def route(self, query: str) -> RoutingResult:
        """``rank`` plus this router's refusal rule."""
