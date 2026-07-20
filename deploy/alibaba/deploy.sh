#!/usr/bin/env bash
# Deploys the demo portals (demo/portals) to Alibaba Cloud OSS static website
# hosting. Requires ossutil (https://www.alibabacloud.com/help/oss/ossutil) and
# credentials via `ossutil config` or environment variables — never hard-coded.
#
#   OSS_BUCKET   bucket name, e.g. inquiso-demo        (required)
#   OSS_REGION   region id, e.g. eu-central-1          (default: eu-central-1)
#
# Usage: ./deploy/alibaba/deploy.sh
set -euo pipefail

BUCKET="${OSS_BUCKET:?set OSS_BUCKET to your bucket name}"
REGION="${OSS_REGION:-eu-central-1}"
ENDPOINT="oss-${REGION}.aliyuncs.com"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "→ ensuring bucket exists (${BUCKET} @ ${REGION})"
ossutil mb "oss://${BUCKET}" -e "${ENDPOINT}" --acl public-read 2>/dev/null || true

echo "→ enabling static website hosting"
ossutil website --method put "oss://${BUCKET}" "${ROOT}/deploy/alibaba/website.xml" -e "${ENDPOINT}"

echo "→ writing health check"
date -u +"{\"status\":\"ok\",\"deployedAt\":\"%Y-%m-%dT%H:%M:%SZ\"}" > /tmp/inquiso-health.json
ossutil cp /tmp/inquiso-health.json "oss://${BUCKET}/health.json" -e "${ENDPOINT}" -f

echo "→ syncing demo/portals"
ossutil sync "${ROOT}/demo/portals/" "oss://${BUCKET}/" -e "${ENDPOINT}" --delete -f

echo "✓ deployed:"
echo "  portal hub:  https://${BUCKET}.${ENDPOINT/oss-/oss-website-}/"
echo "  health:      https://${BUCKET}.${ENDPOINT/oss-/oss-website-}/health.json"
