# TrueQR — The QR Destination Safety Assistant

> **Scan. Inspect. Decide.**  
> *Understand suspicious QR destinations before opening them.*

---

## 1. Project Overview

**TrueQR** is a cybersecurity web application designed to eliminate the danger of blind QR navigation ("quishing" / QR phishing). 

When users scan a QR code on a physical poster, restaurant table, parking meter, or flyer, traditional camera apps automatically open the encoded destination. Attackers exploit this blind spot using deceptive subdomains (`login.paypal.com.verify-billing.site`), userinfo confusion (`https://paypal.com@attacker.com`), unencrypted HTTP links, raw IP hosts, and sticker-over-sticker tampering.

**TrueQR adds an understandable safety checkpoint between scanning a QR code and opening its destination.**

The application decodes the destination locally, runs deterministic heuristic security analysis, calculates an explainable risk score (0–100), classifies the risk into **LOW RISK**, **SUSPICIOUS**, or **HIGH RISK**, and enforces an explicit user confirmation barrier before any external link is opened.

---

## 2. Key Features

- **Device Camera Scanner**: Real-time camera scanning using the device camera (prefers rear camera on mobile) with custom viewfinder reticles, active laser animation, camera flip control, and strict media track cleanup on unmount.
- **Client-Side Image Upload**: Drag-and-drop or file picker for PNG, JPEG, WebP, and BMP images up to 10MB. Decoded 100% in-browser using `jsQR` with zero video or image leaks to remote servers.
- **Manual URL & Payload Inspection**: Direct entry of URLs or QR payloads with an **Expected Reference Domain** check to detect sticker-swapping attacks (e.g., expecting `chase.com` but finding `fake-chase-portal.com`).
- **Offline & Non-Web Payload Support**: Safely identifies Wi-Fi configuration strings (`WIFI:S:...`), vCards, plain text notes, telephone numbers, and email links without treating them as web URLs.
- **Explainable Heuristic Risk Engine**: Evaluates 14+ distinct structural signals without black-box AI:
  1. *Transport Encryption*: HTTP vs. HTTPS
  2. *URL Shortener Concealment*: Known shortening services (bit.ly, tinyurl, etc.)
  3. *Raw IP Host*: Direct IPv4 and IPv6 numerical hosts
  4. *Look-alike Characters*: Punycode (`xn--`) and internationalized homoglyphs
  5. *Brand Impersonation*: Monitored high-value brands in subdomains
  6. *RFC 3986 Userinfo Confusion*: Deceptive embedded credentials (`brand.com@evil.com`)
  7. *Excessive Subdomain Depth*: Deeply nested subdomain chains
  8. *Destination Mismatch*: Discrepancy between user-expected domain and parsed host
  9. *Dangerous Protocols*: Blocking dangerous schemes (`javascript:`, `data:`, `file:`)
  10. *High-Abuse TLDs*: Low-reputation short-lived domain extensions
  11. *Chained Redirect Queries*: Open redirect parameter targets
  12. *Non-Standard Ports*: Unusual ports outside 80 and 443
  13. *Excessive Payload Length*: Obfuscated query buffers and nested tokens
- **Safety Confirmation Barrier**: Never automatically opens scanned links. High-risk and suspicious destinations trigger an explicit confirmation barrier requiring user acknowledgment of specific risk factors before proceeding.
- **Persistent Scan History**: SQLite persistence with search by hostname or URL, risk filtering, chronological sorting, single-item deletion, clear-all protection, and JSON/CSV export.
- **Suspicious Destination Reporting**: Community threat reporting workflow with threat category classification (phishing, impersonation, redirect, malware, scam), notes, and duplicate submission throttling.
- **Hackathon Demonstration Mode**: 10 curated test scenarios (Wikipedia Safe, Insecure HTTP, Bit.ly Shortener, Raw IP Host, Punycode Homoglyph, Paypal Subdomain Spoof, Userinfo @ Spoof, Mismatch Quishing, Dangerous JS, and Offline Wi-Fi) with one-click analysis for evaluators and judges.
- **Privacy & Safety Safeguards**: Sanitizes sensitive query tokens (tokens, auth, keys, passwords) prior to persistent logging; zero third-party advertising cookies or tracking pixels.

