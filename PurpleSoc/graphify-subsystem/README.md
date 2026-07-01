# ML/Agent Subsystem Analysis

Complete study guide for the ML/Agent subsystem of PurpleSoc.

## 📁 Contents

1. **SUBSYSTEM_ANALYSIS.md** — Detailed technical analysis
   - Complete inventory (agent.py, detector.py, models/)
   - Subsystem graph structure (24 nodes, 22 edges)
   - Coupling assessment (zero code coupling)
   - Cross-system integration points
   - Notable design patterns

2. **STUDY_SPLIT.md** — 2-way split for project defense preparation
   - Half 1: ML & IDS Core (detector.py, 260 LOC) → Person A
   - Half 2: Threat Analysis Agent (agent.py, 309 LOC) → Person B
   - Defense questions for each half
   - Study checklist and collaboration tips
   - Grading rubric

3. **subsystem_extract.json** — Programmatic graph representation
   - 24 nodes (agent, detector, external)
   - 22 edges (calls, uses, reads, writes, shares, etc.)
   - 5 hyperedges (feature clusters)

4. **split_proposal.json** — Detailed split analysis (JSON)

---

## 🎯 Quick Summary

### Subsystem Overview
- **Total LOC:** 569 (agent.py: 309, detector.py: 260)
- **Code Coupling:** ZERO (no imports between files)
- **Data Coupling:** LOW (independent MongoDB collections)
- **Operational Coupling:** SEQUENTIAL (both feed SOC dashboard)

### Architecture
```
Sniffer (syslog)
    ↓
[agent.py - Socket Server 514 TCP] → MongoDB logs_col
    ↓
[analyze_and_save] → Groq LLM → ThreatAnalysis verdict
    ↓
MongoDB reports_col → SOC Dashboard
    
---

CICFlowMeter (flows)
    ↓
[detector.py - FastAPI /predict] → Keras inference
    ↓
MongoDB traffic_logs_col → SOC Dashboard
```

### 2-Way Split for Study

| Aspect | Half 1: ML/IDS | Half 2: Agent |
|--------|--------|--------|
| **Assigned to** | Person A | Person B |
| **Files** | detector.py (260 LOC) + models | agent.py (309 LOC) |
| **Key Topics** | Feature engineering, ML inference, FastAPI | LangChain, LLM reasoning, prompt engineering |
| **Complexity** | 30% (Medium) | 35% (Medium-High) |
| **Defense Story** | "How do you build fast IDS with ML?" | "How do you reason about threats with LLM?" |
| **Main Question** | Why top 20 features? Threshold tuning? | Prompt design? Verdict rules? |

### Why This Split?
1. ✅ Zero code imports between files
2. ✅ Independent MongoDB collections (no schema coupling)
3. ✅ Balanced LOC (260 vs 309)
4. ✅ Balanced complexity (30% vs 35%)
5. ✅ Orthogonal concerns (ML vs reasoning)
6. ✅ Clear defense narratives (each person owns one story)

---

## 🔍 Key Findings

### agent.py (Threat Analysis Agent)
- **Socket server:** Listens on port 514 TCP for syslog/JSON traffic
- **Prompt engineering:** 70 LOC of behavioral analysis framework
- **LangChain integration:** ChatOpenAI + create_agent + structured output
- **Verdict rules:** 5 categories (Bot, Scanner, Attacker, Human, Suspicious)
- **Confidence gate:** is_true_positive field prevents false positives
- **External dependency:** Groq LLM API (GPT-compatible)

**Strengths:**
- Explicit behavioral signals (attack signatures, metrics, rules)
- Structured output prevents vague LLM results
- Audit trail (logs linked to reports)

**Gaps:**
- No feedback loop (analyst verdicts not used to refine prompt)
- No tool integration (could add IP reputation, WHOIS)
- Scaling: single socket server is bottleneck

### detector.py (ML Inference)
- **CICFlowMeter schema:** 80+ network flow features
- **Feature selection:** Top 20 of 80 (reduces dimensionality, speeds inference)
- **Preprocessing:** pandas + StandardScaler
- **Model:** Keras sequential (pre-trained on CIC-IDS2017)
- **Inference:** <100ms per flow
- **API:** FastAPI POST /predict endpoint
- **Decision:** 0.5 threshold → label ∈ {0, 1}

**Strengths:**
- Fast inference (suitable for real-time classification)
- Stateless (each request independent)
- Scalable (behind load balancer)

**Gaps:**
- Threshold not tuned for precision/recall trade-off
- No ablation study on top 20 feature selection
- Training code missing (pre-built models only)
- Concept drift not addressed (model is 5+ years old)

