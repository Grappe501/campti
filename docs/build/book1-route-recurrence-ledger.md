# Book 1 Route Recurrence Ledger

Source model: `RouteRecurrenceLedger` in `lib/domain/chapter-composition.ts`.

## Major Red River Route Locations

```json
{
  "artifact": "book_route_recurrence_ledger",
  "currentBookId": "book1",
  "rows": [
    {
      "locationId": "natchitoches",
      "locationName": "Natchitoches",
      "directPresenceCount": 2,
      "indirectPresenceCount": 1,
      "recurrenceSatisfied": true,
      "appearanceModesUsed": ["direct_scene_setting", "remembered_place"]
    },
    {
      "locationId": "alexandria-portage",
      "locationName": "Alexandria Portage",
      "directPresenceCount": 0,
      "indirectPresenceCount": 1,
      "recurrenceSatisfied": true,
      "appearanceModesUsed": ["route_linkage"]
    },
    {
      "locationId": "atchafalaya-fork",
      "locationName": "Atchafalaya Fork",
      "directPresenceCount": 0,
      "indirectPresenceCount": 0,
      "recurrenceSatisfied": false,
      "appearanceModesUsed": []
    },
    {
      "locationId": "lower-river-market",
      "locationName": "Lower River Market",
      "directPresenceCount": 1,
      "indirectPresenceCount": 2,
      "recurrenceSatisfied": true,
      "appearanceModesUsed": ["direct_scene_setting", "rumor_report", "trade_goods_origin_destination"]
    }
  ]
}
```

## Enforcement Rule

Each major route location requires at least one meaningful direct or indirect presence in each book. Missing rows produce enforcement warnings and composition bias toward route/setting roles in subsequent chapter plans.