---

## 3. Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Tooling**: Vite 8
- **Styling**: Tailwind CSS v4 + Custom Cyber Glassmorphism & Laser Animations
- **Icons**: Lucide React
- **QR Decoding**: `jsQR` (client-side canvas image decoding)

### Backend
- **Framework**: Python 3.10+ with FastAPI
- **Data Validation**: Pydantic v2
- **Database**: SQLite with SQLAlchemy ORM
- **Testing**: Pytest & Pytest-Asyncio (17 automated unit and integration tests)
- **Server**: Uvicorn ASGI

---

## 4. Architecture Overview

```
                      ┌───────────────────────────────────────┐
                      │            User Interface             │
                      │   (React 19, TypeScript, Tailwind)    │
                      └──────────────────┬────────────────────┘
                                         │
             ┌───────────────────────────┴──────────────────────────┐
             ▼                                                      ▼
┌─────────────────────────┐                            ┌─────────────────────────┐
│     Client Scanner      │                            │  Heuristic Risk Engine  │
│  • WebRTC Camera Stream │                            │  • 14+ Heuristic Rules  │
│  • jsQR Canvas Decoder  │                            │  • Explainable Scoring  │
│  • Drag-and-Drop Upload │                            │  • Threshold Bucketing  │
└────────────┬────────────┘                            └────────────▲────────────┘
             │                                                      │
             └───────────────────────┬──────────────────────────────┘
                                     │ REST API (/api/analyze)
                                     ▼
                      ┌───────────────────────────────────────┐
                      │           FastAPI Backend             │
                      │  • /api/health     • /api/history     │
                      │  • /api/analyze    • /api/reports     │
                      └──────────────────┬────────────────────┘
                                         │
                                         ▼
                      ┌───────────────────────────────────────┐
                      │            SQLite Database            │
                      │  • ScanRecord (Sanitized Storage)     │
                      │  • ReportRecord (Deduplicated Logs)   │
                      └───────────────────────────────────────┘
```

---

## 5. Prerequisites

- **Python**: Version 3.10 or higher (`python --version`)
- **Node.js**: Version 18 or higher (`node -v`)
- **npm**: Version 9 or higher (`npm.cmd -v` on Windows)

---

## 6. Installation & Setup

### Step 1: Clone or Navigate to the Workspace
```bash
cd c:\Jarvis
```

### Step 2: Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
```

### Step 3: Frontend Setup
```bash
cd ../frontend
npm install
```

---

## 7. Running the Application

### Option A: One-Click Startup (Windows)
Double-click `start.bat` or run:
```cmd
start.bat
```

### Option B: Manual Startup

**Terminal 1 — Backend (FastAPI)**:
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*API will be active at `http://127.0.0.1:8000` (Interactive Swagger docs at `http://127.0.0.1:8000/docs`).*

**Terminal 2 — Frontend (Vite)**:
```bash
cd frontend
npm run dev
```
*Web application will be accessible at `http://localhost:5173`.*

---

## 8. Camera Permission & Security Context

Browser security standards (`getUserMedia`) require a **secure origin**:
- `http://localhost:5173` or `http://127.0.0.1:5173` (treated as secure by modern browsers)
- `https://...` in production environments

When opening the **Camera Scan** tab:
1. Click **"Start Camera"** / **"Launch Camera"**.
2. Grant camera permissions in the browser prompt.
3. On mobile devices, TrueQR automatically requests the environment (rear) camera. You can toggle between front and rear cameras using the **Flip** button.
4. When finished, clicking **Stop** or navigating away immediately shuts down all hardware camera tracks.

---

