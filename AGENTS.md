### Git workflow

Follow this until the user says otherwise. It replaces opening a pull request or pushing at the end of a turn.

- Do not open, update, or merge a pull request unless the user explicitly asks for one.
- Commit on local `master`. Leave every commit on this machine. Do not push until the user has checked the change on localhost and says "push".
- "push" ends the iteration. Squash every local commit that is not yet on `origin/master` into one commit, write a message that covers that whole iteration, then push that one commit to `master`. Do not force-push.
- The user edits this workspace from their local machine and may leave those edits uncommitted. Before starting a new round of work, and again before the squash-and-push, check the working tree. If those edits are uncommitted, commit them first with a message that describes them, then continue.



### Local review

Open the page: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

That address serves this checkout (`/workspace`). Use it for review. Saved edits to `index.html`, `assets/styles.css`, and `assets/app.js` show up on refresh.

If the address does not load, start the server once from `/workspace`:

```
python3 tools/local-server.py
```

That server sends `Cache-Control: no-cache`, so a normal reload picks up saved HTML, CSS, and JavaScript. Do not use `python3 -m http.server` for this page; it leaves the browser holding a stale stylesheet.

If port 8000 is already serving this checkout, leave that process running. Do not start a second one.

### Page files

This site is one static page. Spec and Topology both live in `index.html` (`#tab-spec`, `#tab-topology`). Behaviour stays in `assets/app.js`; chrome and drawing styles stay in `assets/styles.css`.

### Verifying edits

For wording, names, links, or other copy changes, verify by reading the file and fetching [http://127.0.0.1:8000/](http://127.0.0.1:8000/), then checking that the expected strings are present. Do not take browser screenshots or screen recordings for those edits.

Open the page in a browser only when layout, styling, navigation, or another interaction changed.

### Contents navigation

The Spec Contents list includes document levels 1 and 2 only: the numbered `h2` sections, and their `h3` subsections numbered like 2.1. Deeper headings stay on the page and are not added to the contents list. Do not raise that depth unless asked.

Every Spec `h2` / `h3` / `h4` gets a URL fragment from its current outline number (for example `#1.1.1`). Recompute those ids from the live heading text whenever the document changes. Do not keep alias maps, redirects, or other jump paths for retired hashes. Those body titles are clickable in-page tag refs to that live fragment. Body cross-references (`§1.3`, Topology, 见下方…) use the same live fragments via `a.page-ref`. In Spec body copy and UniFi store links, use the product-page Marketing Name shown above the SKU (for example `Pro XG 24 PoE`, not `Switch Pro XG 24 PoE` or `USW-Pro-XG-24-PoE`). Do not add category prefixes from the tab title or `og:title` (`Switch`, `Access Point`, `Camera`, `Access`, …). In device lists, that Marketing Name is the link, with the gray SKU underneath.

Keep enough bottom padding on the Spec article that the last Contents target can reach the reading line under the masthead. Without that room, the pane ends first and the last item never becomes active.

### Topology drawing

The on-screen SVG and the exported sheet are one drawing. Do not fix a screen rule by bending a cable, or fix a PDF rule by shifting only the export.

**Export Blueprint**

- Topology only. Keep the control in the Topology toolbar outside `#topo-canvas`. Do not put it in the global masthead or on the Spec tab.
- Export clones the on-screen topology stage; do not change the drawing to make the button fit.

**Cables**

- One straight segment. Horizontal or vertical. No diagonals, elbows, or polylines.
- Both ends meet the painted centres of the two ports. Those ports must already sit on the same horizontal or vertical line. Move a port to make that true. Do not route around it.
- Draw cable endpoints on the page pixel grid. The browser snaps painted port chips to whole pixels and leaves SVG coordinates fractional, so an unrounded endpoint lands off the chip.

**Ports**

- Every port chip is the same rounded square, in the diagram, the legend, and the Spec document. Inner labels use one type size.

**Frames and rules**

- One weight for every line: the device frame. That includes cables, port borders, device frames, group frames, group dividers, the XG divider, and the device-power divider. On the sheet that weight is 0.75pt.
- Do not use CSS borders for anything that participates in topology layout. On a 150% display the browser floors a 1px border to one device pixel, then prints it at a full pixel, and stacked frames drift the ports off the cables. Draw frames with outlines, or with borders on elements that are out of flow.
- A VLAN device uses that VLAN's saturated colour for the frame and the matching low-saturation fill, the same pairing as the VLAN legend. A device with no VLAN keeps the grey frame and no fill.
- Hover does not change the frame colour. Add a halo outside the frame. Devices, devices inside a group, and legend cards all use that hover.
- A device group is a dashed rectangle, all four sides, at the same weight. Inside it, the vertical rule and the horizontal rules between location rows are dashed and the same weight.
- The rule above "Device Power" is solid, the same weight, and only on a device that outputs PoE. Media Room Flex is PoE input only and does not have that rule. The XG divider is solid and the same weight.

**Legend**

- Draw the legend into the topology SVG, in the empty upper right. No sidebar, and do not put it in the Spec document.
- Two equal-width columns. Tops align with NAH. No "Legend" heading.
- Left column is PORTS. Right column is CABLES above VLANS.
- Each card has its own border and the same inner padding.

**Alignment**

- Centre the drawing on the topology page.
- Close every fanout on its subtree. The XG frame, the deepest box of the left subtree, and the deepest box of the right subtree share one bottom edge. Nested fanouts, including Flex and the Powerwall leader, follow the same rule.

**PoE labels**

- For a powered device, the denominator is the minimum of its own PoE port class and the upstream port's supply class.
- A device that outputs PoE is labelled "PoE Output Used". The numerator is downstream output only, not the device's own consumption. Garage Flex is the model. A Door Mini's denominator is 45W, its datasheet aggregate maximum.
- A PoE-input-only device stays "PoE Power Used".
- The XG and Garage Flex budget bars are switch output budgets, not per-port limits.

**Sheet**

- Export Blueprint writes Arch C landscape at 1:1. Do not scale the drawing to fit the page.
- Title is HOME NETWORK. Subtitle is Physical Topology. Put that metadata in the empty upper left of the drawing. The sheet has only its outer border.
- The page margin, sheet size, sheet padding, and drawing origin are whole CSS pixels, so the cable grid and the painted port chips are the same grid.

