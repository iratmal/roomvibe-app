# Task 4.6 — Upgrade Nudges & Success Modal

**Goal**  
Add subtle upgrade encouragement inside the Studio experience using:  
- a **Success Modal** shown after exports,  
- **Upgrade Nudges** (small, non-intrusive upsell hints),  
to increase conversions without disrupting workflow.

---

## Scope

### 1. Success Modal After Export
Trigger this modal **only for Free and Basic plans** after completing an export (low-res export for Free, normal export for Basic):

**Modal requirements:**
- Title: **“Your export is ready!”**
- Message (Free plan):  
  “Upgrade to unlock high‑resolution exports, PDF export, and premium features.”
- Message (Basic plan):  
  “Upgrade to Pro to unlock all premium rooms, full branding control, and high‑end tools.”
- Buttons:
  - **Upgrade Plan** → opens existing pricing/upgrade modal
  - **Close** → returns to Studio
- Design:  
  clean, minimal, same modal style as existing upgrade modal.

### 2. Small Upgrade Nudges Inside Studio
Add **subtle upgrade prompts** in non-blocking places:

#### Free Plan:
- Under artwork tools:  
  small text link → “Unlock high‑res export → Upgrade”
- Under room selector:  
  small badge on Premium Rooms → “Pro”
- Near resize/crop panel:  
  a subtle hint → “Advanced editing tools available in Pro”

#### Basic Plan:
- In Premium Rooms section:  
  subtle label → “Unlock all premium rooms → Upgrade to Pro”
- Next to Export section:  
  “PDF exports and full‑resolution available in Pro”

**Rules:**
- Must be subtle, not intrusive  
- Should not block any actions  
- All upgrade prompts open the existing upgrade modal

### 3. Success Modal Trigger Points
Implement modal trigger after:
- Image export completes (Free + Basic only)
- PDF export attempts on Free → show upgrade modal instead of exporting
- Optional: after user uploads first artwork → small celebratory modal encouraging upgrade (but NOT required)

Trigger must **not** appear for Pro users.

### 4. Reuse Existing Upgrade Modal
- Do not create a new upgrade flow  
- Reuse the existing modal component and styling  
- Only change text + call-to-action destination

---

## Stop Condition
- Success Modal appears correctly for Free & Basic exports  
- Upgrade Nudges show in correct places without interfering with workflow  
- All upgrade buttons open the existing pricing/upgrade modal  
- Pro users see **no** upgrade messages  
- No regressions in Studio export, artwork editing, or room switching

---

## Notes
- Keep nudges subtle; avoid aggressive upsell behavior  
- Use existing design components wherever possible  
- If UI placement conflicts arise, choose the simplest layout  
