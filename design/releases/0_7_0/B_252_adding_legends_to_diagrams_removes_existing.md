---
author: 
id: B_252
internalId: fe110555-78f8-4085-a566-ec03d047a19d
title: Adding legends to diagrams removes existing
status: ready
owner: 
affects:
agents:
  - design/releases/0_7_0/card__fe110555-78f8-4085-a566-ec03d047a19d.json
policy:
changedFiles:
  - app/src/components/diagram_view/legend/diagram_legend_details_editor.test.tsx
  - app/src/components/diagram_view/legend/diagram_legend_details_editor.tsx
  - app/src/services/diagrams/diagram_data.node.test.ts
  - app/src/services/diagrams/diagram_edit_session_service.test.ts
  - app/src/services/diagrams/diagram_edit_session_service.ts
  - app/src/services/diagrams/diagram_edit_validation.ts
  - shared/diagram_data.d.mts
  - shared/diagram_data.mjs
---

When adding a legend item to a legend that already has items, all existing items are removed. This is wrong.

We also need to simplify adding items. We already have a list of types. Show the select containing all unused types. Include checkbox to include used types. Show them in separate group in select. Label can be prefilled from type.

## Current state

When a diagram has no `meta.legend`, the New diagram legend is derived from its node roles and connection kinds. `DiagramLegendDetailsEditor` lists only explicit entries. Its type picker offers every role and connection kind absent from those explicit entries, including types already visible in the derived legend. On first add, `DiagramEditSessionService.addLegendEntry` creates `meta.legend` with only the new entry. Rendering then switches from derived entries to that explicit array, so the previously visible entries disappear. Adding to an already explicit legend appends and preserves its entries.

The picker has no used-type group or checkbox. Its separate label field starts empty; the service uses the selected type name only when that field stays blank. The diagram format permits one legend entry per node role or connection kind, and restricts connection kinds by diagram type.

## Implementation details

* Before the first add to a derived legend, copy its displayed node roles and connection kinds, with their labels and order, into `meta.legend`; append the new entry without removing those copies. Keep an already explicit legend and its custom labels and order intact.
* Define a used type as a node role or connection kind present on the diagram and therefore displayed in its derived legend. Show unused types in the picker by default. An `Include used types` checkbox reveals used types in a separate labeled group. Keep the picker in sync when diagram nodes, connections, or legend entries change.
* Prefill the editable label field from the selected type name. Let users change that label before applying it. Continue to validate type, label, uniqueness, and diagram-type compatibility through the existing service and parser.
* Cover first add to a derived legend, add to an explicit legend, picker grouping and checkbox, label prefill and edit, duplicate handling, and saved output with focused service and UI tests.

## Acceptance criteria

* Adding a new type to a legend derived from nodes and connections leaves every previously displayed entry visible, with its label and order preserved; the new entry appears after them and persists on save and reload.
* Adding to an explicit legend preserves its existing entries, custom labels, and order.
* Picker initially lists unused types. Checking `Include used types` also shows diagram-used types in a separate labeled group; unchecking it hides that group.
* Selecting a type fills the label field with its name; users can edit that label before saving.
* Resulting legend has no duplicate role or connection-kind entries and uses only connection kinds valid for the diagram type. Relevant focused tests pass.
