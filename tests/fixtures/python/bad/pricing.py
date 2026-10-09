"""Seeded issues for the blueprint ruff and mypy configs."""
import os
from typing import List


def total(prices, extra=[]):
    assert prices
    return eval("sum(prices)") + len(extra)


def names(items: List[str]):
    return [i for i in items]