---

## 📊 Subsystem Graph Statistics

| Metric | Value |
|--------|-------|
| Total Nodes | 24 |
| Total Edges | 22 |
| Hyperedges (clusters) | 5 |
| Avg Node Degree | 1.8 |
| Code Coupling | ZERO |

### God Nodes (Most Connected)
1. analyze_and_save() — 4 edges (threat analysis core)
2. logs_col — 3 edges (data hub)
3. predict() — 3 edges (inference hub)
4. Groq LLM API — 2 edges (critical external)
5. traffic_logs_col — 2 edges (output)

### Hyperedges (Feature Clusters)
1. Threat Analysis Pipeline (4 nodes)
2. IDS ML Prediction (4 nodes)
3. LangChain Agent Orchestration (3 nodes)
4. ML Model Artifacts (3 nodes)
5. MongoDB Persistence (4 nodes)

---

## 🛠 Cross-Subsystem Edges

**agent.py → detector.py:** None (no code imports)

**Shared dependencies:**
- MongoDB (agent: logs_col + reports_col; detector: traffic_logs_col)
- Pydantic BaseModel (schema validation)
- datetime (timestamp handling)

**Operational flow:**
- agent.py reads logs_col → produces reports_col
- detector.py writes traffic_logs_col
- SOC Dashboard consumes both independently

---

## 💡 Interview Topics

### Person A (ML/IDS) will be asked:
- Feature engineering: why top 20 of 80?
- Model architecture: Keras layers, inference speed
- Threshold tuning: 0.5 optimal? Precision/recall trade-off?
- Evaluation metrics: accuracy? F1 score?
- Real-world challenges: concept drift, false positives

### Person B (Agent/Reasoning) will be asked:
- Behavioral framework: attack signatures, why these?
- Verdict rules: why 2 signals for ATTACKER?
- Prompt design: how prevent LLM hallucination?
- is_true_positive gate: false positive prevention
- Scaling: single socket server bottleneck?

---

## 📚 Study Plan

**Day 1 (4 hours):**
- Read SUBSYSTEM_ANALYSIS.md (1 hour)
- Read STUDY_SPLIT.md (1 hour)
- Scan your assigned file (30 min)
- Research external libraries (FastAPI, LangChain, Keras) (1.5 hours)

**Day 2 (5 hours):**
- Deep read of your file, line-by-line (2.5 hours)
- Trace one example end-to-end (1 hour)
- Write 1-page summary (1 hour)
- Prepare Q&A pairs (30 min)

**Day 3 (3 hours):**
- Mock defense with partner (1 hour)
- Refine weak areas (1 hour)
- Final review (1 hour)

**Total preparation time:** ~12 hours per person (6 hours overlap for integration)

---

## ✅ Verification Checklist

### Person A (ML/IDS)
- [ ] Can explain FlowData schema (pick 5 fields, explain each)
- [ ] Understand top_20_features selection strategy
- [ ] Trace: request → DataFrame → scale → predict → insert
- [ ] Know model architecture (Keras sequential layers)
- [ ] Explain why 0.5 threshold (and alternatives)
- [ ] Research CIC-IDS2017 dataset baseline accuracy
- [ ] Prepare 3 "fix it" answers (accuracy, latency, drift)

### Person B (Agent/Reasoning)
- [ ] Can explain all 5 verdict categories + rules
- [ ] Understand _build_prompt() construction
- [ ] Know LangChain: ChatOpenAI, create_agent, structured output
- [ ] Explain why 70 LOC prompt prevents hallucination
- [ ] Trace: socket receive → logs → prompt → LLM → verdict → save
- [ ] Research Groq API (differences from OpenAI)
- [ ] Prepare 3 "fix it" answers (false positives, evasion, scaling)

### Both Together
- [ ] Explain integration points (MongoDB shared, no code coupling)
- [ ] Know latencies (detector: <100ms, agent: <5s)
- [ ] Understand dashboard integration (reads both collections)
- [ ] Can explain trade-offs (accuracy vs latency, false positive vs false negative)

---

## 📞 Questions?

**For technical deep-dives:** See SUBSYSTEM_ANALYSIS.md

**For study prep & defense questions:** See STUDY_SPLIT.md

**For graph structure:** See subsystem_extract.json

---

**Last updated:** 2026-06-15
**Subsystem:** ML/Agent Core (agent/ + ml_detector/ + models/)
**Total LOC analyzed:** 569
**Zero-coupling split:** Ready for parallel study
