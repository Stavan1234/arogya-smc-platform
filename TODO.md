# Arogya Platform Task Tracker
## Previous Task: /dashboard ✅ Complete

## Current Task: Update /dashboard/surveillance - EPI Curve + Time Slider

### Steps to Complete:
- [x] 1. Analyze files ✅
- [ ] 2. Update TODO.md ✅ (This file)
- [ ] 3. Create `app/api/dashboard/epi-curve/route.ts` (timeseries: date → {Dengue, Malaria, Fever, Diarrhea, Cholera})
- [ ] 4. Create `components/dashboard/EpiCurveChart.tsx` (Recharts stacked BarChart)
- [ ] 5. Edit `app/dashboard/surveillance/page.tsx`:
   - Add EPI data state/fetch (use epi-curve API w/ disease/span)
   - Replace S/P/L pie with EpiCurveChart (increase sidebar chart height)
   - Add Time Slider below map: Slider (1-30 days), Play/Pause; auto-advance daily in 7d/30d spans
- [ ] 6. Update types/index.ts (EpiData interface)
- [ ] 7. Test: `npm run dev`, /dashboard/surveillance → stacked bars by disease, slider animates map/chart
- [ ] 8. Update TODO.md progress
- [ ] 9. attempt_completion

**Notes:**
- Diseases: Dengue, Malaria, Fever, Diarrhea, Cholera
- Slider: 7d daily playback; integrates w/ existing span (24h static, 7d/30d animate)
- Recharts: Already used (import BarChart, Bar)

