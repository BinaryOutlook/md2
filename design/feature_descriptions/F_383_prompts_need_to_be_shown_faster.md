---
author: 
id: F_383
internalId: c0629e16-a603-4a9c-b19d-5c7cac9772ec
title: Prompts need to be shown faster
status: design
owner: 
affects:
agents:
  - design/activity/card__c0629e16-a603-4a9c-b19d-5c7cac9772ec.json
policy:
after: 2775052a-2e84-4466-a320-155c8ec05bac
---
We generated a squence diagram (json file), of the action popup and its interactions. There, you can see that input sent by the user to the agent, first goes to backend and back to frontend before it is shown in the chatlog. This is too late.

How it should work:&#x20;

* User sends input
* Prompt is immediatly shown in chatlog, but as an ´in transmission´ text.
* Once the frontend gets the prompt back from backend, we show text as we do now, sent.