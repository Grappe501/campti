# Progress Bar Formula

Canon status: PROPOSED

Bar width: **20** blocks.

Filled blocks = `round(score / 5)` (nearest step on a 0–100 scale in 5-point increments).

Example:

Score **70**:

70 / 5 = **14** filled blocks

`[██████████████░░░░░░] 70%`

Score **85**:

85 / 5 = **17** filled blocks

`[█████████████████░░░] 85%`

Score **0**:

`[░░░░░░░░░░░░░░░░░░░░] 0%`

Score **100**:

`[████████████████████] 100%`

## Quick reference

| Score | Filled blocks |
|---:|---:|
| 0 | 0 |
| 10 | 2 |
| 15 | 3 |
| 20 | 4 |
| 25 | 5 |
| 30 | 6 |
| 40 | 8 |
| 55 | 11 |
| 60 | 12 |
| 70 | 14 |
| 75 | 15 |
| 80 | 16 |
| 85 | 17 |
| 90 | 18 |
| 95 | 19 |
| 100 | 20 |
