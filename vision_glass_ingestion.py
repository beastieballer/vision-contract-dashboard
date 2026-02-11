"""
Vision Glass - Mission Control Data Ingestion
============================================
Ingests emails, schedules, invoices, inventory, and accounting data for the
Mission Control dashboard.

This v1 focuses on clean, reliable local ingestion (CSV) with optional API
connectors (Gmail / Google Calendar) that activate only when credentials and
dependencies are present.

Quick start (CSV-first):
1) Create CSVs matching the templates in `data/examples/`
2) Run: `python vision_glass_ingestion.py --config data/vision_glass_config.json`
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import os
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Dict, Iterable, List, Literal, Optional, Tuple


LOGGER = logging.getLogger("vision_glass_ingestion")


# ============================================================================
# CONFIG
# ============================================================================


EmailProvider = Literal["mock", "gmail", "outlook", "none"]
ScheduleSource = Literal["mock", "google_calendar", "outlook", "ical_file", "csv_file", "none"]
AccountingSource = Literal["mock", "quickbooks", "xero", "csv", "none"]
InventorySource = Literal["mock", "csv", "api", "manual", "none"]


@dataclass(frozen=True)
class OutputConfig:
    structured_data_path: str
    dashboard_data_path: str


@dataclass(frozen=True)
class EmailConfig:
    provider: EmailProvider
    api_credentials_path: str
    search_keywords: List[str]
    days_back_default: int = 30


@dataclass(frozen=True)
class ScheduleConfig:
    calendar_source: ScheduleSource
    calendar_id: str
    csv_path: str = "./data/schedule.csv"
    days_ahead_default: int = 14
    hours_per_day: float = 8.0
    workdays: Tuple[int, ...] = (0, 1, 2, 3, 4)  # Mon..Fri (datetime.weekday)


@dataclass(frozen=True)
class AccountingConfig:
    source: AccountingSource
    export_path: str
    default_terms_days: int = 30
    currency: str = "USD"


@dataclass(frozen=True)
class InventoryConfig:
    source: InventorySource
    file_path: str


@dataclass(frozen=True)
class AppConfig:
    email: EmailConfig
    schedule: ScheduleConfig
    accounting: AccountingConfig
    inventory: InventoryConfig
    output: OutputConfig


def _load_json(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_config(path: Path) -> AppConfig:
    raw = _load_json(path)

    email = raw.get("email", {})
    schedule = raw.get("schedule", {})
    accounting = raw.get("accounting", {})
    inventory = raw.get("inventory", {})
    output = raw.get("output", {})

    return AppConfig(
        email=EmailConfig(
            provider=email.get("provider", "mock"),
            api_credentials_path=email.get("api_credentials_path", "./credentials/gmail_credentials.json"),
            search_keywords=list(email.get("search_keywords", ["quote", "estimate", "invoice", "schedule", "material", "order"])),
            days_back_default=int(email.get("days_back_default", 30)),
        ),
        schedule=ScheduleConfig(
            calendar_source=schedule.get("calendar_source", "mock"),
            calendar_id=schedule.get("calendar_id", "primary"),
            csv_path=schedule.get("csv_path", "./data/schedule.csv"),
            days_ahead_default=int(schedule.get("days_ahead_default", 14)),
            hours_per_day=float(schedule.get("hours_per_day", 8.0)),
            workdays=tuple(schedule.get("workdays", [0, 1, 2, 3, 4])),
        ),
        accounting=AccountingConfig(
            source=accounting.get("source", "mock"),
            export_path=accounting.get("export_path", "./data/accounting_export.csv"),
            default_terms_days=int(accounting.get("default_terms_days", 30)),
            currency=accounting.get("currency", "USD"),
        ),
        inventory=InventoryConfig(
            source=inventory.get("source", "mock"),
            file_path=inventory.get("file_path", "./data/inventory.csv"),
        ),
        output=OutputConfig(
            structured_data_path=output.get("structured_data_path", "./output/vision_glass_data.json"),
            dashboard_data_path=output.get("dashboard_data_path", "./output/dashboard_data.json"),
        ),
    )


# ============================================================================
# HELPERS
# ============================================================================


def ensure_parent_dir(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def parse_date(value: Any, *, field_name: str) -> Optional[date]:
    if value is None:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()

    s = str(value).strip()
    if not s or s.lower() in {"nan", "none", "null"}:
        return None

    # Prefer python-dateutil if present; otherwise try a small set of formats.
    try:
        from dateutil import parser as date_parser  # type: ignore

        return date_parser.parse(s, fuzzy=True).date()
    except Exception as exc:
        pass

    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%m/%d/%y", "%Y/%m/%d"):
        try:
            return datetime.strptime(s, fmt).date()
        except Exception:
            continue

    raise ValueError(f"Invalid date for {field_name}: {value!r}") from exc


def parse_float(value: Any, *, field_name: str) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    s = str(value).strip()
    if not s or s.lower() in {"nan", "none", "null"}:
        return None
    try:
        return float(s.replace(",", ""))
    except Exception as exc:
        raise ValueError(f"Invalid float for {field_name}: {value!r}") from exc


def parse_int(value: Any, *, field_name: str) -> Optional[int]:
    if value is None:
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        return int(value)
    s = str(value).strip()
    if not s or s.lower() in {"nan", "none", "null"}:
        return None
    try:
        return int(float(s))
    except Exception as exc:
        raise ValueError(f"Invalid int for {field_name}: {value!r}") from exc


def read_csv_rows(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(f"CSV not found: {path}")
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None:
            raise ValueError(f"CSV has no header row: {path}")
        return list(reader)


def today_local() -> date:
    return datetime.now().date()


def bucket_ar(days_past_due: int) -> str:
    if days_past_due <= 0:
        return "current"
    if days_past_due <= 30:
        return "1_30"
    if days_past_due <= 60:
        return "31_60"
    if days_past_due <= 90:
        return "61_90"
    return "90_plus"


def within_window(d: date, *, start: date, end: date) -> bool:
    return start <= d <= end


def iter_workdays(start: date, end: date, *, workdays: Tuple[int, ...]) -> Iterable[date]:
    cur = start
    while cur <= end:
        if cur.weekday() in workdays:
            yield cur
        cur += timedelta(days=1)


# ============================================================================
# EMAIL INGESTION
# ============================================================================


class EmailIngestion:
    def __init__(self, config: EmailConfig):
        self.config = config
        self.emails: List[Dict[str, Any]] = []

    def fetch_emails(self, *, days_back: int) -> List[Dict[str, Any]]:
        provider = self.config.provider
        if provider == "none":
            self.emails = []
            return self.emails
        if provider == "mock":
            self.emails = self._mock_emails()
            return self.emails
        if provider == "gmail":
            self.emails = self._fetch_gmail(days_back=days_back)
            return self.emails
        if provider == "outlook":
            LOGGER.warning("Outlook connector not implemented in v1; returning empty emails.")
            self.emails = []
            return self.emails

        raise ValueError(f"Unsupported email provider: {provider}")

    def _fetch_gmail(self, *, days_back: int) -> List[Dict[str, Any]]:
        creds_path = Path(self.config.api_credentials_path)
        if not creds_path.exists():
            LOGGER.warning("Gmail credentials not found at %s; returning empty emails.", creds_path)
            return []

        try:
            from google.oauth2.credentials import Credentials  # type: ignore
            from googleapiclient.discovery import build  # type: ignore
        except Exception:
            LOGGER.warning("Gmail dependencies not installed; returning empty emails.")
            return []

        LOGGER.warning("Gmail connector stub: credentials exist but OAuth flow/token storage is not set up in v1.")
        _ = Credentials  # silence unused import warnings in some linters
        _ = build
        return []

    def categorize_email(self, email: Dict[str, Any]) -> str:
        subject = str(email.get("subject", "")).lower()
        body = str(email.get("body", "")).lower()
        text = f"{subject}\n{body}"

        if "quote" in text or "estimate" in text:
            return "quote_request"
        if "invoice" in text:
            return "invoice"
        if "schedule" in text or "reschedule" in text:
            return "schedule_change"
        if "order" in text and "confirm" in text:
            return "supplier_confirmation"
        return "general"

    def extract_structured_data(self) -> List[Dict[str, Any]]:
        structured: List[Dict[str, Any]] = []
        for email in self.emails:
            category = self.categorize_email(email)
            structured.append(
                {
                    "id": email.get("id"),
                    "date": email.get("date"),
                    "from": email.get("from"),
                    "subject": email.get("subject"),
                    "category": category,
                    "priority": email.get("priority", "low"),
                    "summary": email.get("subject"),
                    "action_required": self._determine_action(category),
                }
            )
        return structured

    def _determine_action(self, category: str) -> str:
        actions = {
            "quote_request": "Generate quote and send proposal",
            "schedule_change": "Update crew schedule",
            "supplier_confirmation": "Update inventory forecast",
            "invoice": "Record payment / update AR",
        }
        return actions.get(category, "Review and respond")

    def _mock_emails(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": "email_001",
                "date": "2026-01-30",
                "from": "customer@example.com",
                "subject": "Quote Request - Storefront Glass",
                "body": "Need a quote for 8ft x 10ft storefront glass installation",
                "priority": "high",
            },
            {
                "id": "email_002",
                "date": "2026-01-29",
                "from": "supplier@glassco.com",
                "subject": "Order Confirmation - 1/4 Tempered Glass",
                "body": "Your order #12345 has been confirmed. Delivery: Feb 2",
                "priority": "medium",
            },
            {
                "id": "email_003",
                "date": "2026-01-28",
                "from": "foreman@vision.com",
                "subject": "Schedule Change - Job #4521",
                "body": "Customer requested to move install from Feb 1 to Feb 3",
                "priority": "high",
            },
        ]


# ============================================================================
# SCHEDULE INGESTION
# ============================================================================


class ScheduleIngestion:
    def __init__(self, config: ScheduleConfig):
        self.config = config
        self.schedule: List[Dict[str, Any]] = []

    def fetch_schedule(self, *, days_ahead: int) -> List[Dict[str, Any]]:
        source = self.config.calendar_source
        if source == "none":
            self.schedule = []
            return self.schedule
        if source == "mock":
            self.schedule = self._mock_schedule()
            return self.schedule
        if source == "csv_file":
            self.schedule = self._fetch_from_csv(days_ahead=days_ahead)
            return self.schedule
        if source in {"google_calendar", "outlook", "ical_file"}:
            LOGGER.warning("%s schedule connector not implemented in v1; returning empty schedule.", source)
            self.schedule = []
            return self.schedule

        raise ValueError(f"Unsupported schedule source: {source}")

    def _fetch_from_csv(self, *, days_ahead: int) -> List[Dict[str, Any]]:
        path = Path(self.config.csv_path)
        rows_in = read_csv_rows(path)
        required = {"job_id", "date", "crew", "location", "job_type", "estimated_hours", "status"}
        missing = required - (set(rows_in[0].keys()) if rows_in else set())
        if missing:
            raise ValueError(f"Schedule CSV missing columns: {sorted(missing)}")

        end = today_local() + timedelta(days=days_ahead)
        rows: List[Dict[str, Any]] = []
        for r in rows_in:
            d = parse_date(r.get("date"), field_name="schedule.date")
            if d is None:
                continue
            if d > end:
                continue
            rows.append(
                {
                    "job_id": str(r.get("job_id", "")),
                    "date": d.isoformat(),
                    "crew": str(r.get("crew", "")),
                    "crew_size": parse_int(r.get("crew_size"), field_name="schedule.crew_size") or None,
                    "location": str(r.get("location", "")),
                    "job_type": str(r.get("job_type", "")),
                    "estimated_hours": parse_float(r.get("estimated_hours"), field_name="schedule.estimated_hours") or 0.0,
                    "status": str(r.get("status", "")),
                }
            )
        return rows

    def detect_conflicts(self) -> List[Dict[str, Any]]:
        conflicts: List[Dict[str, Any]] = []
        jobs_by_day_crew: Dict[Tuple[str, str], List[Dict[str, Any]]] = {}

        for job in self.schedule:
            key = (str(job.get("date", "")), str(job.get("crew", "")))
            jobs_by_day_crew.setdefault(key, []).append(job)

        for (d, crew), jobs in jobs_by_day_crew.items():
            total_hours = sum(float(j.get("estimated_hours") or 0.0) for j in jobs)
            if len(jobs) > 1 and total_hours > self.config.hours_per_day:
                conflicts.append(
                    {
                        "date": d,
                        "crew": crew,
                        "issue": "overbooked",
                        "total_hours": total_hours,
                        "jobs": [j.get("job_id") for j in jobs],
                    }
                )

        return conflicts

    def calculate_crew_utilization(self, *, window_start: date, window_end: date) -> Dict[str, Any]:
        available_days = list(iter_workdays(window_start, window_end, workdays=self.config.workdays))
        available_hours = len(available_days) * float(self.config.hours_per_day)
        if available_hours <= 0:
            available_hours = 0.0

        utilization: Dict[str, Dict[str, Any]] = {}
        for job in self.schedule:
            crew = str(job.get("crew", ""))
            d = parse_date(job.get("date"), field_name="schedule.date") or None
            if d is None or not within_window(d, start=window_start, end=window_end):
                continue
            utilization.setdefault(crew, {"scheduled_hours": 0.0, "available_hours": available_hours})
            utilization[crew]["scheduled_hours"] += float(job.get("estimated_hours") or 0.0)

        for crew, data in utilization.items():
            denom = float(data.get("available_hours") or 0.0)
            data["utilization_rate"] = (float(data["scheduled_hours"]) / denom * 100.0) if denom > 0 else 0.0

        return utilization

    def _mock_schedule(self) -> List[Dict[str, Any]]:
        return [
            {
                "job_id": "JOB-001",
                "date": "2026-02-03",
                "crew": "Crew A",
                "crew_size": 3,
                "location": "123 Main St, Baltimore, MD",
                "job_type": "Storefront Installation",
                "estimated_hours": 6,
                "status": "scheduled",
            },
            {
                "job_id": "JOB-002",
                "date": "2026-02-03",
                "crew": "Crew B",
                "crew_size": 2,
                "location": "456 Oak Ave, Baltimore, MD",
                "job_type": "Residential Window Replacement",
                "estimated_hours": 4,
                "status": "scheduled",
            },
            {
                "job_id": "JOB-003",
                "date": "2026-02-04",
                "crew": "Crew A",
                "crew_size": 3,
                "location": "789 Elm St, Baltimore, MD",
                "job_type": "Glass Repair",
                "estimated_hours": 3,
                "status": "scheduled",
            },
        ]


# ============================================================================
# ACCOUNTING / INVOICES
# ============================================================================


class AccountingIngestion:
    def __init__(self, config: AccountingConfig):
        self.config = config
        self.invoices: List[Dict[str, Any]] = []

    def fetch_invoices(self) -> List[Dict[str, Any]]:
        source = self.config.source
        if source == "none":
            self.invoices = []
            return self.invoices
        if source == "mock":
            self.invoices = self._mock_invoices()
            return self.invoices
        if source == "csv":
            self.invoices = self._fetch_from_csv()
            return self.invoices
        if source in {"quickbooks", "xero"}:
            LOGGER.warning("%s connector not implemented in v1; returning empty invoices.", source)
            self.invoices = []
            return self.invoices
        raise ValueError(f"Unsupported accounting source: {source}")

    def _fetch_from_csv(self) -> List[Dict[str, Any]]:
        path = Path(self.config.export_path)
        rows_in = read_csv_rows(path)

        required = {"invoice_id", "job_id", "date_issued", "amount", "status", "customer"}
        missing = required - (set(rows_in[0].keys()) if rows_in else set())
        if missing:
            raise ValueError(f"Accounting CSV missing columns: {sorted(missing)}")

        rows: List[Dict[str, Any]] = []
        for r in rows_in:
            date_issued = parse_date(r.get("date_issued"), field_name="invoice.date_issued")
            due_date = parse_date(r.get("due_date"), field_name="invoice.due_date")
            date_paid = parse_date(r.get("date_paid"), field_name="invoice.date_paid")
            terms_days = parse_int(r.get("terms_days"), field_name="invoice.terms_days") or self.config.default_terms_days
            if date_issued and due_date is None:
                due_date = date_issued + timedelta(days=int(terms_days))

            amount = parse_float(r.get("amount"), field_name="invoice.amount") or 0.0
            status = str(r.get("status", "")).strip().lower()
            if status not in {"paid", "pending", "overdue", "open"}:
                # keep unknowns but normalize to "open"
                status = "open"

            rows.append(
                {
                    "invoice_id": str(r.get("invoice_id", "")),
                    "job_id": str(r.get("job_id", "")),
                    "date_issued": date_issued.isoformat() if date_issued else None,
                    "due_date": due_date.isoformat() if due_date else None,
                    "amount": float(amount),
                    "status": status,
                    "date_paid": date_paid.isoformat() if date_paid else None,
                    "customer": str(r.get("customer", "")),
                }
            )
        return rows

    def calculate_ar_aging(self, *, as_of: date) -> Dict[str, Any]:
        aging = {
            "as_of": as_of.isoformat(),
            "currency": self.config.currency,
            "buckets": {"current": 0.0, "1_30": 0.0, "31_60": 0.0, "61_90": 0.0, "90_plus": 0.0},
            "total_outstanding": 0.0,
        }

        for inv in self.invoices:
            if str(inv.get("status", "")).lower() == "paid":
                continue

            amount = float(inv.get("amount") or 0.0)
            aging["total_outstanding"] += amount

            due = parse_date(inv.get("due_date"), field_name="invoice.due_date")
            if due is None:
                issued = parse_date(inv.get("date_issued"), field_name="invoice.date_issued")
                if issued is None:
                    bucket = "current"
                else:
                    assumed_due = issued + timedelta(days=self.config.default_terms_days)
                    bucket = bucket_ar((as_of - assumed_due).days)
            else:
                bucket = bucket_ar((as_of - due).days)

            aging["buckets"][bucket] += amount

        return aging

    def _mock_invoices(self) -> List[Dict[str, Any]]:
        return [
            {
                "invoice_id": "INV-4521",
                "job_id": "JOB-001",
                "date_issued": "2026-01-25",
                "due_date": "2026-02-24",
                "amount": 8500.00,
                "status": "paid",
                "date_paid": "2026-01-28",
                "customer": "ABC Corp",
            },
            {
                "invoice_id": "INV-4522",
                "job_id": "JOB-002",
                "date_issued": "2026-01-26",
                "due_date": "2026-02-25",
                "amount": 3200.00,
                "status": "overdue",
                "customer": "John Smith",
            },
            {
                "invoice_id": "INV-4523",
                "job_id": "JOB-003",
                "date_issued": "2026-01-29",
                "due_date": "2026-02-28",
                "amount": 12000.00,
                "status": "pending",
                "customer": "XYZ Building",
            },
        ]


# ============================================================================
# INVENTORY
# ============================================================================


class InventoryIngestion:
    def __init__(self, config: InventoryConfig):
        self.config = config
        self.inventory: List[Dict[str, Any]] = []

    def fetch_inventory(self) -> List[Dict[str, Any]]:
        source = self.config.source
        if source == "none":
            self.inventory = []
            return self.inventory
        if source == "mock":
            self.inventory = self._mock_inventory()
            return self.inventory
        if source == "csv":
            self.inventory = self._fetch_from_csv()
            return self.inventory
        if source in {"api", "manual"}:
            LOGGER.warning("%s inventory connector not implemented in v1; returning empty inventory.", source)
            self.inventory = []
            return self.inventory
        raise ValueError(f"Unsupported inventory source: {source}")

    def _fetch_from_csv(self) -> List[Dict[str, Any]]:
        path = Path(self.config.file_path)
        rows_in = read_csv_rows(path)
        required = {"item_id", "description", "unit", "current_stock", "reorder_point"}
        missing = required - (set(rows_in[0].keys()) if rows_in else set())
        if missing:
            raise ValueError(f"Inventory CSV missing columns: {sorted(missing)}")

        rows: List[Dict[str, Any]] = []
        for r in rows_in:
            current_stock = parse_float(r.get("current_stock"), field_name="inventory.current_stock") or 0.0
            reorder_point = parse_float(r.get("reorder_point"), field_name="inventory.reorder_point") or 0.0
            status = "adequate" if current_stock >= reorder_point else "low"

            rows.append(
                {
                    "item_id": str(r.get("item_id", "")),
                    "description": str(r.get("description", "")),
                    "unit": str(r.get("unit", "")),
                    "current_stock": current_stock,
                    "reorder_point": reorder_point,
                    "status": status,
                }
            )
        return rows

    def check_reorder_alerts(self) -> List[Dict[str, Any]]:
        alerts: List[Dict[str, Any]] = []
        for item in self.inventory:
            if str(item.get("status")) == "low":
                alerts.append(
                    {
                        "item_id": item.get("item_id"),
                        "item": item.get("description"),
                        "current_stock": item.get("current_stock"),
                        "reorder_point": item.get("reorder_point"),
                        "action": "order_immediately",
                    }
                )
        return alerts

    def _mock_inventory(self) -> List[Dict[str, Any]]:
        return [
            {
                "item_id": "GLASS-001",
                "description": '1/4" Clear Tempered',
                "unit": "sheet",
                "current_stock": 12,
                "reorder_point": 10,
                "status": "adequate",
            },
            {
                "item_id": "GLASS-002",
                "description": '1/2" Tempered',
                "unit": "sheet",
                "current_stock": 3,
                "reorder_point": 8,
                "status": "low",
            },
            {
                "item_id": "SEAL-001",
                "description": "Silicone Sealant",
                "unit": "tube",
                "current_stock": 45,
                "reorder_point": 20,
                "status": "adequate",
            },
        ]


# ============================================================================
# PIPELINE
# ============================================================================


class VisionGlassDataPipeline:
    def __init__(self, config: AppConfig):
        self.config = config
        self.email_module = EmailIngestion(config.email)
        self.schedule_module = ScheduleIngestion(config.schedule)
        self.accounting_module = AccountingIngestion(config.accounting)
        self.inventory_module = InventoryIngestion(config.inventory)

    def run_full_ingestion(self, *, days_back: int, days_ahead: int, as_of: Optional[date] = None) -> Dict[str, Any]:
        as_of = as_of or today_local()
        window_start = as_of
        window_end = as_of + timedelta(days=days_ahead)

        emails = self.email_module.fetch_emails(days_back=days_back)
        schedule = self.schedule_module.fetch_schedule(days_ahead=days_ahead)
        invoices = self.accounting_module.fetch_invoices()
        inventory = self.inventory_module.fetch_inventory()

        email_summary = self.email_module.extract_structured_data()
        schedule_conflicts = self.schedule_module.detect_conflicts()
        crew_utilization = self.schedule_module.calculate_crew_utilization(window_start=window_start, window_end=window_end)
        ar_aging = self.accounting_module.calculate_ar_aging(as_of=as_of)
        inventory_alerts = self.inventory_module.check_reorder_alerts()

        structured_data = {
            "timestamp": datetime.now().isoformat(),
            "as_of": as_of.isoformat(),
            "inputs": {
                "days_back": days_back,
                "days_ahead": days_ahead,
                "email_provider": self.config.email.provider,
                "schedule_source": self.config.schedule.calendar_source,
                "accounting_source": self.config.accounting.source,
                "inventory_source": self.config.inventory.source,
            },
            "emails_raw": emails,
            "schedule_raw": schedule,
            "invoices_raw": invoices,
            "inventory_raw": inventory,
        }

        dashboard_data = {
            "timestamp": structured_data["timestamp"],
            "as_of": structured_data["as_of"],
            "summary": {
                "total_emails": len(emails),
                "pending_quotes": len([e for e in email_summary if e.get("category") == "quote_request"]),
                "scheduled_jobs": len(schedule),
                "schedule_conflicts": len(schedule_conflicts),
                "outstanding_ar": float(ar_aging["total_outstanding"]),
                "inventory_alerts": len(inventory_alerts),
            },
            "emails": email_summary,
            "schedule": schedule,
            "schedule_conflicts": schedule_conflicts,
            "crew_utilization": crew_utilization,
            "invoices": invoices,
            "ar_aging": ar_aging,
            "inventory": inventory,
            "inventory_alerts": inventory_alerts,
        }

        # Save outputs
        structured_path = Path(self.config.output.structured_data_path)
        dashboard_path = Path(self.config.output.dashboard_data_path)
        ensure_parent_dir(structured_path)
        ensure_parent_dir(dashboard_path)
        structured_path.write_text(json.dumps(structured_data, indent=2), encoding="utf-8")
        dashboard_path.write_text(json.dumps(dashboard_data, indent=2), encoding="utf-8")

        LOGGER.info("Wrote structured data: %s", structured_path)
        LOGGER.info("Wrote dashboard data: %s", dashboard_path)

        return dashboard_data


# ============================================================================
# CLI
# ============================================================================


def build_arg_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Vision Glass data ingestion (Mission Control).")
    p.add_argument(
        "--config",
        type=str,
        default="data/vision_glass_config.json",
        help="Path to JSON config file.",
    )
    p.add_argument("--days-back", type=int, default=None, help="Days back for email search.")
    p.add_argument("--days-ahead", type=int, default=None, help="Days ahead for schedule window.")
    p.add_argument("--as-of", type=str, default=None, help="Override 'today' date (e.g. 2026-02-11).")
    p.add_argument("--log-level", type=str, default="INFO", help="DEBUG, INFO, WARNING, ERROR")
    return p


def main() -> int:
    args = build_arg_parser().parse_args()
    logging.basicConfig(level=getattr(logging, str(args.log_level).upper(), logging.INFO), format="%(levelname)s %(message)s")

    config_path = Path(args.config)
    config = load_config(config_path)

    days_back = int(args.days_back) if args.days_back is not None else config.email.days_back_default
    days_ahead = int(args.days_ahead) if args.days_ahead is not None else config.schedule.days_ahead_default
    as_of = parse_date(args.as_of, field_name="--as-of") if args.as_of else None

    LOGGER.info("Starting ingestion (as_of=%s, days_back=%s, days_ahead=%s)", (as_of or today_local()).isoformat(), days_back, days_ahead)
    pipeline = VisionGlassDataPipeline(config)
    dashboard = pipeline.run_full_ingestion(days_back=days_back, days_ahead=days_ahead, as_of=as_of)
    LOGGER.info("Summary: %s", dashboard.get("summary", {}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