## 9. API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns service health status and engine version. |
| `POST` | `/api/analyze` | Accepts payload and optional reference domain; returns score, category, signals, and explanations. |
| `GET` | `/api/history` | Returns paginated scan history with search query and risk category filters. |
| `GET` | `/api/history/stats` | Aggregated statistics: total scans, low risk count, suspicious count, high risk count. |
| `GET` | `/api/history/{id}` | Full inspection details and untriggered checks for a single stored scan. |
| `DELETE` | `/api/history/{id}` | Deletes a single scan record. |
| `DELETE` | `/api/history` | Clears all stored scan records. |
| `GET` | `/api/history/export` | Exports history records as `json` or `csv`. |
| `POST` | `/api/reports` | Validates and saves a suspicious URL report with duplicate throttling. |
| `GET` | `/api/reports` | Lists submitted suspicious destination reports. |
| `DELETE` | `/api/reports/{id}` | Deletes a report record. |

---

## 10. Automated Testing

### Backend Unit & Integration Tests
Run the 17-test Pytest suite:
```bash
cd backend
python -m pytest tests/ -v
```

Tests cover:
- Valid HTTPS destination (transport TLS passing)
- Unencrypted HTTP warnings
- Dangerous URI schemes (`javascript:`, `data:`, `file:`)
- RFC 3986 userinfo confusion attack (`paypal.com@evil.com`)
- Direct numerical IPv4 and IPv6 hosts
- Masked URL shortener detection (`bit.ly`)
- Punycode and IDN homoglyph lookalikes (`xn--pple-43d.com`)
- Brand impersonation in subdomains (`login.paypal.com.verify-billing.site`)
- User expected destination mismatch quishing detection
- Non-standard port warnings
- Chained redirect query parameters
- Offline non-web payloads (Wi-Fi network configuration, plain text)
- API integration workflow (analyze, stats, filter, delete, clear, report deduplication)

### Frontend Production Build Test
Verify TypeScript compilation and asset bundling:
```bash
cd frontend
npm run build
```

---

## 11. Hackathon Demonstration Scenarios

To demonstrate TrueQR without scanning a physical QR code:
1. Open `http://localhost:5173`.
2. Click on the **"Demo Mode"** tab in the navigation header.
3. Select any of the 10 real-world scenarios:
   - **Legitimate HTTPS**: Wikipedia (0 Risk Score, Low Risk)
   - **Unencrypted HTTP**: Cleartext transport warning
   - **URL Shortener**: Masked destination warning (`bit.ly`)
   - **Raw IP Host**: Numerical address warning (`192.168.1.100`)
   - **Punycode Spoof**: Cyrillic homoglyph domain (`xn--pple-43d.com`)
   - **Brand Impersonation**: Paypal subdomain spoof (`login.paypal.com.verify-billing.site`)
   - **Userinfo Deception**: RFC 3986 `@` trick (`paypal.com@verify-account-security.site`)
   - **Destination Mismatch**: Physical sticker swap quishing test
   - **Dangerous Scheme**: Script execution blocked (`javascript:alert(1)`)
   - **Offline Wi-Fi**: Offline configuration payload
4. Click **"Execute Real Heuristic Analysis"** to see the exact breakdown of triggered warnings, score gauge, and safety barrier modal.

---

## 12. Security Limitations & Roadmap

### Honest Security Disclaimers
- **Heuristic Scoring is NOT AI**: TrueQR uses transparent, deterministic rules based on RFC standards and known phishing indicators.
- **Absence of Warning != Proof of Safety**: A **LOW RISK** verdict indicates that no obvious structural red flags were found in the URL. It does not guarantee that a site has not been compromised or that it does not host zero-day malware.
- **No SSRF / Remote Fetching**: TrueQR intentionally does not fetch or execute destination web content on the server to prevent turning the service into a Server-Side Request Forgery (SSRF) proxy.

### Roadmap (Planned Capabilities)
- [x] Deterministic heuristic structural inspection
- [x] Local SQLite persistence and privacy sanitization
- [x] Client-side image and camera decoding
- [x] Interactive demonstration mode for judges
- [ ] Centralized multi-tenant threat intelligence sync *(Planned)*
- [ ] Isolated headless browser visual preview sandbox behind egress firewall *(Planned)*
- [ ] Enterprise QR code asset inventory and batch validation *(Planned)*

---

## 13. License

Created for the TrueQR Hackathon. Released under the MIT License.
