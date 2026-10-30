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

This site is one static page. The spec lives in `index.html` (`#tab-spec`). The topology drawing is Appendix. Topology inside that spec. Behaviour stays in `assets/app.js`; chrome and drawing styles stay in `assets/styles.css`.

### Verifying edits

For wording, names, links, or other copy changes, verify by reading the file and fetching [http://127.0.0.1:8000/](http://127.0.0.1:8000/), then checking that the expected strings are present. Do not take browser screenshots or screen recordings for those edits.

Open the page in a browser only when layout, styling, navigation, or another interaction changed.

### Contents navigation

The Spec Contents list includes document levels 1 and 2 only: the numbered `h2` sections, and their `h3` subsections numbered like 2.1. Deeper headings stay on the page and are not added to the contents list. Do not raise that depth unless asked.

Every Spec `h2` / `h3` / `h4` gets a URL fragment from its current outline number (for example `#1.1.1`). Recompute those ids from the live heading text whenever the document changes. Do not keep alias maps, redirects, or other jump paths for retired hashes. Those body titles are clickable in-page tag refs to that live fragment. Body cross-references (`§1.3`, Topology, 见下方…) use the same live fragments via `a.page-ref`. In Spec body copy and UniFi store links, use the product-page Marketing Name shown above the SKU (for example `Pro XG 24 PoE`, not `Switch Pro XG 24 PoE` or `USW-Pro-XG-24-PoE`). Do not add category prefixes from the tab title or `og:title` (`Switch`, `Access Point`, `Camera`, `Access`, …). In device lists, that Marketing Name is the link, with the gray SKU underneath.

Keep enough bottom padding on the Spec article that the last Contents target can reach the reading line at the top of the pane. Without that room, the pane ends first and the last item never becomes active.

### Topology drawing

The on-screen SVG and the exported sheet are one drawing. Do not fix a screen rule by bending a cable, or fix a PDF rule by shifting only the export.

**Export Blueprint**

- Keep Export Blueprint and Full Screen in the Appendix Topology bar, outside the drawing stage (`#spec-topo`).
- Export clones the on-screen topology stage; do not change the drawing to make the buttons fit.

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

- Draw the legend into the topology SVG, in the empty upper right. No sidebar, and do not add a separate legend section in the Spec prose.
- Two equal-width columns. Tops align with NAH. No "Legend" heading.
- Left column is PORTS. Right column is CABLES above VLANS.
- Each card has its own border and the same inner padding.

**Alignment**

- Centre the drawing in the appendix view.
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

### Tesla wiring drawing

The Gateway 3 wiring compartment is a schematic. It shows the relative position and the use of each main interface. It is not a picture of the hardware. Do not draw realistic hardware, fasteners, mesh, silkscreen, hinges, or any other extra line inside the bay. The sheet is a grid. Gateway 3 is one rounded square on that grid, and later devices sit on the same grid once an instruction places them. Reference cells are a flat fill.

Keep this section current. When a later instruction adds or changes a rule for this drawing, record that rule here.

**Bay**

- The sheet is 400 by 400 cells. Gateway 3 is one rounded square, 100 by 100 cells, with its top-left on sheet cell `JY-BO`. The square and its interfaces are one group, `translate(2580, 400)`, so the block can move later without rewriting the interfaces.
- The square's fill is the paper color and its stroke is the rounded frame. The square has no internal grid. The sheet grid runs underneath, and the fill covers it.
- The zoom slider and the caption sit outside the sheet. They are not part of the drawing.

**Grid**

- Divide the sheet into a 400 by 400 grid. The lines use `--gw-hairline` and stay 0.5px on screen at every zoom. They sit on the interior cell edges, one cell in from each side, through the last interior edge.
- Both axes use the same two-letter names. For index `n`, the first letter is `A + floor(n / 26)` and the second is `A + (n % 26)`. Index 0 is `AA`. Index 399 is `PJ`. A 400-cell axis ends at `PJ`.
- Columns run left to right, `AA` through `PJ`. Rows run top to bottom, `AA` through `PJ`. `AA` is the top row and the left column.
- Name a cell as the column, a hyphen, then the row. `AJ-AJ` is column `AJ`, row `AJ`.
- The grid locates devices. A grid line is not part of a device.
- Every 10 by 10 block has its bottom-right cell filled, as a reference mark. Those cells are indices 9, 19, 29, …, 399 on both axes. The first is `AJ-AJ`. The last is `PJ-PJ`. The fill is a reference mark, not a device.

**Hover readout**

- When the drawing is zoomed far enough that the pointer can sit clearly in one cell, and the coordinate fits inside that cell, the cell under the pointer shows its name, for example `AA-AB`.
- Below that size, show no coordinate.
- The readout names only the cell under the pointer, in sheet coordinates, including over the Gateway square.

**Zoom**

- One slider, directly above the SVG, the same width as the SVG area.
- It moves continuously from 1× to 128×. The sheet area is 16 times the previous 100 by 100 sheet, and the previous maximum was 8×. It replaces separate zoom-in, zoom-out, and reset controls.
- Dragging inside the drawing pans. The wheel and a two-finger pinch use the same 1×–128× range and move the slider with them.

**Strokes**

- Every line on this sheet keeps the same thickness on screen at every zoom. The zoom is a CSS transform, so a stroke of N screen pixels is `calc(Npx / var(--gw-scale, 1))` with `vector-effect: non-scaling-stroke`.
- The sheet defines three weights on the SVG: `--gw-hairline` is 0.5px for the grid, `--gw-frame` is 1.5px for a device's outer frame, and `--gw-device` is 1px for the lines drawn inside a device. Shapes in the sheet use `--gw-device` unless a more specific rule names another weight.
- Gateway 3 uses that division for its frame and for every interface stroke. A later device on this sheet uses the same division. Do not put a raw pixel stroke on a device line.
- Every rectangle on this sheet has a corner radius of one cell. That includes device frames, the internal panelboard, the jumper, the communication pins, and the Powerwall 3 terminals. Reference marks stay square.

**Interfaces A–I**

- The nine components use the names and roles on [Gateway 3 Wiring Overview](https://energylibrary.tesla.com/docs/Public/EnergyStorage/Powerwall/3/InstallManual/Gateway/3/en-us/GUID-5A34398F-EB43-4BA8-8E37-6C32F0D35E1D.html). Do not copy that page's line art.
  - A, Supply Terminals
  - B, Backup Terminals
  - C, Large Neutral Terminals
  - D, Additional Neutral Terminals
  - E, Backup Terminals on Internal Panelboard
  - F, Large Ground Terminals
  - G, Additional Ground Terminals
  - H, Internal Panelboard
  - I, Communication connector
- Draw a component only when instructed. When one is placed, record its cell span and its job in this section.
- Cell spans below are local to the Gateway square, counted from its own top-left. Local columns stay `00`–`99` and local rows stay `AA`–`DV`. On the sheet, local `00-AA` is currently `JY-BO`. Moving the square later changes the sheet cells and leaves these local spans as they are.
- How this house uses each component stays in the Spec prose. The drawing shows where the interface is and what it is for.

**H, Internal Panelboard**

- Eight equal rounded rectangles. The top edge of `L2 - 01` is row `AK`. Each space is 21 cells wide and 5 cells tall. All eight share that size and the same left and right edges, columns `33` through `53`.
- Leave one grid row between spaces. Top to bottom the order is L2, L1, L2, L1, four pairs:
  - `L2 - 01`, rows `AK`–`AO`
  - `L1 - 01`, rows `AQ`–`AU`
  - `L2 - 02`, rows `AW`–`BA`
  - `L1 - 02`, rows `BC`–`BG`
  - `L2 - 03`, rows `BI`–`BM`
  - `L1 - 03`, rows `BO`–`BS`
  - `L2 - 04`, rows `BU`–`BY`
  - `L1 - 04`, rows `CA`–`CE`
- Cover the grid inside each rectangle, including a reference mark that falls inside it. The rounded stroke is the only border. The corner radius is one cell.
- L2 strokes are red. L1 strokes are black. These spaces have no selection state.
- Every space always shows its label centered, `L2 - 01` through `L1 - 04`, in the same color as its stroke.

**E, Backup Terminals on Internal Panelboard**

- Two circles, diameter 7 cells. The left circle's bounding rows are `CJ`–`CP`, columns `33`–`39`. The right circle's bounding rows are `CJ`–`CP`, columns `47`–`53`. Cover the grid inside each circle. These circles have no selection state.
- The left circle is L1 and its stroke is black. The right circle is L2 and its stroke is red. Each circle always shows that label centered, in the same color as its stroke.
- The manual says the top breaker position is L2. On this staggered bus the top tooth is the right-hand one, so the right bus is L2 and the left bus is L1. These terminals sit directly under that column, one on each bus, and their outer edges line up with the column. The Powerwall AC table in the same manual states L1 is black and L2 is red. Gateway terminals A, B, and E list that pair as black, then red.

**Jumper bridge**

- One rounded rectangle, the same size as a single H space: 21 cells wide, 5 cells tall, corner radius one cell. Columns `33` through `53`, rows `CV`–`CZ`. It is centered in the gap between E and B, with the same left and right edges as H.
- The stroke is brown, `#7a4e2b`, the color already used for this bridge on the one-line diagram. That keeps it distinct from L1 black and L2 red. Cover the grid inside the rectangle. It has no selection state.
- The rectangle always shows the line printed on the hardware, centered, in the same brown: `REMOVE TO ISOLATE SUB-PANEL`.

**C, Large Neutral Terminals**

- Three circles, the same diameter as E and B. The Wiring Overview draws C as three large neutral lugs: one left of the upper terminal pair, one left of the lower pair, and one right of the lower pair. On this grid those centers are one phase-spacing left of E-L1, one phase-spacing left of B-L1, and one phase-spacing right of B-L2. The phase spacing is the distance between the L1 and L2 centers.
- The left-upper circle shares E's rows `CJ`–`CP`, columns `19`–`25`. The two lower circles share B's rows `DF`–`DL`. The left-lower circle is columns `19`–`25`. The right circle is columns `61`–`67`. Cover the grid inside each circle. These circles have no selection state.
- The manual's recommended wire color for C is white. A white stroke disappears on this paper, so the stroke is gray, `#6f6860`, distinct from L1 black, L2 red, and the jumper brown. Each circle always shows `N` centered, in that same gray. All three terminals are the same neutral.

**D, Additional Neutral Terminals**

- Ten circles in one vertical strip. The strip's top-left cell is `09-CJ` and it is 4 cells wide, columns `09` through `12`, rows `CJ` through `DL`. Each circle has diameter 2 cells. The circles are centered on the strip, so each one occupies columns `10`–`11`. One clear cell separates each circle from the next. The top circle starts on row `CJ`. The bottom circle ends on row `DL`.
- These are the neutral bar's B and C positions on the Neutral Bar and Ground Bars page. That page's C is seven smaller holes, and its B is three larger holes, ten in all. B accepts up to 1/0 and C accepts up to 4 AWG, which is why the hardware holes differ in size. This drawing uses one diameter for all ten, as instructed. The separate bar labeled A on that page is not D.
- The overview lists D's wire color as white. The stroke matches C, gray `#6f6860`. The circles have no labels and no selection state.

**F, Large Ground Terminals**

- Four circles, diameter 5 cells, in columns `75` through `79`, rows `CJ` through `DL`. Three clear cells separate each circle from the next. The top circle starts on row `CJ` and the bottom circle ends on row `DL`, so the four circles and their gaps fill that span. Each circle is centered on the five columns and covers the grid inside it. These circles have no selection state.
- The circles occupy rows `CJ`–`CN`, `CR`–`CV`, `CZ`–`DD`, and `DH`–`DL`.
- These are the four large ground lugs. The manual lists the wire as green or bare, 6 AWG through 2/0. The stroke is green, `#1c7c34`, the ground green, kept distinct from the photovoltaic green on the one-line diagram. Each circle always shows `PE` centered, in that same green. The two hex fasteners beside this block on the hardware are not terminals and are not drawn.

**G, Additional Ground Terminals**

- Five circles, diameter 3 cells. Seven clear cells separate this column from F, so the circles occupy columns `87` through `89`. They share F's rows `CJ` through `DL`. The gap between circles is 3.5 cells, and the five circles plus those gaps fill the span: the top circle starts on row `CJ` and the bottom circle ends on row `DL`. Cover the grid inside each circle. These circles have no selection state.
- These are the five green terminal screws on the additional ground bar. The silver screws at the two ends of that bar mount the bar and are not drawn. The stroke and the centered `PE` label match F. On the Neutral Bar and Ground Bars page this bar is the section labeled A, and it accepts 14 AWG through 4 AWG.

**A, Supply Terminals**

- Two circles, diameter 7 cells, on one horizontal line. Seven clear cells separate them. The right circle's right edge is the right edge of column `89`, so that circle occupies columns `83`–`89`. The left circle occupies columns `69`–`75`. Both bottoms are the bottom of row `CE`, so both occupy rows `BY`–`CE`, level with the bottom of H. Cover the grid inside each circle. These circles have no selection state.
- The left circle is S2 and its stroke is red. The right circle is S1 and its stroke is black. Each circle always shows that label centered, in the same color as its stroke. The supply lugs are arranged S2 then S1 from left to right, the same order as the one-line diagram. Red and black are the manual's pair for these hots.

**I, Communication connector**

- Six rectangles in one column, the physical top-to-bottom order of the communication connector on [Gateway 3 Communication Wiring](https://energylibrary.tesla.com/docs/Public/EnergyStorage/Powerwall/3/InstallManual/Gateway/3/en-us/GUID-5518F1D0-F031-4786-AC15-FB83A535EAA4.html). Each is 10 cells wide and 3 cells tall, corner radius one cell. One clear cell separates each rectangle from the next. The top-left cell of the top rectangle is `80-AK`, so the column is columns `80` through `89`. Cover the grid inside each rectangle. These rectangles have no selection state.
- Top to bottom:
  - `12V`, rows `AK`–`AM`. Recommended color red, stroke `#d20f0f`.
  - `GND`, rows `AO`–`AQ`. Recommended color black, stroke `#1a1a1a`.
  - `CN+`, rows `AS`–`AU`. Recommended color blue, stroke `#1d4f91`.
  - `CN−`, rows `AW`–`AY`. Recommended color orange, stroke `#e06a12`.
  - `RS485+`, rows `BA`–`BC`. The manual lists the color as not used, so the stroke is gray `#8a847c`.
  - `RS485−`, rows `BE`–`BG`. Same unused gray.
- Each rectangle always shows that pin name centered, in the same color as its stroke. This is the same order as the one-line diagram.

**B, Backup Terminals**

- Two circles, the same diameter as E. Each sits directly under one E circle, with 15 clear grid cells between the circles. The left center is column-aligned with the left E circle and its top is row `DF`. The right center is column-aligned with the right E circle. They run through row `DL`. Cover the grid inside each circle. These circles have no selection state.
- The left circle is L1 and its stroke is black. The right circle is L2 and its stroke is red. Each circle always shows that label centered, in the same color as its stroke. On the wiring overview these two lugs sit directly under the two E terminals, one on each phase bus.

**Powerwall 3**

- One rounded rectangle, 100 cells wide and 56 cells tall, corner radius one cell. The sheet has two copies. Follower is `translate(80, 520)`, top-left `AI-CA`. Leader is `translate(1360, 520)`, top-left `FG-CA`. Inner ids carry that group id as a prefix. The frame uses `--gw-frame`. There is no internal grid. Ten clear cells separate the frame from the nearest interface on every side.
- The field terminals follow [Powerwall 3 AC and PV Wiring](https://energylibrary.tesla.com/docs/Public/EnergyStorage/Powerwall/3/InstallManual/Gateway/3/en-us/GUID-FDF6014A-AD21-443F-B299-26FCC56B4A28.html). Positions below are cells inside this rectangle, counted from its own top-left. Do not copy that page's line art.
- AC connector, four rounded rectangles with the long side vertical: 5 cells wide, 21 cells tall, corner radius one cell. One clear cell between rectangles. They share one top edge and one bottom edge. Ten clear cells separate the unused rectangle from the left side of the frame. Left to right: an unused terminal with no label and gray stroke `#8a847c`; `N` in gray `#6f6860`; `L2` in red `#d20f0f`; `L1` in black `#1a1a1a`. The manual says the leftmost terminal is not used. The labeled order on the connector is N, L2, L1. Ten clear cells separate L1 from `1+`.
- Ground bar, three circles, diameter 3, one clear cell between them. They sit above `1+`, `2+`, and `3+`, one circle centered on each rectangle, so the left edge of the first circle lines up with the left edge of `1+` and the right edge of the third circle lines up with the right edge of `3+`. Five clear cells separate the circles from those rectangles. Each is green `#1c7c34` and shows `PE`. These are the three equipment-ground screws.
- MPPT, twelve rounded rectangles on the same horizontal line as the AC rectangles, the same height, 3 cells wide, corner radius one cell. One clear cell between rectangles. Ten clear cells separate the last rectangle from the right side of the frame. Left to right the order is `1+` through `6+`, then `1−` through `6−`. Positive strokes are red. Negative strokes are black.
- Jumper pieces are not drawn. MPPT 1–2 and 5–6 can take the supplied jumper. MPPT 3 and 4 are closed from the factory. The Tesla Asset Controller and its Ethernet jacks are not drawn.
- Communication connector, four rectangles with the long side vertical: 3 cells wide, 10 cells tall, corner radius one cell. One clear cell between rectangles. They sit in one horizontal row. Five clear cells separate their bottoms from the MPPT rectangles. The right edge of `12V` lines up with the right edge of `6−`, so these four rectangles sit above `3−`, `4−`, `5−`, and `6−`. Left to right this is the screw-terminal order in the Powerwall 3 enclosure on [Wire Communication Connection from Gateway 3 to Powerwall 3](https://energylibrary.tesla.com/docs/Public/EnergyStorage/Powerwall/3/InstallManual/Gateway/3/en-us/GUID-C2CF965B-EE68-42E6-BAFD-166E72C5B967.html): `CN−` orange `#e06a12`, `CN+` blue `#1d4f91`, `GND` black `#1a1a1a`, `12V` red `#d20f0f`. RS-485 is not on this four-position block. The cable drain lands on an equipment-ground terminal and is not a fifth rectangle.

**Wall Connector Gen 3**

- One rounded rectangle, 45 cells wide and 35 cells tall, corner radius one cell. The sheet has two copies. Wall Connector 1 is `translate(80, 1680)`, top-left `AI-GM`. Wall Connector 2 is `translate(640, 1680)`, top-left `CM-GM`. Inner ids carry that group id as a prefix. The frame uses `--gw-frame`. There is no internal grid. Ten clear cells separate the frame from the nearest interface on every side.
- RS-485 port, two squares, 4 by 4 cells, corner radius one cell, one clear cell between them, at the upper left of the rectangle. Four clear cells separate this port from the power terminals below. Left to right this is the backside port on the Gen 3 installation manual, Wall Connector Internal Components callout 1, landed as described under Dynamic Power Management: the red port, labeled `RED`, stroke `#d20f0f`; the white port, labeled `WHT`, stroke `#6f6860`. The red harness lead lands on the red port and the black lead lands on the white port. The manual does not mark polarity. The green housing under the two ports is not a terminal.
- Three circles, diameter 7, two clear cells between them, on one horizontal line below that port, with four clear cells between the port and these circles. Left to right this is the North American wirebox order on the Gen 3 installation manual, Step 5: `G` in green `#1c7c34`, `L2/N` in red `#d20f0f`, `L1` in black `#1a1a1a`. Terminals are bi-directional. On this split-phase service the middle terminal is L2, line to line, not a neutral. The entry knockouts, service channel, and zip tie are not drawn.

**System**

- The same sheet holds the rest of the house Tesla system. Compartment interiors stay as drawn above.
- Role names sit outside the clip, above the frame, at local `y=-16`: Gateway 3, Follower, Leader, WC 1, WC 2. They are not covered by the paper fill.
- Labeled rounded boxes use the paper fill, the frame stroke, and a corner radius of one cell: Meter-Main `JA402R-BC-HI`; Main House Subpanel; Garage Subpanel; eight solar modules; two `MCI-1` boxes. A module draws a red positive terminal and a black negative terminal on its bottom edge. Tesla Remote Meters are not on this sheet. The two Wall Connectors use Power Share over Wi-Fi; their RS-485 ports stay drawn and unwired.
- Wires are orthogonal polylines, one horizontal or vertical segment at a time. An end meets the rim of an existing terminal, or the edge of a labeled box. One conductor per hole. The stroke color matches that terminal. Ethernet between the two Powerwalls is dashed. Module-to-module leads use the jumper brown. MPPT jumpers are not drawn; each string lands on MPPT 1 only.
- The circuit narrative stays out of this file and out of the Spec essay. The figure caption names the devices and says the wires are orthogonal.

