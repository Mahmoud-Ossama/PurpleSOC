# ML/Agent Subsystem: 2-Way Study Split
## For Project Defense Preparation

---

## Overview

The ML/Agent subsystem (569 LOC total) is split into two **independent, non-overlapping halves** for parallel study by two team members. Each half maps to a coherent technical story that judges will ask about.

**Key property:** Zero code coupling (no imports between files), independent MongoDB collections, sequential operational flow.

---

## 📊 HALF 1: ML & IDS CORE
### Study Person: **A** (ML/Systems Engineer Perspective)

**Files to Study:**
```
ml_detector/
├── detector.py                    (260 LOC) ⭐ MAIN FILE
requirements.txt (excerpt):
├── fastapi
├── tensorflow
├── pandas
├── joblib
└── pymongo

models/
├── ids_deep_learning_model.h5     (artifact)
├── ids_scaler_top20.pkl           (artifact)
└── top_20_features.pkl            (artifact)
```

**Complexity:** 30% (Medium)
**LOC:** 260 active code + artifacts
**Study Time:** 2-3 hours for deep understanding

---

### 📝 Key Topics to Master

1. **Network Flow Feature Engineering** (20 min)
   - CICFlowMeter schema: 80+ metrics (packet counts, timing, flags, etc.)
   - Why these metrics? What do they detect?
   - Reference: Understand `FlowData` class (80 fields)

2. **Feature Selection: Top 20 of 80** (15 min)
   - Which 20 features does the model use? (See `top_20_features.pkl`)
   - Why not all 80? Speed, accuracy, interpretability trade-offs
   - How were they selected? (Likely PCA or feature importance)

3. **Feature Scaling & Preprocessing** (15 min)
   - StandardScaler: zero mean, unit variance normalization
   - Why? Neural networks sensitive to feature magnitude
   - What happens without it? (Model performs poorly)
   - Reference: Line 245 in detector.py

4. **Keras Model Architecture** (20 min)
   - Load `ids_deep_learning_model.h5` → inspect layers
   - Sequential model? Conv layers? Dense layers?
   - Output: single neuron with sigmoid (binary classification)
   - Inference speed? Accuracy metrics?

5. **Classification Threshold & Decision** (10 min)
   - Model outputs probability ∈ [0, 1]
   - Threshold at 0.5: label = (pred > 0.5) ? 1 : 0
   - Is 0.5 optimal? (Usually not — tune for precision/recall trade-off)

6. **Real-time Inference Pipeline** (15 min)
   - Request arrives: FlowData JSON
   - Pandas DataFrame creation
   - Column renaming (csv_to_analysis_map)
   - Select top_20_features
   - Scale with scaler
   - model.predict() call
   - MongoDB insert
   - Response: {"status": "received"}

7. **FastAPI REST API Design** (10 min)
   - POST /predict endpoint
   - Input validation: Pydantic FlowData
   - Error handling: HTTPException 500
   - Stateless: each request is independent
   - Scaling: behind load balancer

8. **Robustness Patterns** (10 min)
   - _normalize_timestamp(): handles 5+ formats (ISO, strftime variants)
   - _normalize_label(): unwraps numpy arrays, handles tensor outputs
   - Why? Real-world data is messy
   - Fallbacks: datetime.utcnow(), return 0

---

### 🎯 Defense Questions You'll Get

**Basic (10 min warm-up):**
1. "Walk me through one prediction: JSON in → label out."
2. "Why do you scale features? What's the scaler doing?"
3. "What does the 0.5 threshold mean? Is it always best?"

**Intermediate (15 min depth):**
4. "You have 80 CICFlowMeter features. Why only use 20? What's the trade-off?"
5. "How would you evaluate this model? Accuracy? Precision/Recall/F1?"
6. "What's the latency SLA? How fast is inference per flow?"
7. "Why Keras/TensorFlow over scikit-learn? What's the benefit?"

**Advanced (20 min reasoning):**
8. "You're getting false positives. What would you do? Tune threshold? Retrain? Feature engineering?"
9. "CIC-IDS2017 is 5 years old. Your model is overfitting to historical patterns. How do you handle concept drift?"
10. "If you could add 10 more features, what would they be? Why?"

---

### 💡 Key Insights to Communicate

✅ **What you know:**
- "Feature scaling is critical for neural networks; StandardScaler normalizes input magnitude"
- "Top 20 feature selection reduces inference latency and model size"
- "0.5 threshold is a starting point; real deployment requires precision/recall tuning"
- "FastAPI provides stateless, scalable REST inference"

