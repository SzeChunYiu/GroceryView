# Manual UX and accessibility checklist

Run this before release candidates that touch previews, drawers, bottom sheets, charts, maps, or ad placement.

## Previews, drawers, and bottom sheets

- [ ] Keyboard reachable: every trigger can be reached with Tab and activated with Enter or Space.
- [ ] Accessible heading/name: the dialog announces a visible heading through `aria-labelledby`.
- [ ] Close button: a visible Close control is reachable immediately after opening.
- [ ] Escape closes: pressing Escape dismisses the overlay.
- [ ] focus returns to trigger after close.
- [ ] No hover-only behavior: the same information is available by click/tap/keyboard.
- [ ] Background click closes only when it does not discard entered form data.

## Charts and maps

- [ ] Every chart or map has an `aria-label`.
- [ ] Every chart/map section includes a plain summary before or beside the visualization.
- [ ] Every chart/map has a table/list fallback with the same decision-critical values.
- [ ] Color is not the only signal: text labels, arrows, bands, or icons carry the state.
- [ ] Keyboard users can reach linked cells, markers, and fallback rows.

## Ads

- [ ] Every public ad slot label is exactly `Advertisement`.
- [ ] No ad appears on admin, account, privacy, auth, or sensitive pharmacy routes.
- [ ] Search ads appear only after result 12.
- [ ] Ads are separated from cards, tables, charts, and maps.
