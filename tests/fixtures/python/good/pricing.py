"""Code that passes the blueprint ruff and mypy configs."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Price:
    amount_cents: int
    currency: str


def total(prices: list[Price]) -> int:
    return sum(price.amount_cents for price in prices)
