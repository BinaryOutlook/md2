---
author: 
id: F_335
internalId: 22e1a692-a35c-4fe0-a4ea-70545e3e6009
title: include cost per release
status: new
owner: 
affects:
agents:
policy:
after: 96236df6-2c3a-4846-9d52-f29b7ee9041d
---

we show the total token count usage in the status bar. when the user clicks on this, we show a popup with the token count divided over release versions and the current.

We should also include the cost of each release. we should pre-calculate this upon release and store so we don't need to recalculate this every time (value doesn't change anyway)