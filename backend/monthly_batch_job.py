"""
Monthly batch job: generate this month's charge CSV, archive it, and email it.

Run on the 1st of each month via cron or systemd timer:

    0 6 1 * * /var/www/billing/backend/venv/bin/python \
        /var/www/billing/backend/monthly_batch_job.py >> /var/log/billing-monthly.log 2>&1

Or with systemd – see DEPLOYMENT.md for full instructions.
"""

import sys
import logging
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger(__name__)

import requests  # calls our own API so we don't duplicate business logic


def main():
    today = date.today()
    year = today.year
    month = today.month

    log.info(f"Monthly batch job starting for {year}-{month:02d}")

    # The API must be running; adjust host/port if needed
    api_base = "http://localhost:8000/api"

    try:
        resp = requests.post(
            f"{api_base}/cc/payments/generate-batch-and-email",
            json={"year": year, "month": month, "include_debt": True},
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        log.info(
            f"Batch generated: archive_id={data.get('archive_id')}, "
            f"residents={data.get('residents_count')}, "
            f"email={data.get('email_status')}"
        )
    except Exception as exc:
        log.error(f"Batch job failed: {exc}")
        sys.exit(1)

    log.info("Monthly batch job finished successfully.")


if __name__ == "__main__":
    main()
