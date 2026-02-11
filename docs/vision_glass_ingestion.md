# Vision Glass Ingestion (v1)

This project includes a CSV-first ingestion script for producing structured JSON for the Mission Control dashboard.

## Run

- Default (mock sources):
  - `python vision_glass_ingestion.py --config data/vision_glass_config.json`
- Use CSV sources:
  1) Set in `data/vision_glass_config.json`:
     - `schedule.calendar_source = "csv_file"`
     - `accounting.source = "csv"`
     - `inventory.source = "csv"`
  2) Point paths to your real files.
  3) Run:
     - `python vision_glass_ingestion.py --config data/vision_glass_config.json`

Outputs:
- Structured (raw inputs): `output.structured_data_path`
- Dashboard (derived metrics): `output.dashboard_data_path`

## CSV Schemas

### Accounting export (`accounting_export.csv`)

Required columns:
- `invoice_id`
- `job_id`
- `date_issued` (parseable date)
- `amount` (number)
- `status` (`paid`, `pending`, `overdue`, `open`)
- `customer`

Optional columns:
- `due_date` (parseable date). If missing, script uses `date_issued + terms_days`.
- `terms_days` (int). Defaults to `accounting.default_terms_days`.
- `date_paid` (parseable date)

Example: `data/examples/accounting_export.example.csv`

### Schedule (`schedule.csv`)

Required columns:
- `job_id`
- `date` (parseable date)
- `crew`
- `location`
- `job_type`
- `estimated_hours` (number)
- `status`

Optional:
- `crew_size` (int)

Example: `data/examples/schedule.example.csv`

### Inventory (`inventory.csv`)

Required columns:
- `item_id`
- `description`
- `unit`
- `current_stock` (number)
- `reorder_point` (number)

Example: `data/examples/inventory.example.csv`