✅ **What's missing (acknowledge):**
- "Model was pre-trained externally; training code not in repo"
- "No ablation study on feature selection (future work)"
- "Threshold not tuned for domain (false positive rate unknown)"

---

---

## 📊 HALF 2: THREAT ANALYSIS AGENT
### Study Person: **B** (Security/Reasoning Perspective)

**Files to Study:**
```
agent/
├── agent.py                       (309 LOC) ⭐ MAIN FILE
└── requirements.txt
    ├── langchain-openai
    ├── langchain-core
    ├── pymongo
    └── (standard lib: socket, json, datetime, etc.)
```

**Complexity:** 35% (Medium-High)
**LOC:** 309 active code
**Study Time:** 3-4 hours for deep understanding

---

### 📝 Key Topics to Master

1. **Threat Intelligence Framework** (30 min)
   - **Attack path signatures:** secret hunting (/.env, /.aws, /.git), auth probing (/admin, /wp-login), code execution (/cgi-bin, shellshock), info disclosure (/phpinfo), path traversal (/../), fuzzing (sequential patterns)
   - **Behavioral metrics:** velocity (req/min → >60 = scanner), 4xx error ratio (>60% = active scanner), path diversity (>10 unique sensitive paths = recon), timing pattern (uniform = automated), burst pattern (sudden spike = triggered)
   - **Header fingerprinting:** missing Accept-Language/Charset = bot, rotating User-Agent = evasion, no Referer = direct scanner, unusual Accept = custom client, empty Cookie = no prior session
   - **Evasion detection:** slow scans, valid requests mixed with payloads, legitimate UA with malicious paths, same fingerprint across IPs = distributed scan

2. **Verdict Rules & Classification** (20 min)
   - **5 categories:**
     - ATTACKER: confirmed malicious payload OR exploit attempt (≥2 signals required)
     - SCANNER: systematic path enumeration without successful exploitation
     - BOT: automated but non-malicious (crawler, monitor, health check)
     - SUSPICIOUS: anomalous behavior but insufficient evidence
     - HUMAN: organic pattern, realistic timing, normal browser headers
   - **Rules (strict):**
     - ATTACKER requires minimum 2 independent signals
     - HUMAN requires consistent browser headers AND organic timing AND no sensitive paths
     - A single 404 is noise; sequence of 404s on sensitive paths is evidence
     - Slow scans are still scans — low velocity ≠ Human

3. **Socket Server & Log Ingestion** (15 min)
   - TCP listener on 0.0.0.0:514 (syslog standard)
   - Receives JSON-formatted traffic data (from HAProxy/Sniffer)
   - Fields parsed: source_ip, method, url, host, user-agent, headers (pragma, cache-control, accept, content-type, etc.), content
   - MongoDB insert: decoded_data, received_at, source_ip, method, url, headers (normalized)
   - Triggers analyze_and_save(source_ip) per unique attacker IP
   - Reference: Lines 250-309 in agent.py (main loop)

4. **Context Building: _build_prompt()** (25 min)
   - Fetches last 100 log entries from MongoDB logs_col
   - Reverses timestamp order (oldest → newest for narrative flow)
   - Constructs detailed SOC analyst prompt (~70 LOC)
   - Prompt structure:
     - Header: "You are an elite Cyber Threat Hunter with 15+ years..."
     - Context: timestamp, target IP, total log count
     - Behavioral analysis framework (attack signatures, metrics, verdicts)
     - Strict rules (minimum signals, confidence gates)
     - Raw log entries (oldest → newest)
     - Final instruction: "Investigate IP and return ThreatAnalysis verdict"
   - Why so detailed? Prevents LLM hallucination, grounds reasoning in explicit signals
   - Reference: Lines 71-158 in agent.py

5. **LangChain Agent Orchestration** (20 min)
   - ChatOpenAI client: connects to Groq API (GPT-compatible endpoint)
   - create_agent(): builds agent with tools list (currently empty)
   - response_format=ThreatAnalysis: forces structured JSON output
   - agent.invoke(): sends {"messages": [{"role": "user", "content": prompt}]}
   - Result: structured_response (ThreatAnalysis) + fallback raw response
   - Why LangChain? Agent abstraction, tool ecosystem, structured outputs, streaming support
   - Reference: Lines 165-177 in agent.py

