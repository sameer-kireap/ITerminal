from abc import ABC, abstractmethod
from typing import Any

from app.models.domain import InvestmentEvent


class BaseConnector(ABC):
    def __init__(self, source_name: str, rate_limit_per_min: int = 60) -> None:
        self.source_name = source_name
        self.rate_limit = rate_limit_per_min

    @abstractmethod
    async def poll(self) -> list[dict[str, Any]]:
        """Fetch raw items from source without blocking."""

    @abstractmethod
    def normalize(self, raw_item: dict[str, Any]) -> InvestmentEvent:
        """Map a raw external dictionary payload to a canonical InvestmentEvent."""
