# ============================================================
#  IDS — Collect → Analyze → Report
#  pip install langchain-openai langchain user-agents requests pymongo
# ============================================================

import re
import time
import json
import socket
import requests
import ipaddress
from datetime import datetime
from urllib.parse import urlparse
from collections import deque
from typing import Literal

from unittest import result
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain.agents import create_agent
from langchain_core.globals import set_debug, set_verbose
from langchain_core.prompts import PromptTemplate
from pymongo import MongoClient

set_debug(False)
set_verbose(True)

# ============================================================
# 1. Settings
# ============================================================

MONGO_URI        = "mongodb://admin:adminpassword@mongo:27017"
DB_NAME          = "ids_db"
HOST             = "0.0.0.0"
PORT             = 514
MAX_CONTEXT      = 100

LLM_BASE_URL = "https://api.groq.com/openai/v1"
client = Groq(api_key="gsk_...")
LLM_MODEL    = "openai/gpt-oss-20b"

# ============================================================
# 2. MongoDB
# ============================================================

_mongo      = MongoClient(MONGO_URI)
_db         = _mongo[DB_NAME]
logs_col    = _db["logs"]
reports_col = _db["reports"]

logs_col.create_index([("received_at", -1)])
logs_col.create_index([("analyzed", 1)])
reports_col.create_index([("source_ip", 1), ("created_at", -1)])

# ============================================================
# 3. Schema
# ============================================================

class ThreatAnalysis(BaseModel):
    risk_score:       int  = Field(ge=1, le=10, description="Risk score 1-10")
    threat_category:  Literal["Bot", "Scanner", "Attacker", "Human", "Suspicious"]
    ai_insights:      str  = Field(description="Detailed behavioral analysis")
    recommendations:  str  = Field(description="Recommended action")
    is_true_positive: bool = Field(description="True = confirmed threat")

# ============================================================
# 4. Build the prompt directly from the logs
# ============================================================

def _build_prompt(target_ip: str) -> str:
    cursor  = (logs_col.find(
                    {},
                    {"_id": 0, "decoded_data": 1, "received_at": 1}
               )
               .sort("received_at", -1)
               .limit(MAX_CONTEXT))
    entries = list(reversed(list(cursor)))

    log_lines = "\n\n---\n\n".join(
        f"[{e['received_at'].strftime('%Y-%m-%d %H:%M:%S') if isinstance(e.get('received_at'), datetime) else e.get('received_at', '')}]\n{e.get('decoded_data', '')}"
        for e in entries
    )

    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    return f"""You are an elite Cyber Threat Hunter with 15+ years in SOC/IR operations.
Analysis timestamp: {now}
Target IP to investigate: {target_ip}
Total log entries provided: {len(entries)}

══════════════════════════════════════════
INSTRUCTIONS:
══════════════════════════════════════════
- Analyze the raw logs below to investigate target IP: {target_ip}
- Base your verdict ONLY on behavioral evidence from the logs.

══════════════════════════════════════════
BEHAVIORAL ANALYSIS FRAMEWORK:
══════════════════════════════════════════

[ATTACK PATH SIGNATURES]
- Secret hunting    : /.env /.aws /.ssh /.git /.htpasswd /config /backup
- Auth probing      : /admin /wp-login /phpmyadmin /manager /console /panel
- Code execution    : /cgi-bin /shellshock /${{jndi: /eval /exec /cmd
- Info disclosure   : /server-status /phpinfo /debug /trace /actuator
- Path traversal    : /../ /../../ %2e%2e %252e encoding variants
- Fuzzing signature : sequential numeric/alpha path variation

[TRAFFIC METRICS — compute from logs]
- Velocity          : requests per minute → >20=suspicious, >60=scanner
- 4xx error ratio   : >60% of requests = active scanner
- Path diversity    : >10 unique sensitive paths = recon
- Timing pattern    : uniform intervals = automated tool
- Burst pattern     : sudden spike after idle = triggered scan

[HEADER BEHAVIORAL FINGERPRINTING]
- Missing Accept-Language / Accept-Charset = non-browser bot
- Rotating User-Agent across requests = evasion
- No Referer on deep-path access = direct scanner
- Unusual Accept header = custom HTTP client
- Empty or default Cookie = no prior session

[PROXY & EVASION DETECTION]
- Slow scan (1 req/2-5min) to evade rate limiting
- Valid requests mixed with attack payloads
- Legitimate UA (Googlebot, curl) with malicious paths
- Same fingerprint across different source_ips = distributed scan

══════════════════════════════════════════
VERDICT RULES — strict:
══════════════════════════════════════════
ATTACKER   → confirmed malicious payload OR exploit attempt (2+ signals required)
SCANNER    → systematic path enumeration without successful exploitation
BOT        → automated but non-malicious (crawler, monitor, health check)
SUSPICIOUS → anomalous behavior but insufficient evidence
HUMAN      → organic pattern, realistic timing, normal browser headers

⚠ ATTACKER requires minimum 2 independent signals from different categories.
⚠ HUMAN requires consistent browser headers AND organic timing AND no sensitive paths.
⚠ A single 404 is noise. A sequence of 404s on sensitive paths is evidence.
⚠ Slow scans are still scans — low velocity does NOT mean Human.

══════════════════════════════════════════
OUTPUT REQUIREMENTS:
══════════════════════════════════════════
- risk_score     : 1-3=low  4-6=medium  7-9=high  10=critical
- ai_insights    : cite SPECIFIC evidence — exact paths, timestamps, headers
- recommendations: actionable — include firewall rule / rate-limit spec
- is_true_positive: False if any reasonable doubt remains

══════════════════════════════════════════
RAW LOG ENTRIES (oldest → newest):
══════════════════════════════════════════
{log_lines}
══════════════════════════════════════════
Now investigate IP: {target_ip} and return your ThreatAnalysis verdict.
══════════════════════════════════════════"""

