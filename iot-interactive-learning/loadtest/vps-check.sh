#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Run this ON the VPS while a load test hammers the server (from your laptop or
# from a second SSH pane on the box). It samples the things you can only see from
# inside the machine: Node's CPU/RAM, open file descriptors (= held SSE sockets),
# established TCP connections, and the app's own /health — once a second.
#
# รันบน VPS ตอนกำลังยิงโหลด เพื่อดูของที่มองจากข้างนอกไม่เห็น: CPU/RAM ของ Node,
# จำนวน fd ที่เปิด (= socket SSE ที่ค้าง), จำนวน TCP ที่ต่ออยู่, และ /health.
#
# Linux only (uses /proc and ss). Usage:
#   ./loadtest/vps-check.sh [local-url] [interval-seconds]
#   ./loadtest/vps-check.sh http://127.0.0.1:3000 1
# ---------------------------------------------------------------------------
set -u

URL="${1:-http://127.0.0.1:3000}"
INTERVAL="${2:-1}"
PORT="$(printf '%s' "$URL" | sed -E 's#.*:([0-9]+).*#\1#')"; [ "$PORT" = "$URL" ] && PORT=80

find_pid() { pgrep -f 'node .*app\.js' | head -1; }
PID="$(find_pid || true)"

echo "── VPS check ─────────────────────────────────────────────────────────"
echo "  target   $URL   (port $PORT)"
echo "  node pid ${PID:-not found}"
echo "  cores    $(nproc 2>/dev/null || echo '?')    ulimit -n (this shell) $(ulimit -n)"
[ -n "${PID:-}" ] && echo "  node LimitNOFILE $(cat /proc/$PID/limits 2>/dev/null | awk '/Max open files/{print $4"/"$5}')"
echo "  (Node is single-threaded: ~100% CPU on one core = you have hit the ceiling.)"
echo "──────────────────────────────────────────────────────────────────────"
printf "%-8s %6s %8s %7s %7s %8s %8s %7s\n" time cpu% rss_mb openfd estab uptime streams students

while true; do
  now="$(date +%H:%M:%S)"
  if [ -z "${PID:-}" ] || [ ! -d "/proc/${PID}" ]; then PID="$(find_pid || true)"; fi

  if [ -n "${PID:-}" ] && [ -d "/proc/${PID}" ]; then
    set -- $(ps -o %cpu=,rss= -p "$PID" 2>/dev/null); cpu="${1:--}"; rss="${2:-0}"
    rssmb=$(( rss / 1024 ))
    openfd="$(ls "/proc/${PID}/fd" 2>/dev/null | wc -l | tr -d ' ')"
  else
    cpu="-"; rssmb="-"; openfd="-"
  fi

  estab="$(ss -Htan "( sport = :${PORT} )" state established 2>/dev/null | wc -l | tr -d ' ')"
  [ -z "$estab" ] && estab="?"

  h="$(curl -s --max-time 2 "${URL}/api/room/health" 2>/dev/null || true)"
  get() { printf '%s' "$h" | grep -o "\"$1\":[0-9]*" | grep -o '[0-9]*'; }
  up="$(get uptimeSeconds)"; st="$(get streams)"; sd="$(get students)"

  printf "%-8s %6s %8s %7s %7s %8s %8s %7s\n" \
    "$now" "$cpu" "$rssmb" "$openfd" "$estab" "${up:-DOWN}" "${st:-?}" "${sd:-?}"
  sleep "$INTERVAL"
done
