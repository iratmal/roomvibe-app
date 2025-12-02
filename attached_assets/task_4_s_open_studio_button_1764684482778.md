# Task 4.S — Add “Open Studio” Button to All Dashboards (Option A — Primary Button at Top)

**Goal**  
Add a prominent **“Open Studio”** primary button at the top of all dashboards (Artist, Designer, Gallery) to ensure clear navigation into the core RoomVibe experience and maximize user engagement.

---

## Scope

### 1. Add Primary CTA Button
For each dashboard:
- **Artist Dashboard**
- **Designer Dashboard**
- **Gallery Dashboard**

Add a visually prominent primary button at the top of the dashboard UI:

```
[ Open Studio ]
```

### 2. Button Behavior
- On click → redirect user to:
```
/studio
```
- No additional logic required.
- Must work for all plans (Free, Artist, Designer, Gallery).

### 3. Styling Requirements
- Use **primary button styling** already defined in the design system (same class as major CTAs).
- Full width on mobile, standard width on desktop.
- Icon optional, but if used: a minimal 🎨 or brush icon.
- Spacing:
  - Place the button at the **very top of the dashboard content**, above any cards or sections.
  - Add consistent vertical spacing (margin-bottom) according to existing UI scale.

### 4. Implementation Notes
- Reuse existing button components (e.g., `<Button>` if available).
- Do NOT modify dashboard layout structure beyond adding the button.
- Ensure button does not shift layout or break responsive structure.
- Ensure no duplication with potential existing links.

---

## Stop Condition
- All three dashboards (Artist, Designer, Gallery) show a clearly visible **“Open Studio”** button at the top.
- Clicking the button reliably redirects to `/studio`.
- Button styling matches other primary CTAs in the app.
- No layout issues introduced on desktop or mobile.
- Button works regardless of the user’s subscription plan.

---

## Notes
- This is a simple UI addition — do not refactor dashboard architecture.
- If dashboards share a common layout component, implement the button once and reuse it.