# ============================================================
# 5. Analyze
# ============================================================

def analyze_and_save(target_ip: str):
    llm = ChatOpenAI(
        model=LLM_MODEL,
        temperature=0,
        api_key=LLM_API_KEY,
        base_url=LLM_BASE_URL,
    )

    agent = create_agent(
        model=llm,
        tools=[],
        system_prompt="You are an elite Cyber Threat Hunter.",
        response_format=ThreatAnalysis
    )

    prompt = _build_prompt(target_ip)

    try:
        res = agent.invoke({
            "messages": [{"role": "user", "content": prompt}]
        })

        analysis: ThreatAnalysis | None = res.get("structured_response")
        raw: str = res["messages"][-1].content if not analysis else ""

        _save_report(target_ip, analysis, raw)

    except Exception as e:
        print(f"[!] Agent error for {target_ip}: {e}")
        _save_report(target_ip, None, str(e))

# ============================================================
# 6. Store
# ============================================================

def _save_report(target_ip: str, analysis: ThreatAnalysis | None, raw: str):
    log_ids = [
        d["_id"] for d in
        logs_col.find({"analyzed": False}, {"_id": 1})
                .sort("received_at", -1)
                .limit(MAX_CONTEXT)
    ]

    report_doc = {
        "source_ip":   target_ip,
        "created_at":  datetime.utcnow(),
        "log_ids":     log_ids,
    }

    if analysis:
        report_doc.update({
            "risk_score":       analysis.risk_score,
            "threat_category":  analysis.threat_category,
            "ai_insights":      analysis.ai_insights,
            "recommendations":  [analysis.recommendations],
            "is_true_positive": analysis.is_true_positive,
        })
    else:
        report_doc["raw_output"] = raw

    report = reports_col.insert_one(report_doc)

    logs_col.update_many(
        {"_id": {"$in": log_ids}},
        {"$set": {
            "analyzed":  True,
            "report_id": report.inserted_id
        }}
    )

    print(f"\n{'='*55}")
    print(f"[REPORT] IP: {target_ip}")
    if analysis:
        print(f"  🔴 Risk       : {analysis.risk_score}/10")
        print(f"  🔍 Category   : {analysis.threat_category}")
        print(f"  💡 Insights   : {analysis.ai_insights[:150]}...")
        print(f"  🛡️  Action     : {analysis.recommendations}")
        print(f"  ✅ True Pos.  : {analysis.is_true_positive}")
    else:
        print(f"  ⚠️  Raw        : {raw[:200]}")
    print("="*55)

# ============================================================
# 7. Main
# ============================================================

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
s.bind((HOST, PORT))
s.listen(5)
print(f"[*] Listening on {HOST}:{PORT} TCP...")

while True:
    conn, addr = s.accept()
    try:
        while True:
            data = conn.recv(65535)
            if not data:
                break

            raw_data = data.decode("utf-8", errors="ignore").strip()
            if not raw_data:
                continue

            try:
                payload = json.loads(raw_data)
                if not isinstance(payload, dict):
                    continue
            except json.JSONDecodeError:
                # optional: store raw invalid message then continue
                
                continue

            parsed_url = urlparse(payload.get("url", ""))

            logs_col.insert_one({
                "decoded_data": raw_data,
                "received_at": datetime.utcnow(),
                "analyzed": False,
                "source_ip": payload.get("source_ip"),
                "method": payload.get("method"),
                "url": payload.get("url"),
                "host": payload.get("host"),
                "user_agent": payload.get("user-agent"),
                "headers": {
                    "pragma": payload.get("pragma"),
                    "cache_control": payload.get("cache-control"),
                    "accept": payload.get("accept"),
                    "accept_encoding": payload.get("accept-encoding"),
                    "accept_charset": payload.get("accept-charset"),
                    "accept_language": payload.get("accept-language"),
                    "cookie": payload.get("cookie"),
                    "content_type": payload.get("content-type"),
                    "connection": payload.get("connection"),
                    "content_length": payload.get("content-length"),
                    "content": payload.get("content"),
                },
            })

            source_ip = payload.get("source_ip", "")
            if source_ip:
                analyze_and_save(source_ip)
    except ConnectionResetError:
        pass
    finally:
        conn.close()
