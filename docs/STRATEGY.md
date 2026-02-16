# FleetReq - Strategy & Branding Reference

> Archived from CLAUDE.md. Strategic planning content not needed for daily development.

---

## Target Market - Dual Funnel

**Primary (Volume)**: Families & consumers → Free → Personal ($4/mo)
- Market: 100M+ potential US users

**Secondary (Revenue)**: Small contractors (5-15 vehicles) → Free → Business ($12/vehicle/mo)
- Market: 6M small businesses with commercial vehicles
- Position: 65% below competitors ($25-45/vehicle)

---

## Freemium Conversion Strategy

**Why tiers prevent account sharing:**
- Free: Useful (basic tracking) but limited (no warnings, no custom schedules)
- Personal: Families need yellow warnings → upgrade pressure
- Business: Contractors need receipts, team access, tax reports → essential

**Upgrade triggers:**
- Free → Personal: Yellow 🟡 maintenance warnings, custom service dates, data export
- Personal → Business: Team collaboration, unlimited receipts, IRS-compliant reports, custom intervals

---

## Mobile Strategy (Phase 2: 6-12 months)

**PWA first** (current priority), native apps after PMF proof.

**Free App** (Hook): View vehicles, status indicators, basic notifications, add fuel
**Strategic limitations**: No maintenance logging, no detailed alerts, limited history (30 days)

**Personal**: Full maintenance logging, detailed notifications, photo attachments
**Business**: Team notifications, GPS mileage, offline sync, role-based permissions

**Build native when**: >60% mobile usage, $10k+ MRR, App Store visibility critical
**Cost**: ~$30k, 3 months (React Native or Flutter)

---

## Competitive Analysis

**Our strengths**: Fuel tracking + MPG charts, preventive maintenance (8 types), tax mileage (IRS), team collaboration, 65% below market

**Market position**: "Maintenance + Tax Specialist" — 65% cheaper with 40% of features

**Future pipeline (High priority, 3-6 months)**:
- Photo/receipt upload (Free: none, Personal: 50MB, Business: unlimited)
- Data export (Personal: CSV, Business: CSV+PDF+JSON)
- OCR auto-extract (Business: AI receipt scanning)

**Future pipeline (Medium priority, 6-12 months)**:
- GPS tracking, route optimization, driver behavior
- Fuel card integration, digital work orders
- QuickBooks integration, predictive maintenance (AI)

---

## Domain & Branding

### Selected: FleetReq
- **Primary**: fleetreq.app (available on Namecheap)
- **Alt**: fleetreq.com (available)
- Concept: Fleet Requests + Fleet Records
- Status: Hold registration until launch

### Naming Challenge (Deprioritized)
- FleetReq works for B2B but alienates consumer market
- Not critical for launch; consider rebrand if mobile requires consumer appeal

### Other Options Researched

| Name | B2B | Consumer | Professional |
|------|-----|----------|--------------|
| FleetReq | Strong | Weak | Yes |
| FleetSync | Strong | Good | Yes |
| AutoDock | Good | Good | Yes |
| CarDock | Neutral | Strong | Good |
| KarDock | Weak | Strong | Casual |
| VehicleDock | Strong | Weak | Yes |

**By strategy**: B2B-first → FleetReq/VehicleDock · Consumer-first → AutoDock/CarDock · Balanced → AutoDock/FleetSync

Also explored: KarKeep (rhymes, catchy), KarLog (short, clear), KarVault (security focus) — all "K" spelling concerns.
