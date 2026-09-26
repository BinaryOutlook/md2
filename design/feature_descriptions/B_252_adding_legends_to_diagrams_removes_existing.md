---
author: 
id: B_252
internalId: fe110555-78f8-4085-a566-ec03d047a19d
title: Adding legends to diagrams removes existing
status: design
owner: 
affects:
agents:
  - design/activity/card__fe110555-78f8-4085-a566-ec03d047a19d.json
policy:
---

When adding a legend item to a legend that already has items, all existing items are removed. This is wrong.

We also need to simplify adding items. We already have a list of types. Show the select containing all unused types. Include checkbox to include used types. Show them in separate group in select. Label can be prefilled from type.