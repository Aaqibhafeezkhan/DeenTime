# Prayer-time engine validation

The prayer-time engine is deterministic for a supplied date, coordinate pair, timezone, calculation method, Asr shadow factor, and output format.

## Regression coverage

Run the phase 2 regression suite from the repository root:

```text
node tests/praytimes.test.js
```

The suite verifies:

- finite prayer-time values for representative Mumbai coordinates
- Standard and Hanafi Asr calculations produce distinct results
- Hanafi Asr occurs later than Standard Asr for the representative inputs
- 12-hour formatting remains `HH:MM AM/PM`
- all currently supported calculation methods produce finite daily values

## Engine assumptions

- Coordinates are supplied as latitude/longitude in decimal degrees.
- Timezone is supplied as an hours offset from UTC by the caller.
- The existing astronomical calculation model remains intentionally lightweight and client-side.
- Calculation methods are configuration presets; local religious practice may use a different authoritative timetable or adjustment policy.
- The engine does not claim scholarly certification or replace local mosque or institutional prayer-time guidance.

Phase 3 will make location, timezone, and user calculation settings explicit at the application boundary and connect the selected madhab to the engine's Asr factor.