6. **Structured Output: ThreatAnalysis Schema** (15 min)
   - Pydantic BaseModel with validation:
     - risk_score: int (1-10, constrained)
     - threat_category: Literal["Bot", "Scanner", "Attacker", "Human", "Suspicious"]
     - ai_insights: str (detailed behavioral analysis, cite SPECIFIC evidence — exact paths, timestamps, headers)
     - recommendations: str (actionable — include firewall rule, rate-limit spec)
     - is_true_positive: bool (False if any reasonable doubt remains — confidence gate)
   - Why? Enforces analytical rigor, prevents vague LLM outputs, provides dashboard-ready data
   - Reference: Lines 60-65 in agent.py

7. **Persistence & Linking** (15 min)
   - _save_report() saves report to MongoDB reports_col:
     - Document: {source_ip, created_at, log_ids: [array of analyzed log IDs], risk_score, threat_category, ai_insights, recommendations, is_true_positive}
     - Links logs to report via log_ids array
     - Updates logs_col: marks analyzed=True, associates report_id
   - Why? Audit trail, traceability (which logs led to verdict), prevents duplicate analysis
   - Reference: Lines 199-244 in agent.py

8. **Robustness & Error Handling** (10 min)
   - try/except around agent.invoke()
   - Catches API failures, malformed responses
   - Fallback: saves raw error message to reports_col
   - Graceful degradation: "raw_output": raw error (analyst can review)
   - No halting failures

---

### 🎯 Defense Questions You'll Get

**Basic (10 min warm-up):**
1. "Walk me through one analysis: suspicious IP → verdict."
2. "What's the behavioral analysis framework? Why those attack signatures?"
3. "What does is_true_positive mean? Why is it a separate field?"

**Intermediate (15 min depth):**
4. "Explain the verdict rules. Why does ATTACKER require 2 signals?"
5. "Your prompt is 70 LOC. How does it prevent LLM hallucination?"
6. "You get a slow scanner (1 req/5 min). Why is it still a threat?"
7. "Why Groq API over OpenAI? What's the trade-off?"

**Advanced (20 min reasoning):**
8. "You're getting false positives (legitimate scanners classified as ATTACKER). How do you reduce FP rate?"
9. "An attacker rotates User-Agent every request. How does your prompt detect this?"
10. "A bot uses legitimate paths but suspicious timing. Walk me through the reasoning."

---

### 💡 Key Insights to Communicate

✅ **What you know:**
- "Behavioral framework is data-driven: attack signatures have high specificity; metrics are quantifiable"
- "Verdict rules require 2+ signals to prevent single-signal false alarms"
- "Prompt engineering guides LLM reasoning; explicit signals prevent hallucination"
- "is_true_positive gate ensures analyst review before alerting"

✅ **What's missing (acknowledge):**
- "No feedback loop: analyst verdicts not used to refine prompt"
- "No tool integration: could add IP reputation, WHOIS, port scanning context to enrich analysis"
- "No A/B testing on prompt variants (future optimization)"
- "Scaling: single socket server (514 TCP) is a bottleneck for high-volume traffic"

---

---

## 🔗 Integration Points (You Both Need to Know)

**How they connect:**
1. Sniffer/HAProxy → agent.py (port 514 TCP) → logs_col
2. agent.py reads logs_col → analyzes → reports_col
3. External flow collector → detector.py (/predict) → traffic_logs_col
4. SOC Dashboard reads both reports_col + traffic_logs_col (independent visualizations)

**MongoDB collections:**
- **logs_col:** HTTP/syslog traffic from network (populated by agent socket server)
- **reports_col:** Threat verdicts (populated by agent analysis)
- **traffic_logs_col:** ML predictions per flow (populated by detector inference)

**No direct code coupling** — they communicate via MongoDB and the dashboard.

---

## ✅ Study Checklist

### Person A (ML/IDS Core)

- [ ] Read detector.py end-to-end (260 LOC, 1-2 hours)
- [ ] Understand FlowData schema (80 fields) — pick 5, explain each
- [ ] Trace one prediction: request → DataFrame → select features → scale → predict → insert
- [ ] Load ids_deep_learning_model.h5, inspect architecture (layers, input/output shapes)
- [ ] Explain: why top 20 features? Why StandardScaler? Why 0.5 threshold?
- [ ] Research: CIC-IDS2017 dataset (what is it? baseline accuracy?)
- [ ] Prepare 3 answers: "Improve accuracy?" "Reduce latency?" "Handle concept drift?"
- [ ] Mock questions: 2 basic, 2 intermediate, 1 advanced

