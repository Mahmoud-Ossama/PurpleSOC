# ML/Agent Subsystem Analysis
**PurpleSoc Project Defense Study Guide**

---

## Executive Summary

The ML/Agent subsystem consists of **2 loosely-coupled Python modules** (569 LOC total) + pre-trained model artifacts that implement real-time network intrusion detection (ML) and LLM-powered threat analysis (agent reasoning).

**Key finding:** Zero code dependencies between modules — they share MongoDB collections but operate independently. Ideal for parallel study by two team members.

---

## 1. SUBSYSTEM INVENTORY

### 1.1 agent/agent.py (309 LOC, ~35% complexity)

**Role:** Threat analysis orchestration & LLM-powered threat hunter

**Architecture:**
```
Sniffer/HAProxy (syslog)
        ↓
    [Socket Server - port 514 TCP]
        ↓
    [JSON parsing + MongoDB insert]
        ↓
    [analyze_and_save() per source IP]
        ↓
    [LangChain Agent + Groq LLM]
        ↓
    [ThreatAnalysis reasoning]
        ↓
    [MongoDB reports_col]
        ↓
    SOC Dashboard (visualization)
```

**Key Components:**

1. **ThreatAnalysis (Pydantic BaseModel)**
   - `risk_score: int` (1-10 scale)
   - `threat_category: Literal["Bot", "Scanner", "Attacker", "Human", "Suspicious"]`
   - `ai_insights: str` (detailed behavioral analysis)
   - `recommendations: str` (actionable next steps)
   - `is_true_positive: bool` (confidence gate)

2. **_build_prompt(target_ip: str) → str**
   - Fetches last 100 log entries from MongoDB logs_col
   - Constructs detailed SOC analyst prompt (~70 LOC)
   - Includes attack signatures: secret hunting, auth probing, code execution, path traversal, fuzzing
   - Includes behavioral metrics: velocity (req/min), 4xx error ratio, path diversity, timing patterns
   - Includes evasion patterns: slow scans, header rotation, proxy detection
   - Implements strict verdict rules: ATTACKER (2+ signals), SCANNER, BOT, SUSPICIOUS, HUMAN

3. **analyze_and_save(target_ip: str)**
   - Creates ChatOpenAI client (Groq API backend)
   - Creates LangChain agent with ThreatAnalysis response format
   - Invokes agent with constructed prompt
   - Calls _save_report() on result

4. **_save_report(target_ip: str, analysis: ThreatAnalysis | None, raw: str)**
   - Saves analysis + metadata to MongoDB reports_col
   - Links logs to report via log_ids array
   - Marks logs as analyzed=True and associates report_id

5. **socket_server (implicit in main loop)**
   - Listens on 0.0.0.0:514 TCP for incoming JSON logs
   - Parses syslog-formatted traffic data
   - Inserts to MongoDB logs_col with decoded_data, source_ip, headers, method, url, etc.
   - Extracts source_ip and triggers analyze_and_save()

**Dependencies:**
- `langchain_openai.ChatOpenAI` — LLM client
- `langchain.agents.create_agent` — agent factory
- `langchain_core.tools.tool` — tool decorator
- `pymongo.MongoClient` — database
- `pydantic.BaseModel` — schema validation
- Standard library: json, socket, requests, datetime, re, urlparse

