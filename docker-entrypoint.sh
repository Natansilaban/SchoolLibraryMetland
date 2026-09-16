#!/bin/sh
set -e

# Ensure uploads directory exists and is owned by nextjs (UID 1001)
# This prevents EACCES permission issues when host volumes are mounted by Docker/CasaOS/ZimaOS
mkdir -p /app/public/uploads
chown -R nextjs:nodejs /app/public/uploads 2>/dev/null || true
chmod -R 775 /app/public/uploads 2>/dev/null || true

# Drop root privileges and execute command as unprivileged nextjs user
exec su-exec nextjs "$@"
