# **Arogya-SMC: Smart Public Health Management System**

Arogya-SMC is a modular public health intelligence platform designed for Solapur Municipal Corporation (SMC).
It enables **real-time health data collection, analytics-driven monitoring, and ward-level decision support** by integrating field reporting, hospital data, and municipal dashboards into a unified system.

---

# **System Overview**

The platform connects multiple stakeholders into a single pipeline:

**Field Data → API Processing → Analytics → Dashboard & Alerts**

Core capabilities:

* Field-level data collection (ASHA workers)
* Hospital capacity reporting
* Ward-level analytics and visualization
* Anomaly detection and outbreak forecasting
* Citizen-facing health information system

---

# **Architecture Components**

1. **ASHA Mobile App (Flutter)** – Offline-first data collection with geotagging
2. **Hospital Portal (React)** – Capacity and resource reporting
3. **Citizen App (Flutter)** – Advisories and facility access
4. **Command Dashboard (React + GIS)** – Ward-level analytics
5. **API Gateway (Node.js)** – Secure data routing
6. **Database (PostgreSQL + PostGIS)** – Central data storage
7. **Analytics Engine (Python)** – Anomaly detection and forecasting

---

# **Technology Stack**

* **Frontend:** Flutter, React, Next.js
* **Backend:** Node.js (TypeScript)
* **Database:** PostgreSQL + PostGIS
* **Analytics:** Python (pandas, NumPy, scikit-learn)
* **Visualization:** Leaflet, Recharts
* **Authentication & Notifications:** Firebase

---

# 🚀 **Quick Start (IMPORTANT FOR JUDGES)**

Follow these steps to run the system locally.

---

## **Step 1: Database Setup (USING .SQL FILE)**

1. Create a PostgreSQL database:

```sql
CREATE DATABASE arogya_smc;
```

2. Connect to the database and enable PostGIS:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

3. Import the provided SQL dump file:

```bash
psql -U postgres -d arogya_smc -f arogya_smc_full_database_dump.sql
```

👉 This will automatically create:

* tables
* schema
* sample data

---

## **Step 2: Run Backend & Dashboard**

```bash
npm install
npm run dev
```

This starts:

* API Gateway
* Command Dashboard
* Hospital Portal

---

## **Step 3: Run Analytics Engine**

```bash
cd analytics
pip install pandas numpy scikit-learn psycopg2
python run_all.py
```

This executes:

* anomaly detection (μ + 2σ threshold)
* outbreak forecasting (linear regression)
* resource demand prediction

---

## **Step 4: Run Mobile Apps (Optional)**

```bash
flutter pub get
flutter run
```

---

## **Network Configuration (for physical device)**

```bash
adb reverse tcp:3001 tcp:3001
```

API Base URL:

```text
http://localhost:3001/api
```

---

# ⚙️ **Environment Variables**

Create `.env.local`:

```env
JWT_SECRET=your_secret
NOTIFICATION_TRIGGER_SECRET=your_secret
FIREBASE_SERVICE_ACCOUNT={...}
```

Also configure database connection in backend (`lib/db.ts`).

---

# **Directory Structure**

```text
arogya-platform/
├── analytics/        # Python analytics engine
├── app/              # Next.js frontend + API
├── components/       # UI components
├── lib/              # DB + utilities
└── Scripts/          # Seed scripts
```

---

# **System Reproducibility**

This setup enables:

* End-to-end data flow
* Functional analytics execution
* Dashboard visualization
* Modular subsystem testing

---