**External Integrations:**
- **Groq API** (https://api.groq.com/openai/v1) — LLM backend
- **MongoDB** (mongodb://admin:adminpassword@mongo:27017/ids_db) — persistence
- **Network Sniffer** (receives on port 514 TCP) — data source
- **SOC Dashboard** (reads reports_col) — consumer

---

### 1.2 ml_detector/detector.py (260 LOC, ~30% complexity)

**Role:** Real-time IDS prediction service via FastAPI REST API

**Architecture:**
```
CICFlowMeter / Flow Collector
        ↓
    POST /predict (FlowData JSON)
        ↓
    [Feature extraction + renaming]
        ↓
    [Select top_20_features]
        ↓
    [StandardScaler.transform()]
        ↓
    [Keras model.predict()]
        ↓
    [Threshold at 0.5 → label 0/1]
        ↓
    [MongoDB traffic_logs insert]
        ↓
    SOC Dashboard (reads traffic_logs)
```

**Key Components:**

1. **FlowData (Pydantic BaseModel)**
   - 80+ network flow features from CICFlowMeter:
     - IPs/ports: src_ip, dst_ip, src_port, dst_port
     - Packet counts: tot_fwd_pkts, tot_bwd_pkts, fwd_pkt_len_max/min/mean/std, etc.
     - Timing: flow_duration, flow_iat_mean/std/max/min, fwd_iat_tot/mean/max, etc.
     - Flags: fin_flag_cnt, syn_flag_cnt, rst_flag_cnt, psh_flag_cnt, ack_flag_cnt, urg_flag_cnt, ece_flag_cnt
     - Other: down_up_ratio, pkt_size_avg, active_max/min/mean/std, idle_max/min/mean/std, etc.
   - All fields Optional[float | int | str]

2. **csv_to_analysis_map (dict)**
   - ~70 entries mapping API field names to model feature names
   - Example: 'dst_port' → 'Destination Port'
   - Used in predict() to rename DataFrame columns

3. **predict() (FastAPI POST /predict)**
   - Input: FlowData JSON
   - Steps:
     1. Convert FlowData → pandas DataFrame
     2. Rename columns using csv_to_analysis_map
     3. Select top_20_features (feature selection)
     4. Scale with joblib scaler
     5. Call Keras model.predict(scaled)
     6. Threshold predictions > 0.5 → label ∈ {0, 1}
     7. Insert records to traffic_logs_col
   - Output: {"status": "received"}
   - Error handling: HTTPException 500 on any exception

4. **_normalize_timestamp(raw_ts: Optional[str]) → datetime**
   - Handles multiple timestamp formats:
     - ISO format (with Z → +00:00 conversion)
     - Common strftime formats (YYYY-MM-DD HH:MM:SS, DD-MM-YYYY, etc.)
   - Fallback: datetime.utcnow() if parsing fails

5. **_normalize_label(raw_label) → int**
   - Handles numpy arrays and tensor outputs from Keras
   - Extracts scalar value: if list/tuple/tensor, unwrap recursively
   - Returns int (0 or 1), defaults to 0 on error

**Models & Artifacts:**
- `ids_deep_learning_model.h5` — Keras sequential model (trained on CIC-IDS2017/2018)
- `ids_scaler_top20.pkl` — StandardScaler fitted on training data
- `top_20_features.pkl` — List of selected feature names for model input
- Alternatives: ids_ann_model.h5, best_model.h5, ids_scaler_top25.pkl

**Dependencies:**
- `fastapi.FastAPI` — REST framework
- `tensorflow.keras.models.load_model` — model loading
- `pandas.DataFrame` — data manipulation
- `joblib.load` — scaler/feature serialization
- `pymongo.MongoClient` — database
- `pydantic.BaseModel` — schema

**External Integrations:**
- **CICFlowMeter / Flow Collector** (calls POST /predict) — data source
- **MongoDB** (mongodb://admin:adminpassword@mongo:27017/ids_db) — persistence
- **SOC Dashboard** (reads traffic_logs_col) — consumer

---

### 1.3 models/ (Artifacts, ~0% code)

**Role:** Model store — pre-trained weights & preprocessing artifacts

**Files:**
- `ids_deep_learning_model.h5` — Primary Keras sequential model
- `ids_ann_model.h5`, `best_model.h5` — Alternative model architectures
- `ids_scaler_top20.pkl` — StandardScaler for feature normalization
- `ids_scaler_top25.pkl` — Alternative scaler (25 features)
- `top_20_features.pkl`, `top_25_features.pkl` — Feature lists
- `optimal_threshold.pkl` — Classification threshold (unused in current detector.py)

**Training:** Models appear to be pre-trained externally (likely from Jupyter notebook, not included in repo)

---

## 2. SUBSYSTEM GRAPH STATISTICS

| Metric | Value |
|--------|-------|
| **Total Nodes** | 24 |
| **Total Edges** | 22 |
| **Hyperedges (clusters)** | 5 |
| **Code Coupling** | ZERO — no imports between agent.py and detector.py |
| **MongoDB Coupling** | Independent collections (agent: logs_col, reports_col; detector: traffic_logs_col) |
| **Total Active LOC** | 569 |
| **Agent.py LOC** | 309 |
| **Detector.py LOC** | 260 |

### 2.1 Key Nodes (God Nodes)

Most connected components:

1. **analyze_and_save()** — 4 incoming edges
   - Called by: socket_server
   - Calls: _build_prompt, ChatOpenAI.invoke, _save_report
   
2. **logs_col (MongoDB)** — 3 incoming edges
   - Written by: socket_server
   - Read by: _build_prompt
   - Updated by: _save_report

3. **predict() endpoint** — 3 incoming edges
   - Called by: external CICFlowMeter
   - Calls: pandas, scaler.transform, model.predict

4. **Groq LLM API** — 2 incoming edges (critical external dependency)
   - Called by: ChatOpenAI

5. **traffic_logs_col (MongoDB)** — 2 incoming edges
   - Written by: predict()
   - Read by: SOC Dashboard

### 2.2 Cross-Subsystem Edges (agent.py → detector.py)

| Source | Target | Type | Note |
|--------|--------|------|------|
| (none) | (none) | — | No direct code imports |
| agent.logs_col | detector.traffic_logs_col | shares_db | Same MongoDB instance, independent collections |

### 2.3 External Integrations

**agent.py outbound:**
- → Groq API (ChatOpenAI calls) **[critical, LLM reasoning]**
- ← Sniffer/HAProxy (socket server listens) **[data source]**
- → SOC Dashboard (reports_col) **[visualization]**

**detector.py outbound:**
- ← CICFlowMeter (POST /predict) **[data source]**
- → SOC Dashboard (traffic_logs_col) **[visualization]**

---

## 3. HYPEREDGES (Feature/Subsystem Clusters)

1. **Threat Analysis Pipeline**
   - Nodes: _build_prompt, analyze_and_save, _save_report, ThreatAnalysis
   - Cohesion: High (sequential control flow)

2. **IDS ML Prediction**
   - Nodes: FlowData, predict, _normalize_timestamp, _normalize_label
   - Cohesion: High (single POST endpoint logic)

3. **LangChain Agent Orchestration**
   - Nodes: ChatOpenAI, create_agent, analyze_and_save
   - Cohesion: High (LLM reasoning layer)

4. **ML Model Artifacts & Preprocessing**
   - Nodes: keras_model, scaler, feature_selector
   - Cohesion: High (inference pipeline)

5. **MongoDB Persistence Layer**
   - Nodes: MongoClient (both), logs_col, reports_col, traffic_logs_col
   - Cohesion: Medium (independent schemas but shared infrastructure)

---

## 4. COUPLING ASSESSMENT

### 4.1 Code Coupling: **ZERO**
- agent.py and detector.py have **zero imports** of each other
- Each uses only standard library + external packages
- Can be developed, tested, deployed independently

### 4.2 Data Coupling: **LOW**
- agent.py: reads logs_col, writes reports_col
- detector.py: writes traffic_logs_col
- **Independent collections** — no schema conflicts
- SOC Dashboard acts as the consumer, not a coupling point between them

### 4.3 Operational Coupling: **SEQUENTIAL**
- detector.py runs continuously (FastAPI service)
- agent.py runs continuously (socket server)
- Data flow: Sniffer → agent → MongoDB, AND Collector → detector → MongoDB
- **Not bidirectional** — each produces data, both feed dashboard

### 4.4 Shared Concepts (Interview Topics)
- **Pydantic BaseModel** — schema validation (both use it)
- **MongoDB persistence** — database layer (both use it)
- **Timestamp normalization** — robustness pattern (both implement it)
- **Error handling** — different approaches (agent uses try/except, detector uses HTTPException)

---

## 5. PROPOSED 2-WAY SPLIT FOR PROJECT DEFENSE

### HALF 1: ML & IDS CORE ✅

**Assigned to:** Person A (ML Engineer perspective)

**Files to study:**
```
ml_detector/detector.py               [260 LOC]
models/ids_deep_learning_model.h5     [artifact]
models/ids_scaler_top20.pkl           [artifact]
models/top_20_features.pkl            [artifact]
```

**Key Topics (in order of importance):**
1. **CICFlowMeter Feature Schema** — Understand the 80+ network flow metrics and why they were chosen
2. **Feature Selection** — Why top 20 features? What's the trade-off vs using all?
3. **Feature Scaling** — Why StandardScaler? What happens without it?
4. **Model Architecture** — Keras sequential model layers (look at model.h5 via graphing)
5. **Inference Pipeline** — DataFrame → select features → scale → predict → threshold
6. **FastAPI Endpoint** — REST API contract, error handling
7. **Data Persistence** — traffic_logs_col schema, integration with dashboard
8. **Robustness Helpers** — _normalize_timestamp and _normalize_label patterns

**Study Focus:** 
> *Model-centric: understand how network flows are transformed into predictions, the role of feature engineering in ML-based IDS, and real-time inference at scale.*

**Expected Defense Questions:**
- "Why 20 features instead of all 80?" → Feature selection strategy (variance/importance/speed trade-off)
- "Explain the feature scaling step." → StandardScaler why, what it does, impact on model
- "Walk through a single prediction: from HTTP request to label." → End-to-end data flow
- "What does the 0.5 threshold represent?" → Classification threshold, why 0.5, alternatives
- "How would you evaluate this model?" → Precision/recall/F1 on test set (CIC-IDS2017)
- "Why Keras over scikit-learn?" → Model complexity, inference speed, deployment (h5 format)
- "Who consumes traffic_logs?" → SOC dashboard, feed into agent for context
- "What's the latency SLA?" → Real-time classification per flow, ~ms inference

**Complexity Score:** 30% (medium — inference logic, feature engineering, API contract)

---

### HALF 2: THREAT ANALYSIS AGENT ✅

**Assigned to:** Person B (Security/Reasoning perspective)

**Files to study:**
```
agent/agent.py                        [309 LOC]
agent/requirements.txt                [LangChain, Groq, pymongo]
```

**Key Topics (in order of importance):**
1. **Prompt Engineering** — Behavioral analysis framework, attack signatures, verdict rules
2. **LangChain Agent Framework** — Agent creation, tool definition, structured output (Pydantic)
3. **Groq LLM Integration** — GPT-compatible API, model selection, response format
4. **Log Aggregation & Context** — Building prompt from last N logs, maintaining context window
5. **Socket Server** — Syslog parsing, JSON handling, IP extraction
6. **Threat Classification** — 5-category verdict (Bot, Scanner, Attacker, Human, Suspicious)
7. **Structured Output** — ThreatAnalysis schema, risk_score 1-10, is_true_positive gate
8. **MongoDB Persistence** — logs_col, reports_col, linking logs to report via log_ids

**Study Focus:**
> *Reasoning-centric: understand how LLM agents can be guided with domain-specific prompts to reason about threat patterns, and how structured outputs enforce analytical rigor.*

**Expected Defense Questions:**
- "Explain the behavioral analysis framework in your prompt." → Attack signatures (path traversal, auth probing, code exec, info disclosure, etc.), why these?
- "Walk through an example: suspicious IP → verdict." → End-to-end: socket receive → JSON parse → prompt construction → agent invocation → save report
- "Why is is_true_positive a separate field?" → False positive gate, confidence threshold, prevents over-alerting
- "How does the agent avoid hallucinations?" → Behavioral framework with concrete signatures, verdict rules, evidence citations
- "What's the prompt template doing?" → Guiding LLM reasoning with explicit signals, metrics, evasion patterns
- "Why Groq API over OpenAI?" → Cost, latency, GPT-compatible endpoints, rate limits
- "How are logs_col and reports_col related?" → logs fed into prompt, logs linked to report_id after analysis
- "What metrics drive the verdict?" → Velocity (req/min), 4xx error ratio, path diversity, timing patterns, header anomalies

**Complexity Score:** 35% (medium-high — LLM orchestration, prompt engineering, threat logic)

---

## 6. WHY THIS SPLIT IS OPTIMAL

| Criterion | Score | Notes |
|-----------|-------|-------|
| **Minimal Cross-Dependencies** | ✅✅ | Zero code imports; independent MongoDB collections |
| **Balanced Complexity** | ✅✅ | 260 LOC (detector) vs 309 LOC (agent) — roughly equal |
| **Balanced Scope** | ✅✅ | One file each + models/requirements — manageable study load |
| **Clear Topic Boundaries** | ✅✅ | ML/feature engineering vs LLM/reasoning — orthogonal concerns |
| **Defense Readiness** | ✅✅ | Each person owns one story: "How do you build fast IDS?" + "How do you reason about threats?" |
| **Architectural Clarity** | ✅✅ | Detector is **stateless inference** (no state, pure function), agent is **stateful reasoning** (context maintenance, verdict accumulation) |
| **Interview Narrative** | ✅✅ | Person A: ML accuracy/latency trade-offs. Person B: Prompt engineering/false positive rates. |

**Bottom Line:** This split maximizes independent study while preserving the system's architecture. Each person studies a complete pipeline (input → reasoning → output) without being blocked by the other.

---

## 7. CROSS-SYSTEM INTEGRATION POINTS

How ML/Agent subsystem connects to the rest of PurpleSoc:

```
┌─────────────────────────────────────────────────────────────┐
│                       PurpleSoc System                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  HAProxy (Port 80)  ──┐                                      │
│  Sniffer            ──┼──> agent.py (Socket 514 TCP)         │
│                       │                                      │
│                       └──> MongoDB: logs_col                 │
│                              ↓                                │
│  CICFlowMeter ─────────> detector.py (FastAPI /predict)      │
│  Flow Collector             ↓                                │
│                       MongoDB: traffic_logs_col              │
│                             │                                │
│                             ├──> Groq LLM API                │
│                             │    (agent.py reasoning)        │
│                             │                                │
│                             └──> SOC Dashboard               │
│                                  (visualization)             │
│                                                               │
│  Vulnerable Web App ─────────────────────────────────────┐   │
│  (traffic target)                                         │   │
│                                                           ↓   │
└─────────────────────────────────────────────────────────────┘
```

**Data Flow:**
1. HAProxy/Sniffer captures HTTP traffic → agent.py (port 514 TCP) → logs_col
2. agent.py reads logs_col → constructs prompt → calls Groq API → ThreatAnalysis verdict → reports_col
3. External flow collector → detector.py (/predict) → traffic_logs_col
4. SOC Dashboard reads both reports_col (threat verdicts) and traffic_logs_col (ML predictions)

**Integration Points:**
- **Shared MongoDB database** — but independent collections (no schema coupling)
- **Shared data model** — both use Pydantic BaseModel, standard timestamps
- **Shared visualization layer** — SOC dashboard consumes both outputs independently

---

## 8. NOTABLE PATTERNS & DESIGN DECISIONS

### 8.1 Robustness: Timestamp & Label Normalization

Both modules implement independent timestamp/label handling:
- **detector.py:** `_normalize_timestamp()` handles ISO, strftime, alternative formats
- **agent.py:** Uses datetime.utcnow() as fallback

Good interview topic: Why both? Why not shared utility?
**Answer:** Independent services don't share code — each is self-contained. Could be unified in production.

### 8.2 Pydantic Schemas as Contracts

- **agent.py:** ThreatAnalysis (output schema) — enforces structured LLM output
- **detector.py:** FlowData (input schema) — validates flow features from HTTP

Good interview topic: Why Pydantic over plain dataclasses?
**Answer:** Validation, serialization, FastAPI integration, type hints

### 8.3 Prompt Engineering as Core Logic

agent.py's _build_prompt() is **70 LOC of domain-specific reasoning logic**:
- Behavioral analysis framework (not hand-coded rules)
- Attack signature detection (high-signal indicators)
- Verdict rules (minimum 2 signals for ATTACKER)

Good interview topic: How would you improve this prompt?
**Answer:** A/B test variants, add feedback loops, learn from false positives

### 8.4 Feature Selection: Top 20 of 80

detector.py uses only 20 of 80 CICFlowMeter features:
- Trade-off: reduced input dimensionality, faster inference, potential accuracy loss
- Selection likely from training via feature importance (RandomForest, permutation, etc.)

Good interview topic: How were top 20 selected? Ablation study?
**Answer:** Likely PCA or feature importance ranking; missing ablation study (future work)

---

## 9. KNOWLEDGE GAPS & FUTURE WORK

1. **Model training code** — Not in repo (pre-trained models only)
   - How were models trained? CIC-IDS2017 baseline? Custom data?
   - What's the test accuracy/precision/recall?
   - Why Keras? Architecture details missing.

2. **LangChain tool integration** — Currently no tools, just prompting
   - Could add tools: IP reputation lookup, WHOIS, port scanner context
   - Would reduce hallucination vs pure prompting

3. **Feedback loops** — No learning from false positives
   - agent.py verdicts not used to retrain detector.py
   - Could implement: analyst feedback → prompt refinement

4. **Threshold tuning** — detector.py uses hard 0.5 threshold
   - Should be tuned for precision/recall trade-off
   - Could be dynamic based on time-of-day, historical data

5. **Scaling** — Single socket server (agent.py) is a bottleneck
   - Could shard by IP range, parallel agents, message queue (Kafka)

---

## 10. GLOSSARY & REFERENCES

- **CICFlowMeter** — Netflow extractor for IDS datasets (80 features per flow)
- **ThreatAnalysis** — Pydantic schema for structured LLM output (risk_score, verdict, insights)
- **FlowData** — Pydantic schema for network flow input (80+ metrics)
- **LangChain** — Agent orchestration framework (tool definition, agent creation, structured output)
- **Groq API** — LLM backend (GPT-compatible, alternative to OpenAI)
- **StandardScaler** — Feature normalization (zero mean, unit variance)
- **Keras** — High-level neural network API (on TensorFlow backend)
- **MongoDB collections:**
  - `logs_col` — Incoming HTTP/syslog traffic
  - `reports_col` — Agent verdicts + threat analysis
  - `traffic_logs_col` — ML predictions per flow

---

**Document created:** 2026-06-15  
**Subsystem:** ML/Agent Core  
**Total LOC analyzed:** 569  
**Recommended study split:** Balanced, zero-coupling, topic-orthogonal  
