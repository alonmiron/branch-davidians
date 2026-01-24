#!/bin/bash
set -e

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="netdroppings@gmail.com"
SMTP_PASS="${SMTP_PASS:-}"
SMTP_FROM="netdroppings@gmail.com"
SMTP_USE_TLS="true"

if [ "$EUID" -eq 0 ]; then
    SUDO_CMD=""
else
    SUDO_CMD="sudo"
fi

if [ -z "$SMTP_PASS" ]; then
    read -r -s -p "Enter SMTP_PASS for ${SMTP_USER}: " SMTP_PASS
    echo ""
fi

export SMTP_HOST SMTP_PORT SMTP_USER SMTP_PASS SMTP_FROM SMTP_USE_TLS

ENV_DIR="/etc/systemd/system/billing-api.service.d"
ENV_FILE="$ENV_DIR/smtp.conf"

$SUDO_CMD mkdir -p "$ENV_DIR"
$SUDO_CMD tee "$ENV_FILE" >/dev/null <<EOF
[Service]
Environment="SMTP_HOST=${SMTP_HOST}"
Environment="SMTP_PORT=${SMTP_PORT}"
Environment="SMTP_USER=${SMTP_USER}"
Environment="SMTP_PASS=${SMTP_PASS}"
Environment="SMTP_FROM=${SMTP_FROM}"
Environment="SMTP_USE_TLS=${SMTP_USE_TLS}"
EOF

$SUDO_CMD systemctl daemon-reload
echo "SMTP environment configured in ${ENV_FILE}"
