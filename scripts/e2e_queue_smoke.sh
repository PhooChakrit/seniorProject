#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
VARIETY="${VARIETY:-kdml105}"
START_POS="${START_POS:-1}"
END_POS="${END_POS:-5000}"
PAM="${PAM:-NGG}"
SPACER_LENGTH="${SPACER_LENGTH:-20}"
MISMATCHES="${MISMATCHES:-3}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-240}"
POLL_INTERVAL_SECONDS="${POLL_INTERVAL_SECONDS:-2}"

EMAIL="e2e_$(date +%s)@test.local"
PASSWORD="test1234"

register_json=$(curl -sS -X POST "$BASE_URL/api/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"E2E Smoke\"}")

token=$(printf '%s' "$register_json" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("token",""))')
if [[ -z "$token" ]]; then
  echo "E2E FAILED: register/login token not found"
  echo "$register_json"
  exit 1
fi

submit_json=$(curl -sS -X POST "$BASE_URL/api/analysis/submit" \
  -H "Authorization: Bearer $token" \
  -H 'Content-Type: application/json' \
  -d "{\"variety\":\"$VARIETY\",\"startPos\":$START_POS,\"endPos\":$END_POS,\"options\":{\"pam\":\"$PAM\",\"spacerLength\":$SPACER_LENGTH,\"mismatches\":$MISMATCHES}}")

job_id=$(printf '%s' "$submit_json" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("jobId",""))')
if [[ -z "$job_id" ]]; then
  echo "E2E FAILED: submit did not return jobId"
  echo "$submit_json"
  exit 1
fi

echo "E2E JOB_ID=$job_id"

max_polls=$(( TIMEOUT_SECONDS / POLL_INTERVAL_SECONDS ))
status=""
for i in $(seq 1 "$max_polls"); do
  status_json=$(curl -sS -H "Authorization: Bearer $token" "$BASE_URL/api/analysis/status/$job_id")
  status=$(printf '%s' "$status_json" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("status",""))')
  echo "poll#$i status=$status"
  if [[ "$status" == "completed" || "$status" == "failed" ]]; then
    break
  fi
  sleep "$POLL_INTERVAL_SECONDS"
done

if [[ "$status" != "completed" ]]; then
  echo "E2E FAILED: final status=$status"
  exit 1
fi

results_json=$(curl -sS -H "Authorization: Bearer $token" "$BASE_URL/api/analysis/results-data/$job_id")

python3 - <<'PY' "$results_json"
import json
import sys
obj = json.loads(sys.argv[1])
rows = obj.get('results', [])
print('E2E COMPLETED: totalResults=', obj.get('totalResults'))
if rows:
    sample = rows[0]
    keep = {k: sample.get(k) for k in ['seqId','start','end','strand','location','spacerClass']}
    print('sample=', keep)
    locations = {}
    for row in rows:
        loc = row.get('location', '')
        locations[loc] = locations.get(loc, 0) + 1
    top = sorted(locations.items(), key=lambda x: x[1], reverse=True)[:5]
    print('top_locations=', top)
PY
