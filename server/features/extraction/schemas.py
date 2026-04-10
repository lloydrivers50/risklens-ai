"""Pydantic models for insurance document extraction output."""

from pydantic import BaseModel


class ExtractionResult(BaseModel):
    insured_name: str | None = None
    policy_number: str | None = None
    effective_date: str | None = None
    expiry_date: str | None = None
    insurer_name: str | None = None
    coverage_type: str | None = None
    total_insured_value: float | None = None
    deductible: float | None = None
    premium: float | None = None
    perils_covered: list[str] = []
    exclusions: list[str] = []
    special_conditions: list[str] = []