### Person B (Threat Analysis Agent)

- [ ] Read agent.py end-to-end (309 LOC, 2-3 hours)
- [ ] Memorize the 5 threat categories + verdict rules
- [ ] Understand _build_prompt() — trace how it constructs narrative from logs
- [ ] Explain LangChain: ChatOpenAI, create_agent, structured output (ThreatAnalysis)
- [ ] Explain: why 70 LOC prompt? What signals prevent false positives?
- [ ] Research: Groq API (how is it different from OpenAI?)
- [ ] Prepare 3 answers: "Reduce false positives?" "Detect slow scanners?" "Handle evasion?"
- [ ] Mock questions: 2 basic, 2 intermediate, 1 advanced

---

## 📚 Recommended Reading Order

### Day 1: Orientation
- Read this document (20 min)
- Read SUBSYSTEM_ANALYSIS.md (30 min)
- High-level scan of your assigned file (15 min)

### Day 2: Deep Dive
- Read your assigned file line-by-line (1.5-2 hours)
- Highlight unknowns, questions
- Draw data flow diagram (inputs → processing → outputs)

### Day 3: Investigation
- Research external dependencies (FastAPI, LangChain, Groq, Keras)
- Load artifacts (models, scalers) if possible
- Trace one example end-to-end (one flow, one threat)

### Day 4: Synthesis
- Write 1-page summary of your half
- Prepare 10 Q&A pairs (basic + intermediate + advanced)
- Mock defense with your partner (10 min each)

---

## 🎓 Grading Rubric (What Judges Will Evaluate)

### Technical Depth (40%)
- Can you explain the core algorithm/logic?
- Do you understand the data flow?
- Can you answer "why this design?" questions?

### Problem-Solving (30%)
- How would you fix a bug or improve performance?
- Can you reason about trade-offs (accuracy vs latency, precision vs recall)?
- What would you do differently?

### System Understanding (20%)
- How does your half integrate with the rest of the system?
- What are the dependencies? The contract with other components?

### Communication (10%)
- Can you explain it clearly in 60 seconds?
- Do you use correct terminology?

---

## 📞 Cross-Person Collaboration

**Person A should ask Person B:**
- "Where does the traffic for my detector come from? What's in logs_col?"
- "How does the agent decide which IPs to analyze? Is it all traffic or filtered?"

**Person B should ask Person A:**
- "What's the accuracy of your model? False positive rate?"
- "How fast is inference per flow? Can it keep up with real-time traffic?"

**Both together:**
- "How would you integrate feedback? Analyst marks verdict WRONG → what happens?"
- "If detector + agent both flag an IP, do they agree?"

---

## 📋 Glossary

- **FlowData** — Network flow features (80+ metrics)
- **CICFlowMeter** — Tool to extract flow features from pcap
- **StandardScaler** — Feature normalization (zero mean, unit variance)
- **ThreatAnalysis** — Pydantic schema for LLM verdict (risk_score, category, insights, recommendations, is_true_positive)
- **LangChain** — Agent orchestration framework
- **Groq API** — LLM backend (GPT-compatible endpoint)
- **logs_col** — MongoDB collection of HTTP/syslog traffic
- **reports_col** — MongoDB collection of threat verdicts
- **traffic_logs_col** — MongoDB collection of ML predictions
- **Socket server** — TCP listener for incoming traffic (port 514)
- **FastAPI** — REST framework for inference endpoint
- **Keras** — High-level neural network API (on TensorFlow)

---

## ⚡ Quick Reference

| Aspect | Person A (ML) | Person B (Agent) |
|--------|---------------|------------------|
| **File** | detector.py (260 LOC) | agent.py (309 LOC) |
| **Role** | Real-time ML inference | LLM-powered threat analysis |
| **Input** | Network flows (80+ features) | HTTP/syslog logs |
| **Output** | Binary label (normal/attack) | ThreatAnalysis verdict (5 categories, 1-10 score) |
| **Framework** | FastAPI + TensorFlow/Keras | LangChain + Groq LLM + socket server |
| **Latency** | <100ms (inference) | <5s (prompt → LLM → verdict) |
| **Scaling** | Load-balanced REST API | Sharding by IP range or message queue |
| **Key Concept** | Feature engineering + model selection | Prompt engineering + structured output |

---

**Good luck! You've got this.** 🚀

Prepare independently, integrate via MongoDB, communicate clearly, defend confidently.

