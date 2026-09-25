---
author: 
id: J_56
internalId: da8a9e63-eeee-4911-a83c-5f1f9a38d911
title: diagram improvements 3
status: design
owner: 
affects:
agents:
  - design/activity/card__da8a9e63-eeee-4911-a83c-5f1f9a38d911.json
policy:
---
* when working with the add tool:
  * in desktop mode, when the mouse hovers over the diagram area, we show a node that can be inserted. this is ok, however, it is not in the correct position, it does not do a transformation I think to local coordinates. the node is always below to the left,
  * when user presses 'esc' 'add tool' should switch to 'select diagram objects'
* when using the 'select diagram objects' tool, we can now select multiple items, we can drag them around. it is however not obvious that they are selected. When a single item is selected, we draw resize grips round the node. We should do the same when multiple objects are selected; so 1 selection box that is around all selected objects.
* When an error is shown or a warning, the zoom sliders are still over the popover. this is no good. they should not be on top of everything.
* tried to add a second new diagram, got warning that current diagram would be discarded. this makes no sense
* no way to save the diagram. diagrams should follow the same save method as cards: put them on the commit-batcher.
* when we change the title of the diagram, it does not appear to update the label in the bread crumbs, so most likely also not the filename. this is wrong.
* for mindmaps: when creating a new diagram, the 'add tool' should have the 'root' already selected. once the root is placed, it should automatically go to 'topic'
* the label is editable, this is good, but it is not centered and has a white background. it should be transparent and centered.
* the breadcrumbs are overlapping the title&#x20;
  * the div with aria label 'new diagram editor', give it a padding-bottom of 16px