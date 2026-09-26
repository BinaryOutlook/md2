---
author: 
id: F_387
internalId: c10708f5-7df7-46ad-97f1-9bac7103e683
title: Improve diagrams 4
status: design
owner: 
affects:
agents:
  - design/activity/card__c10708f5-7df7-46ad-97f1-9bac7103e683.json
policy:
---

Things we need to improve/fix in diagrams:

* Subtitle should be below title. Both should be sticky, so overlap items on diagram.
* Items on the legend should be selectable, so that add tool can use the selected type. So the service responsible for adding items on the diagram asks the legend service which one is selected, checks if it can be applied to current tool, if so, apply.
* The size of the diagram should automatically expand, in all directions, when a node comes too close to the edge. Only expand in the direction of that edge.
* When drawing connections, the input boxes of the nodes prevent the accept. It should also work while mouse is over text part of node.