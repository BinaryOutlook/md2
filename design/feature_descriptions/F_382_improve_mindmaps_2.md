---
author: 
id: F_382
internalId: cb27b171-7487-436d-ad9c-ed07ce7dd6f1
title: improve mindmaps 2
status: design
owner: 
affects:
agents:
  - design/activity/card__cb27b171-7487-436d-ad9c-ed07ce7dd6f1.json
policy:
after: 2775052a-2e84-4466-a320-155c8ec05bac
---
Things that need to be fixed/improved on the diagram editing in general and mind maps in particular:

* the select tool does not work:
  * on desktop, it draws a rectangle, but it is not transparent, user can't see what he is trying to select
  * after drawing a rectangle, nothing gets selected
  * what does work: clicking on a single item
  * on mobile, using touch does not work: user can not draw a selection box.
* on mobile: touch should be supported to zoom in and out. we should not show the zoom slider in the bottom left corner on mobile. only zoom with pinch touch move.