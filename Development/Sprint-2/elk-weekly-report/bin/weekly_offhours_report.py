import os
import csv
import requests
from datetime import datetime, timezone

ES_URL = os.environ["ES_URL"].rstrip("/")
ES_USER = os.environ["ES_USER"]
ES_PASS = os.environ["ES_PASS"]

RULE_NAME = os.environ.get("RULE_NAME", "Off-Hours Logon Detection")
OUT_DIR = os.environ.get("OUT_DIR", os.path.expanduser("~/projects/elk-weekly-report/output"))

ALERT_INDEX = ".alerts-security.alerts-default"

QUERY = {
    "size": 1000,
    "sort": [{"@timestamp": "asc"}],
    "_source": [
        "@timestamp",
        "kibana.alert.rule.name",
        "user.name",
        "winlog.event_data.TargetUserName",
        "host.name",
        "source.ip",
        "winlog.event_data.IpAddress",
        "event.code",
        "winlog.event_id",
        "winlog.event_data.LogonType",
    ],
    "query": {
        "bool": {
            "filter": [
                {"range": {"@timestamp": {"gte": "now-7d"}}},
                {"term": {"kibana.alert.rule.name.keyword": RULE_NAME}},
            ]
        }
    },
}

def first_value(src, *paths):
    for p in paths:
        cur = src
        ok = True
        for part in p.split("."):
            if isinstance(cur, dict) and part in cur:
                cur = cur[part]
            else:
                ok = False
                break
        if ok and cur not in (None, "", "-"):
            return cur
    return ""

def main():
    url = f"{ES_URL}/{ALERT_INDEX}/_search"
    r = requests.post(url, auth=(ES_USER, ES_PASS), json=QUERY, timeout=60)
    r.raise_for_status()
    hits = r.json().get("hits", {}).get("hits", [])

    os.makedirs(OUT_DIR, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    out_path = os.path.join(OUT_DIR, f"offhours_alerts_{ts}.csv")

    with open(out_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["timestamp", "rule", "user", "host", "source_ip", "event_id", "logon_type"])
        for h in hits:
            src = h.get("_source", {})
            w.writerow([
                src.get("@timestamp", ""),
                first_value(src, "kibana.alert.rule.name"),
                first_value(src, "user.name", "winlog.event_data.TargetUserName"),
                first_value(src, "host.name"),
                first_value(src, "source.ip", "winlog.event_data.IpAddress"),
                first_value(src, "event.code", "winlog.event_id"),
                first_value(src, "winlog.event_data.LogonType"),
            ])

    print(f"Wrote: {out_path}")
    print(f"Rows: {len(hits)}")

if __name__ == "__main__":
    main()
