---
author: 
id: F_388
internalId: 890d7f2c-90e4-4069-b408-1c01db9f7607
title: Stats 2 modes
status: design
owner: 
affects:
agents:
  - design/activity/card__890d7f2c-90e4-4069-b408-1c01db9f7607.json
policy:
---
The stats view currently already supports 2 view modes: tables and charts. Currently selection between the 2 is made based on screen size.

We need to change 2 things:

* Switch between mode should be possible from the stats menu: 2 icon buttons in group
* When on small screen, show bars in charts horizontally, so user can scroll down to see more values(phone format)