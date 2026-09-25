---
author: 
id: B_249
internalId: c8ca7e43-f909-4a9a-8bc4-3c3f1c305219
title: open project fixes
status: design
owner: 
affects:
agents:
  - design/activity/card__c8ca7e43-f909-4a9a-8bc4-3c3f1c305219.json
policy:
---

* when running in browser (not electron), don't show the repository - folder buttons, only repository is allowed.
* show message that local folders can't be opened from browser
* if no credentials available, show message to inform user we can't load repositories without auth token