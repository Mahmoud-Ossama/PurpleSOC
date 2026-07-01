# Project Overview (For Non-Technical Review)

This document explains the project in simple terms, including inputs, outputs, and the full process. It is written for a judge with low technical knowledge.

## What This Project Is

This is a cybersecurity training and monitoring system. It simulates attacks on a vulnerable web app ("VulnWeb"), watches the traffic, detects threats with analytics and machine learning, and shows the results in a security dashboard.

In short:
- We create risky behavior on purpose (to learn from it).
- We capture and analyze the traffic.
- We detect suspicious activity.
- We present the evidence in a clear dashboard.

## Who It Is For

- Students or analysts learning blue-team defense (detect and respond to attacks).
- Instructors who need a realistic training setup.
- Reviewers who want to see how detection can work end-to-end.

## Inputs and Outputs (Plain Language)

### Inputs
- User actions on the vulnerable website (logins, searches, purchases).
- Simulated attacker actions (injection, brute force, malicious payloads).
- Network traffic between users, servers, and the web app.
- Configuration files that tell the system how to run.

### Outputs
- Security alerts (suspicious behavior detected).
- Logs and reports (what happened, when, and why it is risky).
- A dashboard view (charts, maps, and summaries for analysts).

## End-to-End Process (High Level)

### Stage 1: Vulnerable Website (VulnWeb)

**Meaning:** A deliberately insecure web application that generates realistic events.

**Purpose:** Create real-looking traffic and attack patterns to study and detect.

**Key output:** Web activity logs and vulnerable interactions.

### Stage 2: Traffic Capture and Proxy Layer

**Meaning:** The system collects network traffic flowing to and from the website.

**Purpose:** Observe what users and attackers are doing without changing the behavior.

**Key output:** Raw traffic data for analysis.

### Stage 3: Agent and Detection Services (Blue Teaming)

**Meaning:** Services that process the captured traffic and decide what looks risky.

**Purpose:** Convert raw traffic into meaningful security events.

**Key output:** Alerts, classified events, and detection results.

### Stage 4: Machine Learning Detector

**Meaning:** A model that helps classify traffic as normal or suspicious.

**Purpose:** Improve detection accuracy and handle complex patterns.

**Key output:** Risk scores or threat labels.

### Stage 5: SOC Dashboard (Frontend)

**Meaning:** A user interface that summarizes alerts and shows system status.

**Purpose:** Help analysts quickly see what is happening and investigate.

**Key output:** Visual reports, charts, and summaries.

## Example Scenario (Explained to a Judge)

Imagine a training lab where students learn to defend a company website.

1. A student uses the website normally (browsing, adding items to a cart).
2. Another student tries a known attack (like typing a malicious input).
3. The system records all traffic and recognizes that the input looks dangerous.
4. The detection service labels it as suspicious and creates an alert.
5. The dashboard shows the alert on a timeline and highlights the source.

So the judge can see that the system:
- Creates realistic activity
- Detects risky behavior
- Presents results in a way that a security analyst can understand

## What Each Phase Means in Simple Terms

- **VulnWeb**: The practice target (intentionally weak).
- **Traffic capture**: The observer (records everything).
- **Agent**: The analyst (turns raw data into events).
- **ML detector**: The assistant (adds smarter judgment).
- **Dashboard**: The report card (summarizes and explains).

## Summary

This project is an end-to-end security training pipeline. It simulates attacks, detects them, and explains them in a dashboard. The goal is to teach and demonstrate how real-world monitoring and response works.
