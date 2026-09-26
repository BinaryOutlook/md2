---
author: 
id: F_386
internalId: 2b159c84-ea24-4b1c-9969-b0ddb00f3051
title: remove buttons from cards
status: ready for implementation
owner: 
affects:
agents:
  - design/activity/card__2b159c84-ea24-4b1c-9969-b0ddb00f3051.json
policy:
branch: f_386_remove_buttons_from_cards
worktree: 1
---
need to simplify the cards:

* remove `open in file mode`
* remove 'attach file' and all related functionality to attaching files in the card header. we will only support adding links in markdown

## Current state

Board cards show `Open in file mode` and `Attach files` buttons, plus matching card-menu commands (`project_card_view.tsx`). The card popup has another `Open in file mode` button (`card_body_popover.tsx`). Board file drops, the paperclip, and its menu command call `attachFilesToCard`, which writes paths to card-header `references`. Those references also feed agent prompts and archive/release asset moves. Markdown editor paperclips and file drops instead insert links in body text through `attachFilesToCardMarkdown`.

## implementation details

* Remove `Open in file mode` from board card buttons, card menu, and card popup footer. Remove their callbacks and now-unused wiring in `card_view.tsx` and `mobile_card_view.tsx`. Keep file mode itself and `Open in file explorer` available through their other entry points.
* Remove board card paperclip, attachment count, file input, menu command, and `references` subscription. Stop calling `attachFilesToCard`; no new board interaction writes card-header `references`.
* For a file dropped on a board card, reuse the Markdown attachment choice and copy/cleanup workflow. After choice succeeds, append generated link(s) to that card's latest body text, save the body, then show its popup with `showCardDetails` so an already-open popup stays open. Use image syntax for images and normal link syntax for other files. Cancel, read-only mode, or failure must leave body unchanged; failed insertion must clean up copied files. Keep external file drops separate from card reordering.
* Keep Markdown attachment controls in card body, list editor, new-card editor, and agent prompts. Preserve existing `references` frontmatter and its prompt/archive handling for cards already containing entries; this feature only stops creating new header references.
* Update affected card and popup tests for removed controls, board drop links, cancellation, failure cleanup, read-only behavior, and continued Markdown insertion.

## acceptance criteria

* Board card and card popup show no `Open in file mode` control; board card menu has no such command. Other file-mode navigation still works.
* Board card shows no header attachment button, count, or menu command. Dropping files appends Markdown links to that card's body and opens its popup after successful save; `references` gains no entries.
* Cancelled, failed, and read-only drops do not change card body or references. Copied files are cleaned up after failed insertion, and file drops do not reorder cards.
* Markdown editor attachment controls still insert file or image links. Existing header references still appear in agent prompts and still take part in archive/release moves.
