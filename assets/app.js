(function () {
    (function () {
      var article = document.querySelector("#tab-spec .spa-article");
      var toc = document.querySelector("#tab-spec .design-toc");
      var scroller = document.getElementById("tab-spec");
      if (!article || !toc || !scroller) return;

      var list = document.createElement("ol");
      list.className = "design-toc-list";
      var links = [];
      var usedIds = Object.create(null);

      function slugFromText(raw) {
        return raw.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, "-").replace(/^-+|-+$/g, "") || "section";
      }

      function headingIdFromText(raw) {
        var numbered = raw.match(/^(\d+(?:\.\d+)*)\b/);
        if (numbered) return numbered[1];
        return slugFromText(raw);
      }

      function assignHeadingId(heading, slugOnly) {
        var raw = (heading.textContent || "section").replace(/\s+/g, " ").trim();
        var id = slugOnly ? slugFromText(raw) : headingIdFromText(raw);
        if (usedIds[id]) {
          var n = 2;
          while (usedIds[id + "-" + n]) n += 1;
          id = id + "-" + n;
        }
        usedIds[id] = true;
        heading.id = id;
        heading.style.scrollMarginTop = "0.6rem";
        return raw;
      }

      function scrollToHeading(heading, behavior) {
        if (!heading) return;
        var top = heading.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 8;
        scroller.scrollTo({ top: Math.max(0, top), behavior: behavior || "smooth" });
      }

      function setHeadingHash(heading) {
        if (!heading || !heading.id || !history.replaceState) return;
        history.replaceState(null, "", "#" + heading.id);
      }

      /* Live fragment ids for every Spec heading. Always recompute from the
         current title — never keep retired ids or alias redirects. */
      Array.prototype.forEach.call(article.querySelectorAll("h2, h3, h4"), function (heading) {
        assignHeadingId(heading);
      });

      /* Fragment ids for h5 targets (e.g. HA Panel) — not Contents items.
         Slug-only so guide steps like "1. …" do not collide with outline §1. */
      Array.prototype.forEach.call(article.querySelectorAll("h5"), function (heading) {
        assignHeadingId(heading, true);
      });

      /* Spec h2 / h3 / h4 body titles are clickable in-page tag refs. */
      Array.prototype.forEach.call(article.querySelectorAll("h2, h3, h4"), function (heading) {
        if (!heading.id || heading.querySelector(":scope > a.heading-ref")) return;
        var link = document.createElement("a");
        link.className = "heading-ref";
        link.href = "#" + heading.id;
        while (heading.firstChild) link.appendChild(heading.firstChild);
        heading.appendChild(link);
        link.addEventListener("click", function (event) {
          event.preventDefault();
          if (typeof window.applyLocationHash === "function") {
            window.applyLocationHash("#" + heading.id, "smooth");
          } else {
            scrollToHeading(heading, "smooth");
            setHeadingHash(heading);
          }
        });
      });

      /* Body page-refs (§2.3, Topology, 见下方…) scroll the Spec pane / switch tabs. */
      article.addEventListener("click", function (event) {
        var a = event.target.closest && event.target.closest("a.page-ref");
        if (!a || !article.contains(a)) return;
        var href = a.getAttribute("href") || "";
        if (href.charAt(0) !== "#") return;
        event.preventDefault();
        if (typeof window.applyLocationHash === "function") {
          window.applyLocationHash(href, "auto");
        } else if (href.slice(1)) {
          location.hash = href.slice(1);
        }
      });

      window.scrollSpecHeading = scrollToHeading;
      window.specHeadingById = function (id) {
        if (!id) return null;
        var el = document.getElementById(id);
        return el && article.contains(el) ? el : null;
      };

      /* Contents: numbered sections (h2) and 2.1-style subsections (h3) only. */
      Array.prototype.forEach.call(article.querySelectorAll("h2, h3"), function (heading) {
        var raw = (heading.textContent || "section").replace(/\s+/g, " ").trim();
        var item = document.createElement("li");
        item.className = "toc-" + heading.tagName.toLowerCase();
        var link = document.createElement("a");
        link.href = "#" + heading.id;
        link.textContent = raw;
        link.addEventListener("click", function (event) {
          event.preventDefault();
          if (typeof window.applyLocationHash === "function") {
            window.applyLocationHash("#" + heading.id, "smooth");
          } else {
            scrollToHeading(heading, "smooth");
            setHeadingHash(heading);
          }
          if (typeof window.setSpecSidebar === "function") window.setSpecSidebar(false);
        });
        item.appendChild(link);
        list.appendChild(item);
        links.push({ heading: heading, link: link });
      });
      toc.innerHTML = "";
      var title = document.createElement("p");
      title.className = "design-toc-title";
      title.textContent = "Contents";
      toc.appendChild(title);
      toc.appendChild(list);

      /* Mobile Contents drawer — same pattern as A&J Studio Corporate Governance. */
      (function () {
        var navToggle = document.querySelector(".nav-toggle");
        var backdrop = document.querySelector(".nav-backdrop");
        var mobileNav = window.matchMedia("(max-width: 860px)");

        function isMobileNav() {
          return mobileNav.matches || window.innerWidth <= 860;
        }

        function setSidebar(open) {
          var show = Boolean(open) && isMobileNav() && document.body.classList.contains("tab-spec");
          toc.classList.toggle("is-open", show);
          document.body.classList.toggle("nav-open", show);
          if (navToggle) navToggle.setAttribute("aria-expanded", show ? "true" : "false");
          if (backdrop) backdrop.hidden = !show;
        }

        window.setSpecSidebar = setSidebar;

        if (navToggle) {
          navToggle.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            setSidebar(!toc.classList.contains("is-open"));
          });
        }
        if (backdrop) {
          backdrop.addEventListener("click", function () { setSidebar(false); });
        }
        document.addEventListener("keydown", function (event) {
          if (event.key === "Escape") setSidebar(false);
        });
        if (mobileNav.addEventListener) {
          mobileNav.addEventListener("change", function () {
            if (!isMobileNav()) setSidebar(false);
          });
        }
        window.addEventListener("resize", function () {
          if (!isMobileNav()) setSidebar(false);
        });
      })();

      if (!("IntersectionObserver" in window)) {
        scroller.addEventListener("scroll", updateTocFromScroll);
        updateTocFromScroll();
        return;
      }

      function revealTocLink(link) {
        if (!link || !toc) return;
        var tocRect = toc.getBoundingClientRect();
        var linkRect = link.getBoundingClientRect();
        var margin = Math.max(36, toc.clientHeight * 0.28);
        if (linkRect.top >= tocRect.top + 8 && linkRect.bottom <= tocRect.bottom - 8) return;
        var delta = linkRect.top - tocRect.top - margin;
        toc.scrollTo({ top: Math.max(0, toc.scrollTop + delta), behavior: "auto" });
      }

      function updateTocFromScroll() {
        var scrollerRect = scroller.getBoundingClientRect();
        var origin = scrollerRect.top + 28;
        var found = links[0];
        /* At the bottom of the Spec pane the last heading can stay below the
           reading line. Count it once it is on screen. */
        var atEnd = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
        links.forEach(function (item) {
          var top = item.heading.getBoundingClientRect().top;
          if (top <= origin || (atEnd && top < scrollerRect.bottom)) found = item;
        });
        links.forEach(function (item) {
          item.link.classList.toggle("is-active", item === found);
        });
        if (found) revealTocLink(found.link);
      }

      var tocRaf = 0;
      scroller.addEventListener("scroll", function () {
        if (tocRaf) return;
        tocRaf = requestAnimationFrame(function () {
          tocRaf = 0;
          updateTocFromScroll();
        });
      }, { passive: true });
      updateTocFromScroll();

      var observer = new IntersectionObserver(function () {
        updateTocFromScroll();
      }, { root: scroller, rootMargin: "0px 0px -72% 0px", threshold: 0 });
      links.forEach(function (item) { observer.observe(item.heading); });
    })();

    /* §2.4 PoE tree: span-row handles collapse their descendant levels.
       Collapse a handle also collapses nested handles. Expand a handle
       shows its subtree with nested handles left collapsed. */
    (function () {
      var table = document.querySelector("#tab-spec table.power-tree");
      if (!table) return;
      var rows = Array.prototype.slice.call(table.querySelectorAll("tbody > tr[data-level]"));

      var handles = rows.filter(function (row) {
        return row.classList.contains("power-tree-handle");
      });

      function setHandleOpen(row, open) {
        row.setAttribute("aria-expanded", open ? "true" : "false");
        var button = row.querySelector(".room-toggle");
        var mark = row.querySelector(".room-mark");
        var nameEl = row.querySelector(".room-name");
        if (button) {
          button.setAttribute("aria-expanded", open ? "true" : "false");
          var name = nameEl
            ? (nameEl.getAttribute("title") || nameEl.textContent).replace(/\s+/g, " ").trim()
            : "group";
          button.setAttribute("aria-label", (open ? "Collapse " : "Expand ") + name);
        }
        if (mark) mark.textContent = open ? "-" : "+";
      }

      function collapseDescendantHandles(handle) {
        var level = Number(handle.getAttribute("data-level"));
        var idx = rows.indexOf(handle);
        for (var i = idx + 1; i < rows.length; i += 1) {
          var row = rows[i];
          /* The handle's own port row shares its level and is not a descendant. */
          if (row.classList.contains("power-tree-ports")) continue;
          var rowLevel = Number(row.getAttribute("data-level"));
          if (rowLevel <= level) break;
          if (row.classList.contains("power-tree-handle")) setHandleOpen(row, false);
        }
      }

      var revealReady = false;

      function setRowHidden(row, hidden) {
        var wasHidden = row.hidden;
        row.hidden = hidden;
        if (!revealReady || hidden || !wasHidden) {
          if (hidden) row.classList.remove("sheet-in");
          return;
        }
        row.classList.remove("sheet-in");
        void row.offsetWidth;
        row.classList.add("sheet-in");
      }

      function applyPowerTreeVisibility() {
        var collapsedDepth = Infinity;
        rows.forEach(function (row) {
          var level = Number(row.getAttribute("data-level"));
          /* A port row shares its device's level, so it must not clear that
             device's collapse. The next handle at the same level does. */
          var opensLevel = level < collapsedDepth || (
            level === collapsedDepth && row.classList.contains("power-tree-handle")
          );
          if (opensLevel) collapsedDepth = Infinity;
          var hiddenByAncestor = level > collapsedDepth;
          setRowHidden(row, hiddenByAncestor);
          if (
            !hiddenByAncestor &&
            row.classList.contains("power-tree-handle") &&
            row.getAttribute("aria-expanded") === "false"
          ) {
            collapsedDepth = level;
          }
        });
        if (window.fitPowerLines) requestAnimationFrame(window.fitPowerLines);
      }

      rows.forEach(function (row) {
        if (!row.classList.contains("power-tree-handle")) return;
        row.addEventListener("click", function (event) {
          if (event.target.closest && event.target.closest("a")) return;
          var open = row.getAttribute("aria-expanded") !== "false";
          setHandleOpen(row, !open);
          if (open) collapseDescendantHandles(row);
          applyPowerTreeVisibility();
        });
      });

      applyPowerTreeVisibility();
      revealReady = true;
    })();

    /* Span-row tables (chapter 1 rooms, §2.3 / §3.3 categories).
       A span row collapses every following row until the next span at the
       same or shallower level. Nested spans (patch-cable specs) use
       data-level. Floor bands stay visible. The header toggles every span.
       "-" is expanded, "+" is collapsed. */
    (function () {
      function bindSpanTable(table) {
      var rooms = Array.prototype.slice.call(table.querySelectorAll("tbody > tr.room-span"));
      var bodyRows = Array.prototype.slice.call(table.querySelectorAll("tbody > tr"));
      var headerButton = table.querySelector("thead .room-toggle");
      var headerMark = table.querySelector("thead .room-mark");

      function setHeaderOpen(open) {
        if (headerButton) {
          headerButton.setAttribute("aria-expanded", open ? "true" : "false");
          headerButton.setAttribute("aria-label", open ? "Collapse all" : "Expand all");
        }
        if (headerMark) headerMark.textContent = open ? "-" : "+";
      }

      function syncHeader() {
        var allOpen = rooms.every(function (row) {
          return row.getAttribute("aria-expanded") !== "false";
        });
        setHeaderOpen(allOpen);
      }

      var revealReady = false;

      function setRowHidden(row, hidden) {
        var wasHidden = row.hidden;
        row.hidden = hidden;
        if (!revealReady || hidden || !wasHidden) {
          if (hidden) row.classList.remove("sheet-in");
          return;
        }
        row.classList.remove("sheet-in");
        void row.offsetWidth;
        row.classList.add("sheet-in");
      }

      function levelOf(row) {
        if (row.classList.contains("floor-span")) return null;
        if (row.hasAttribute("data-level")) return Number(row.getAttribute("data-level"));
        if (row.classList.contains("room-span")) return 0;
        return 1;
      }

      function setFlags(row, open) {
        var button = row.querySelector(".room-toggle");
        var mark = row.querySelector(".room-mark");
        var heading = row.querySelector(".room-name");
        row.setAttribute("aria-expanded", open ? "true" : "false");
        if (button) {
          button.setAttribute("aria-expanded", open ? "true" : "false");
          var name = heading ? heading.textContent.replace(/\s+/g, " ").trim() : "group";
          button.setAttribute("aria-label", (open ? "Collapse " : "Expand ") + name);
        }
        if (mark) mark.textContent = open ? "-" : "+";
      }

      function closeDescendantHandles(handle) {
        var level = levelOf(handle);
        var idx = bodyRows.indexOf(handle);
        for (var i = idx + 1; i < bodyRows.length; i += 1) {
          var row = bodyRows[i];
          var rowLevel = levelOf(row);
          if (rowLevel == null) continue;
          if (row.classList.contains("room-span") && rowLevel <= level) break;
          if (row.classList.contains("room-span")) setFlags(row, false);
        }
      }

      function applyVisibility() {
        var collapsedAt = Infinity;
        bodyRows.forEach(function (row) {
          var level = levelOf(row);
          if (level == null) {
            setRowHidden(row, false);
            return;
          }
          if (level <= collapsedAt) collapsedAt = Infinity;
          var hidden = level > collapsedAt;
          setRowHidden(row, hidden);
          if (
            !hidden &&
            row.classList.contains("room-span") &&
            row.getAttribute("aria-expanded") === "false"
          ) {
            collapsedAt = level;
          }
        });
        if (window.fitScheduleLines) window.fitScheduleLines();
      }

      rooms.forEach(function (row) {
        row.addEventListener("click", function (event) {
          if (event.target.closest) {
            var link = event.target.closest("a");
            if (link && !link.classList.contains("heading-ref")) return;
          }
          var open = row.getAttribute("aria-expanded") !== "false";
          setFlags(row, !open);
          if (open) closeDescendantHandles(row);
          applyVisibility();
          syncHeader();
        });
      });

      var thead = table.querySelector("thead");
      if (thead && headerButton) {
        thead.addEventListener("click", function (event) {
          if (event.target.closest && event.target.closest("a, .port-split")) return;
          var allOpen = rooms.every(function (row) {
            return row.getAttribute("aria-expanded") !== "false";
          });
          rooms.forEach(function (row) { setFlags(row, !allOpen); });
          applyVisibility();
          syncHeader();
        });
      }

      applyVisibility();
      syncHeader();
      revealReady = true;
      }

      Array.prototype.forEach.call(
        document.querySelectorAll("#tab-spec table.span-groups"),
        bindSpanTable
      );
    })();

    /* Price headers: sum paid cells in that table. Currencies stay separate,
       in the order they first appear. No paid rows keeps Total: $-. */
    (function () {
      function centsOf(raw) {
        var n = String(raw).replace(/,/g, "");
        var bits = n.split(".");
        var whole = parseInt(bits[0], 10) || 0;
        var frac = (bits[1] || "00").padEnd(2, "0").slice(0, 2);
        return whole * 100 + parseInt(frac, 10);
      }

      function formatMoney(prefix, cents) {
        var neg = cents < 0;
        var abs = Math.abs(cents);
        var whole = String(Math.floor(abs / 100));
        var frac = String(abs % 100).padStart(2, "0");
        whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return (neg ? "-" : "") + prefix + whole + "." + frac;
      }

      function paidLead(cell) {
        var text = "";
        var node = cell.firstChild;
        while (node) {
          if (node.nodeType === 3) text += node.nodeValue;
          else break;
          node = node.nextSibling;
        }
        return text.replace(/\s+/g, "").trim();
      }

      Array.prototype.forEach.call(document.querySelectorAll("#tab-spec th.price-head"), function (head) {
        var table = head.closest("table");
        var slot = head.querySelector(".price-total");
        if (!table || !slot) return;
        var totals = [];
        var index = Object.create(null);
        Array.prototype.forEach.call(table.querySelectorAll("td.price-cell, .home-price"), function (cell) {
          var lead = paidLead(cell);
          var match = lead.match(/^([A-Z]*)\$(\d[\d,]*(?:\.\d+)?)$/);
          if (!match || cell.classList.contains("is-quote")) return;
          var priceRow = cell.closest ? cell.closest("tr") : cell.parentElement;
          if (priceRow && priceRow.classList.contains("cable-span")) return;
          var prefix = match[1] + "$";
          if (prefix === "CA$" && (table.classList.contains("home-appliances") || table.classList.contains("device-list"))) {
            prefix = "$";
          }
          if (index[prefix] == null) {
            index[prefix] = totals.length;
            totals.push({ prefix: prefix, cents: 0 });
          }
          totals[index[prefix]].cents += centsOf(match[2]);
        });
        while (slot.firstChild) slot.removeChild(slot.firstChild);
        if (!totals.length) {
          slot.textContent = "Total: $-";
          return;
        }
        if (totals.length === 1) {
          slot.textContent = "Total: " + formatMoney(totals[0].prefix, totals[0].cents);
          return;
        }
        slot.appendChild(document.createTextNode("Total:"));
        totals.forEach(function (row) {
          var line = document.createElement("span");
          line.className = "price-total-ccy";
          line.textContent = formatMoney(row.prefix, row.cents);
          slot.appendChild(line);
        });
      });
    })();

    /* Column locks. Fixed columns use a probe string. Flexible columns are
       at least the longest name or port pair, and take leftover pane width. */
    (function () {
      var PRICE_PROBE = "Total: CA$999,999.99";

      function boxExtra(el) {
        var cs = getComputedStyle(el);
        return parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
          + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
      }

      function textWidth(sample, source) {
        var probe = document.createElement("span");
        var cs = getComputedStyle(source);
        probe.textContent = sample;
        probe.style.position = "absolute";
        probe.style.left = "-9999px";
        probe.style.top = "0";
        probe.style.whiteSpace = "nowrap";
        probe.style.visibility = "hidden";
        probe.style.font = cs.font;
        probe.style.fontFamily = cs.fontFamily;
        probe.style.fontSize = cs.fontSize;
        probe.style.fontWeight = cs.fontWeight;
        probe.style.letterSpacing = cs.letterSpacing;
        probe.style.fontVariantNumeric = cs.fontVariantNumeric;
        document.body.appendChild(probe);
        var width = probe.getBoundingClientRect().width;
        probe.remove();
        return width;
      }

      function nameWidth(cell) {
        var title = cell.querySelector(".udc-device-title");
        var text = title
          ? title.textContent.replace(/\s+/g, " ").trim()
          : cell.textContent.replace(/\s+/g, " ").trim();
        var source = title || cell;
        var width = textWidth(text, source);
        var device = cell.querySelector(".udc-device");
        var img = device && device.querySelector("img");
        if (img && device) {
          var gap = parseFloat(getComputedStyle(device).columnGap || getComputedStyle(device).gap) || 0;
          width += 28 + gap;
        }
        return width + boxExtra(cell);
      }

      function paneWidth(wrap) {
        if (!wrap) return 0;
        var prev = wrap.style.overflowX;
        wrap.style.overflowX = "hidden";
        var width = wrap.clientWidth;
        wrap.style.overflowX = prev;
        return width;
      }

      function sumOf(list) {
        var total = 0;
        list.forEach(function (w) { total += w; });
        return total;
      }

      function apply(table, mins, flex, floors) {
        var cols = table.querySelectorAll("colgroup col");
        if (cols.length !== mins.length) return;
        var wrap = table.parentElement;
        var pane = wrap ? paneWidth(wrap) : sumOf(mins);
        /* A reserved probe (the wide price sample) is used only when the
           pane can hold it. Otherwise the column falls back to the real
           text, so a placeholder never opens a scrollbar by itself. */
        if (floors) {
          var lifted = mins.map(function (w, i) { return Math.max(w, floors[i] || 0); });
          if (sumOf(lifted) <= pane) mins = lifted;
        }
        var raw = sumOf(mins);
        var widths = mins.map(function (w) { return Math.ceil(w); });
        var minUsed = sumOf(widths);
        var flexAt = [];
        flex.forEach(function (on, i) { if (on) flexAt.push(i); });
        if (!flexAt.length) flexAt.push(0);
        var lastFlex = flexAt[flexAt.length - 1];
        table.style.tableLayout = "fixed";
        /* Never wider than the pane unless the content minimum itself is.
           Ceil adds up to a pixel per column at every pane width, not only
           at the Spec maximum, and that slack must not open a scrollbar. */
        if (raw > pane) {
          widths.forEach(function (w, i) { cols[i].style.width = w + "px"; });
          table.style.width = minUsed + "px";
          table.style.minWidth = minUsed + "px";
          table.style.maxWidth = "none";
          return;
        }

        table.style.maxWidth = "100%";
        var extra = Math.max(0, pane - minUsed);
        var share = flexAt.length > 1 ? Math.floor(extra / flexAt.length) : 0;
        flexAt.forEach(function (idx) {
          if (idx === lastFlex) {
            cols[idx].style.width = "auto";
            return;
          }
          cols[idx].style.width = (widths[idx] + share) + "px";
        });
        widths.forEach(function (w, i) {
          if (flexAt.indexOf(i) === -1) cols[i].style.width = w + "px";
        });
        table.style.width = "100%";
        table.style.minWidth = "0";
      }

      function lineWidth(el) {
        var width = 0;
        Array.prototype.forEach.call(el.childNodes, function (node) {
          var text = node.textContent.replace(/\s+/g, " ").trim();
          if (!text) return;
          var source = node.nodeType === 1 ? node : el;
          width = Math.max(width, textWidth(text, source));
        });
        if (!width) width = textWidth(el.textContent.replace(/\s+/g, " ").trim(), el);
        return width;
      }

      function priceWidths(table) {
        var head = table.querySelector("th.price-head");
        var total = table.querySelector("th.price-head .price-total");
        if (!head || !total) return { content: 0, probe: 0 };
        var extra = boxExtra(head);
        var content = lineWidth(total);
        Array.prototype.forEach.call(table.querySelectorAll("td.price-cell"), function (cell) {
          content = Math.max(content, lineWidth(cell));
          extra = Math.max(extra, boxExtra(cell));
        });
        return {
          content: Math.ceil(content + extra),
          probe: Math.ceil(textWidth(PRICE_PROBE, total) + extra)
        };
      }

      function lockHome(table) {
        /* One column. The pane sets the width and the name wraps. */
        table.style.tableLayout = "fixed";
        table.style.width = "100%";
        table.style.minWidth = "0";
        table.style.maxWidth = "100%";
      }

      function lockDevices(table) {
        /* One column. The pane sets the width and names wrap. */
        table.style.tableLayout = "fixed";
        table.style.width = "100%";
        table.style.minWidth = "0";
        table.style.maxWidth = "100%";
      }

      function lockPower(table) {
        /* One table, as wide as the pane. Names and the bar note ellipsize. */
        table.style.tableLayout = "fixed";
        table.style.width = "100%";
        table.style.minWidth = "0";
        table.style.maxWidth = "100%";
        Array.prototype.forEach.call(table.querySelectorAll("colgroup col"), function (col) {
          col.style.width = "50%";
        });
      }

      function fitPowerLines() {
        var table = document.querySelector("#tab-spec table.power-tree");
        if (!table) return;
        Array.prototype.forEach.call(table.querySelectorAll(".room-name, .power-device-name, .power-terms"), fitLine);
      }

      window.fitPowerLines = fitPowerLines;

      function lockHa(table) {
        lockDevices(table);
      }

      function scheduleUnits(table) {
        var units = [];
        Array.prototype.forEach.call(table.querySelectorAll(".udc-device"), function (el) { units.push(el); });
        Array.prototype.forEach.call(table.querySelectorAll("tr.cable-spec > .device-cell"), function (el) { units.push(el); });
        return units;
      }

      function scheduleLines(unit) {
        var title = unit.querySelector(":scope > .udc-device-meta > .udc-device-title, :scope > .udc-device-title");
        var sub = unit.querySelector(":scope > .udc-device-meta > .sku-line, :scope > .udc-device-meta > .protocol-line, :scope > .udc-device-meta > .udc-sku, :scope > .sku-line");
        return [title, sub].filter(Boolean);
      }

      function lineOverflows(el) {
        return el.scrollWidth > el.clientWidth + 1;
      }

      function restoreLine(el) {
        if (el.getAttribute("data-full-html") == null) el.setAttribute("data-full-html", el.innerHTML);
        else el.innerHTML = el.getAttribute("data-full-html");
        if (el.getAttribute("data-ellipsis") === "1") {
          el.removeAttribute("title");
          el.removeAttribute("data-ellipsis");
        }
      }

      function placeCut(el, keep) {
        var nodes = [];
        var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
        var node;
        while ((node = walker.nextNode())) nodes.push(node);
        var fullLen = 0;
        nodes.forEach(function (item) { fullLen += item.nodeValue.length; });
        if (keep >= fullLen) return;
        var head = Math.ceil(keep / 2);
        var endKeep = fullLen - Math.floor(keep / 2);
        var index = 0;
        var placed = false;
        nodes.forEach(function (item) {
          var value = item.nodeValue;
          var out = "";
          for (var i = 0; i < value.length; i += 1) {
            var abs = index + i;
            if (abs < head) out += value.charAt(i);
            else if (abs >= endKeep) {
              if (!placed) { out += "…"; placed = true; }
              out += value.charAt(i);
            } else if (!placed) {
              out += "…";
              placed = true;
            }
          }
          index += value.length;
          item.nodeValue = out;
        });
        if (!placed) el.appendChild(document.createTextNode("…"));
        Array.prototype.forEach.call(el.querySelectorAll("a, span"), function (child) {
          if (!child.textContent) child.remove();
        });
      }

      function fitLine(el) {
        if (!el || el.clientWidth < 2) return;
        restoreLine(el);
        if (!el.textContent.trim() || !lineOverflows(el)) return;
        var full = el.textContent.replace(/\s+/g, " ").trim();
        var len = el.textContent.length;
        var lo = 0;
        var hi = len - 1;
        var best = 0;
        while (lo <= hi) {
          var mid = (lo + hi) >> 1;
          el.innerHTML = el.getAttribute("data-full-html");
          placeCut(el, mid);
          if (!lineOverflows(el)) { best = mid; lo = mid + 1; }
          else hi = mid - 1;
        }
        el.innerHTML = el.getAttribute("data-full-html");
        placeCut(el, best);
        el.setAttribute("title", full);
        el.setAttribute("data-ellipsis", "1");
      }

      function inkWidth(el) {
        if (!el) return 0;
        var usd = el.querySelector(":scope > .price-usd");
        if (usd) {
          var lead = "";
          var node = el.firstChild;
          while (node && node !== usd) {
            if (node.nodeType === 3) lead += node.nodeValue;
            node = node.nextSibling;
          }
          lead = lead.replace(/\s+/g, " ").trim();
          var note = usd.textContent.replace(/\s+/g, " ").trim();
          return Math.max(lead ? textWidth(lead, el) : 0, note ? textWidth(note, usd) : 0);
        }
        var sample = el.textContent.replace(/\s+/g, " ").trim();
        if (!sample) return 0;
        return textWidth(sample, el);
      }

      function usedGap(el) {
        var cs = getComputedStyle(el);
        var gap = parseFloat(cs.columnGap);
        if (isNaN(gap)) gap = parseFloat(cs.gap);
        return isNaN(gap) ? 0 : gap;
      }

      function markBox(unit) {
        if (unit.classList.contains("is-logo-hidden")) return 0;
        var mark = unit.querySelector(":scope > .brand-logo-link, :scope > img");
        if (!mark) return 0;
        var width = mark.getBoundingClientRect().width;
        if (width < 1) return 0;
        var cs = getComputedStyle(mark);
        return width + (parseFloat(cs.marginLeft) || 0) + (parseFloat(cs.marginRight) || 0);
      }

      function contentWidth(unit) {
        var width = unit.clientWidth;
        if (unit.tagName === "TD" || unit.tagName === "TH") {
          var cs = getComputedStyle(unit);
          width -= (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
        }
        return width;
      }

      /* One side for the whole table. The price sits on the right only when every visible row still fits. */
      function placePrices(units) {
        var rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        var priceGap = 0.85 * rootPx;
        var plan = [];
        var allFit = true;
        var any = false;
        units.forEach(function (unit) {
          unit.classList.remove("is-price-aside");
        });
        units.forEach(function (unit) {
          var price = unit.querySelector(":scope > .udc-device-meta > .home-price, :scope > .home-price");
          if (!price || unit.clientWidth < 2) {
            plan.push(null);
            return;
          }
          var textW = 0;
          scheduleLines(unit).forEach(function (line) {
            textW = Math.max(textW, inkWidth(line));
          });
          var priceW = inkWidth(price);
          var logoW = markBox(unit);
          var logoGap = logoW > 0 ? usedGap(unit) : 0;
          var fit = textW + priceW + logoW + logoGap + priceGap <= contentWidth(unit) - 2;
          any = true;
          if (!fit) allFit = false;
          plan.push(Math.ceil(priceW));
        });
        var aside = any && allFit;
        units.forEach(function (unit, i) {
          var slot = plan[i];
          var on = aside && slot != null;
          unit.classList.toggle("is-price-aside", on);
          if (on) unit.style.setProperty("--price-slot", slot + "px");
          else unit.style.removeProperty("--price-slot");
        });
      }

      function applyLogoSlot(table) {
        var imgs = table.querySelectorAll("img.brand-logo");
        if (!imgs.length) return;
        var maxRatio = 0;
        Array.prototype.forEach.call(imgs, function (img) {
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            maxRatio = Math.max(maxRatio, img.naturalWidth / img.naturalHeight);
          }
        });
        if (!maxRatio) return;
        var link = table.querySelector(".brand-logo-link");
        var pad = 0;
        if (link) {
          var cs = getComputedStyle(link);
          pad = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
        }
        table.style.setProperty("--logo-slot", Math.ceil(maxRatio * 16 + pad) + "px");
      }

      function tighten(table) {
        if (!table || table.clientWidth < 2) return;
        applyLogoSlot(table);
        var units = scheduleUnits(table);
        units.forEach(function (unit) {
          unit.classList.remove("is-logo-hidden");
          unit.classList.remove("is-price-aside");
          unit.style.removeProperty("--price-slot");
          scheduleLines(unit).forEach(restoreLine);
        });
        var tight = false;
        units.forEach(function (unit) {
          scheduleLines(unit).forEach(function (line) {
            if (line.clientWidth >= 2 && line.textContent.trim() && lineOverflows(line)) tight = true;
          });
        });
        if (tight) {
          units.forEach(function (unit) { unit.classList.add("is-logo-hidden"); });
        }
        placePrices(units);
        units.forEach(function (unit) {
          scheduleLines(unit).forEach(fitLine);
        });
      }

      function fitSchedules() {
        var home = document.querySelector("#tab-spec table.home-appliances");
        var devices = document.querySelector("#tab-spec table.device-list");
        var ha = document.querySelector("#tab-spec table.ha-devices");
        tighten(home);
        tighten(devices);
        tighten(ha);
      }

      window.fitScheduleLines = fitSchedules;

      function lockAll() {
        var home = document.querySelector("#tab-spec table.home-appliances");
        var devices = document.querySelector("#tab-spec table.device-list");
        var power = document.querySelector("#tab-spec table.power-tree");
        var ha = document.querySelector("#tab-spec table.devices-table.span-groups:not(.device-list)");
        if (home) lockHome(home);
        if (devices) lockDevices(devices);
        if (power) lockPower(power);
        if (ha) lockHa(ha);
        fitPowerLines();
        fitSchedules();
      }

      requestAnimationFrame(function () { requestAnimationFrame(lockAll); });
      window.addEventListener("resize", function () {
        requestAnimationFrame(lockAll);
      });
      window.addEventListener("load", function () {
        requestAnimationFrame(lockAll);
      });
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { requestAnimationFrame(lockAll); });
      }
    })();

(function () {
      var canvas = document.getElementById("topo-canvas");
      if (!canvas) return;

      var GAP_X = 32;
      var GAP_Y = 10;
      var GAP_MINI = 3;
      var PORT_GAP_MINI = 3;
      var GAP_TB = 36;
      var GAP_CORE = 20;
      var GAP_CORE_DAC = 28;
      var PAD = 16;
      var SLOT_MIN = 28;
      var SLOT_IDLE_MINI = 26;
      var BOX_PAD = 10;
      var BOX_PAD_MINI = 4;

      function poe(kind) {
        if (!kind) return "";
        var href = kind === "wan" ? "#udc-wan"
          : kind === "plus" ? "#udc-poe-plus"
          : kind === "pp" ? "#udc-poe-plusplus"
          : kind === "ppp" ? "#udc-poe-plusplusplus"
          : "#udc-poe";
        return '<svg class="udc-poe" aria-hidden="true"><use href="' + href + '"/></svg>';
      }

      function portHTML(p) {
        var cls = "udc-port " + p.c + (p.idle ? " idle" : "") + (p.dash ? " dash" : "") + (p.loose ? " loose" : "");
        var inner = p.c === "other"
          ? p.t
          : poe(p.poe) + (p.t ? '<span class="udc-sfp-txt">' + p.t + "</span>" : "");
        var port = '<span class="' + cls + '" data-port="' + p.id + '" title="' + p.title + '">' + inner + "</span>";
        return p.count
          ? '<span class="topo-counted-port">' + port + '<span class="topo-port-count">×' + p.count + "</span></span>"
          : port;
      }

      function portsHTML(list) {
        return (list || []).map(portHTML).join("");
      }

      function P(id, c, extra) {
        var p = { id: id, c: c, title: extra.title };
        if (extra.poe) p.poe = extra.poe;
        if (extra.t) p.t = extra.t;
        if (extra.idle) p.idle = true;
        if (extra.dash) p.dash = true;
        if (extra.loose) p.loose = true;
        if (extra.count) p.count = extra.count;
        if (extra.child) p.child = extra.child;
        if (extra.side) p.side = extra.side;
        return p;
      }

      function idleMany(n, prefix, c, extra) {
        var out = [];
        for (var i = 1; i <= n; i++) out.push(P(prefix + i, c, extra));
        return out;
      }

      function downSlots(n, side) {
        var slots = [];
        (n.down || []).forEach(function (p) {
          var portSide = p.side || "right";
          if (side && portSide !== side) return;
          var last = slots[slots.length - 1];
          if (p.child && last && last.child === p.child && last.side === portSide) last.ports.push(p);
          else slots.push({ ports: [p], child: p.child || null, side: portSide });
        });
        return slots;
      }

      function DoorHubSubtrees(branches) {
        return { kind: "door-hub-subtrees", branches: branches };
      }

      var UI = "https://store.ui.com/us/en/products/";
      var nodes = [
        { id: "nah", name: "Nokia XS-250X-A", loc: "Rack Cabinet", href: "https://www.telus.com/en/bc/internet", info: "Preferred TELUS XGS-PON ONT (no Wi-Fi). The jack edge faces the rack rear. 10G RJ45 leaves on a 1 m patch into patch port 24, then a 0.15 m patch up to the UDM CM adapter. If only a NAH is issued, same copper handoff with Port 10G Bridge—do not stack ONT+NAH.",
          up: [P("nah-pon", "other", { t: "F", title: "XGS-PON fiber in" })],
          down: idleMany(4, "nah-1g", "gbe1", { title: "1G RJ45 unused", idle: true }).concat([
            P("nah-10g", "gbe10", { poe: "wan", title: "10G RJ45 WAN out · 1 m rear into patch 24 · 0.15 m up to UDM CM adapter", child: "udm" })
          ]) },
        { id: "udm", vlan: "management", name: "UDM-Pro-Max", loc: "Rack Cabinet", href: UI + "udm-pro-max", info: "ONT (or bridged NAH) faces its jack edge rearward. A 1 m patch runs from that jack into patch port 24, a Cat6A keystone coupler; a 0.15 m patch continues up to the RJ45 face of a UACC-CM-RJ45-MG inserted in UDM-Pro-Max WAN SFP+. LAN SFP+ connects directly to USW-Pro-XG-24-PoE by one DAC. LAN 8 reaches UPS 2U Pro management through patch port 23: a 0.15 m patch up from an RJ45–RJ45 keystone coupler, then a 1 m patch from the UPS rear jack into that coupler. The other seven 1G LAN ports stay unused.",
          embed: [
            { name: "UACC-CM-RJ45-MG · RJ45 ↔ SFP+", href: UI + "uacc-cm-rj45-mg" }
          ],
          up: [
            P("udm-wan", "sfp", { poe: "wan", t: "SFP+", title: "WAN SFP+ via UACC-CM-RJ45-MG" }),
            P("udm-wan25", "gbe2p5", { poe: "wan", title: "WAN 2.5G RJ45 unused", idle: true })
          ],
          down: idleMany(7, "udm-lan-idle", "gbe1", { title: "LAN 1G unused", idle: true }).concat([
            P("udm-lan8", "gbe1", { title: "LAN 8 1G → patch 23 → UPS 2U Pro at 100M", child: "ups" }),
            P("udm-lan-sfp", "sfp", { t: "SFP+", title: "LAN SFP+ → UACC-DAC-SFP10", child: "xg" })
          ]) },
        { id: "ups", vlan: "management", name: "UPS 2U Pro", loc: "Rack Cabinet", href: UI + "ups-2u-pro-us", info: "100/10 MbE management jack is on the rear. A 1 m patch lands on patch port 23, an RJ45–RJ45 keystone coupler; a 0.15 m patch continues up to UDM-Pro-Max LAN 8 for adoption and NUT. Two GbE surge in/out ports stay unused; the WAN path is SFP+.",
          up: [P("ups-lan", "fe", { title: "100/10 MbE management ← patch 23 ← UDM LAN 8" })],
          down: idleMany(2, "ups-surge", "gbe1", { title: "GbE surge in/out unused", idle: true }) },
        { id: "xg", vlan: "management", name: "USW-Pro-XG-24-PoE", loc: "Rack Cabinet", href: UI + "usw-pro-xg-24-poe", info: "2×SFP28 + 8×2.5G PoE+++ + 16×10G PoE+++. Unused ports hollow.",
          poeBar: { label: "PoE Output Used", used: 445.9, cap: 720 },
          up: [
            P("xg-sfp", "sfp", { t: "SFP28", title: "SFP28 ← UACC-DAC-SFP10 at 10G" }),
            P("xg-sfp2", "sfp", { t: "SFP28", title: "SFP28 unused", idle: true })
          ],
          down: [
            P("xg-view", "gbe2p5", { poe: "ppp", title: "2.5G PoE+++ → UP-Viewport at 1G", child: "view", side: "left" }),
            P("xg-aps", "gbe2p5", { poe: "ppp", title: "3× 2.5G PoE+++ ports → U7-Pro at 2.5G PoE+", count: 3, child: "group-aps", side: "left" }),
            P("xg-front", "gbe2p5", { poe: "ppp", title: "2.5G PoE+++ → Front UA-Hub-Door-Mini", child: "group-main-doors", side: "left" }),
            P("xg-mud", "gbe2p5", { poe: "ppp", title: "2.5G PoE+++ → Mud UA-Hub-Door-Mini", child: "group-main-doors", side: "left" }),
            P("xg-din", "gbe2p5", { poe: "ppp", title: "2.5G PoE+++ → Dining UA-Hub-Door-Mini", child: "group-main-doors", side: "left" }),
            P("xg-bsmt", "gbe2p5", { poe: "ppp", title: "2.5G PoE+++ → Basement UA-Hub-Door-Mini", child: "group-main-doors", side: "left" }),
            P("xg-ha", "gbe10", { poe: "ppp", title: "10G PoE+++ → HA at 2.5G PoE++", child: "ha" }),
            P("xg-wallpanels", "gbe10", { poe: "ppp", title: "3× 10G PoE+++ ports → Home Assistant PoE Wallpanels at 1G PoE+", count: 3, child: "group-wallpanels" }),
            P("xg-panel", "gbe10", { poe: "ppp", title: "10G → electrical panel meter · PoE off", child: "panel-meter" }),
            P("xg-nas", "gbe10", { poe: "ppp", title: "10G PoE+++ → Synology FS2500 LACP", child: "nas" }),
            P("xg-nas2", "gbe10", { poe: "ppp", title: "10G PoE+++ → Synology FS2500 LACP", child: "nas" }),
            P("xg-room-live", "gbe10", { poe: "ppp", title: "5× USW-Pro-XG-24-PoE Room Drop ports", count: 5, child: "group-room-drops" }),
            P("xg-media-live", "gbe10", { poe: "ppp", title: "10G PoE+++ → Media Room C6A", child: "drop-media" }),
            P("xg-gar", "gbe10", { poe: "ppp", title: "10G PoE+++ → Garage C6A", child: "drop-gar" }),
            P("xg-spare-10g-1", "gbe10", { poe: "ppp", title: "10G PoE+++ spare", idle: true }),
            P("xg-spare-10g-2", "gbe10", { poe: "ppp", title: "10G PoE+++ spare", idle: true })
          ] },
        { id: "nas", vlan: "servers", inbound: "nas-10g", name: "Synology FS2500", loc: "Rack Cabinet", href: "https://www.synology.com/en-us/products/FS2500", info: "1U all-flash · 12×2.5\" SATA SSD. 2×10G LACP to USW-Pro-XG-24-PoE over Cat6 rack patches; 2×1G unused. 2×USB 3.2 + Console unused.",
          up: [
            P("nas-1g1", "gbe1", { title: "1G unused", idle: true }),
            P("nas-1g2", "gbe1", { title: "1G unused", idle: true }),
            P("nas-10g", "gbe10", { title: "10G LACP" }),
            P("nas-10g2", "gbe10", { title: "10G LACP" })
          ],
          down: [
            P("nas-usb1", "other", { t: "USB-3", title: "USB 3.2 unused", idle: true }),
            P("nas-usb2", "other", { t: "USB-3", title: "USB 3.2 unused", idle: true }),
            P("nas-con", "other", { t: "COM", title: "Console unused", idle: true })
          ] },
        { id: "ha", vlan: "servers", name: "ameriDroid PoE Mini PC for Home Assistant", loc: "Rack Cabinet", href: "https://ameridroid.com/products/poe-mini-pc-for-home-assistant", info: "PoE++ IN on a USW-Pro-XG-24-PoE 10G PoE+++ port, negotiated at 2.5G. 4×2.5G Intel I225/I226: one PoE++ IN plus three unused NICs are shown upstream. Three radios each use a stock USB-C to USB-A cable into a USB 2.0-A: ZWA-2 (Z-Wave), ZBT-2 (Zigbee), ZBT-2 (Thread). USB-C and USB 3.0-A unused.",
          embed: [
            { name: "Connect ZWA-2 · Z-Wave", href: "https://www.home-assistant.io/connect/zwa-2/" },
            { name: "Connect ZBT-2 · Zigbee", href: "https://www.home-assistant.io/connect/zbt-2/" },
            { name: "Connect ZBT-2 · Thread", href: "https://www.home-assistant.io/connect/zbt-2/" }
          ],
          /* Cap is min(device port class, upstream port class): PoE++ 60W vs XG PoE+++ 90W. */
          poeBar: { used: 30, cap: 60 },
          up: [
            P("ha-up", "gbe2p5", { poe: "pp", title: "2.5G PoE++ IN ← XG 10G PoE+++" })
          ].concat(idleMany(3, "ha-lan", "gbe2p5", { title: "2.5G LAN unused", idle: true })),
          down: [
            P("ha-hdmi", "other", { t: "HDMI", title: "HDMI 2.0 unused", idle: true }),
            P("ha-dp", "other", { t: "DP", title: "DisplayPort 1.4 unused", idle: true }),
            P("ha-usb2a", "other", { t: "USB-2", title: "USB 2.0-A → ZWA-2 Z-Wave" }),
            P("ha-usb2b", "other", { t: "USB-2", title: "USB 2.0-A → ZBT-2 Zigbee" }),
            P("ha-usb2c", "other", { t: "USB-2", title: "USB 2.0-A → ZBT-2 Thread" }),
            P("ha-usb2d", "other", { t: "USB-2", title: "USB 2.0-A unused", idle: true }),
            P("ha-usb3", "other", { t: "USB-3", title: "USB 3.0-A unused", idle: true }),
            P("ha-usb", "other", { t: "USB-C", title: "USB-C unused", idle: true }),
            P("ha-com", "other", { t: "COM", title: "RS232 unused", idle: true })
          ] },
        { id: "u7b", vlan: "management", name: "U7-Pro", loc: "Basement", href: UI + "u7-pro", info: "2.5G PoE+ from USW-Pro-XG-24-PoE.",
          poeBar: { used: 21, cap: 30 },
          up: [P("u7b-up", "gbe2p5", { poe: "plus", title: "2.5G PoE+" })], down: [] },
        { id: "u7m", vlan: "management", name: "U7-Pro", loc: "Main", href: UI + "u7-pro", info: "2.5G PoE+ from USW-Pro-XG-24-PoE.",
          poeBar: { used: 21, cap: 30 },
          up: [P("u7m-up", "gbe2p5", { poe: "plus", title: "2.5G PoE+" })], down: [] },
        { id: "u7u", vlan: "management", name: "U7-Pro", loc: "Upper", href: UI + "u7-pro", info: "2.5G PoE+ from USW-Pro-XG-24-PoE.",
          poeBar: { used: 21, cap: 30 },
          up: [P("u7u-up", "gbe2p5", { poe: "plus", title: "2.5G PoE+" })], down: [] },
        { id: "drop-media", name: "UACC-Keystone-Jack-C6A", loc: "Basement/Media Room", href: UI + "uacc-keystone-jack-c6a", info: "C6A home-run on a single-port plate → Cat6 short patch → USW-Flex-2.5G-8 10G RJ45 uplink with PoE+ input.",
          up: [P("drop-media-up", "gbe10", { poe: "ppp", title: "10G ← USW-Pro-XG-24-PoE" })],
          down: [P("drop-media-dn", "gbe10", { poe: "ppp", title: "10G PoE+++ pass-through → USW-Flex-2.5G-8 at PoE+", child: "media-flex" })] },
        { id: "media-flex", vlan: "management", name: "USW-Flex-2.5G-8", loc: "Basement/Media Room", href: "https://store.ui.com/us/en/category/switching-utility/products/usw-flex-2-5g-8", info: "Non-PoE model. C6A home-run ends at the wall; a Cat6 short patch feeds its 10G RJ45 uplink and PoE+ input from USW-Pro-XG-24-PoE. No AC / USB-C supply. SFP+ combo left unused. Eight 2.5G downlinks have no PoE output.",
          /* No PoE output, so it reads as a plain PD: draw against its PoE+ input. */
          poeBar: { used: 14, cap: 30 },
          up: [
            P("media-flex-up", "gbe10", { poe: "plus", title: "10G RJ45 uplink · PoE+ input" }),
            P("media-flex-sfp", "sfp", { t: "SFP+", title: "SFP+ combo · unused", idle: true })
          ],
          down: idleMany(8, "media-flex-lan", "gbe2p5", { title: "2.5G RJ45 · no PoE output · unused", idle: true }) },
        { id: "panel-meter", vlan: "iot", name: "Electrical Panel", loc: "Mechanical Room", info: "Line-powered meter at the electrical panel. VLAN 40 · IoT / Energy. Data only, PoE off at the switch. Model not chosen.",
          up: [P("panel-meter-up", "gbe1", { title: "1G ← USW-Pro-XG-24-PoE · PoE off" })],
          down: [] },
        { id: "drop-den", name: "UACC-Keystone-Jack-C6A", loc: "Main/Den", href: UI + "uacc-keystone-jack-c6a", info: "Den's Mac Studio Cat6A on the 2-port plate. The other jack is the HA home-run.",
          up: [P("drop-den-up", "gbe10", { poe: "ppp", title: "10G keystone" })],
          down: [P("drop-den-dn", "gbe10", { poe: "ppp", title: "10G → Mac Studio" })] },
        { id: "drop-master", name: "UACC-Keystone-Jack-C6A", loc: "Upper/Master Bedroom", href: UI + "uacc-keystone-jack-c6a", info: "Patched C6A on a single-port vertical plate.",
          up: [P("drop-master-up", "gbe10", { poe: "ppp", title: "10G keystone" })],
          down: [P("drop-master-dn", "gbe10", { poe: "ppp", title: "10G unused", idle: true })] },
        { id: "drop-br1", name: "UACC-Keystone-Jack-C6A", loc: "Upper/Bedroom 1", href: UI + "uacc-keystone-jack-c6a", info: "Patched C6A. Wall has one jack.",
          up: [P("drop-br1-up", "gbe10", { poe: "ppp", title: "10G keystone" })],
          down: [P("drop-br1-dn", "gbe10", { poe: "ppp", title: "10G unused", idle: true })] },
        { id: "drop-br2", name: "UACC-Keystone-Jack-C6A", loc: "Upper/Bedroom 2", href: UI + "uacc-keystone-jack-c6a", info: "Patched C6A. Wall has one jack.",
          up: [P("drop-br2-up", "gbe10", { poe: "ppp", title: "10G keystone" })],
          down: [P("drop-br2-dn", "gbe10", { poe: "ppp", title: "10G unused", idle: true })] },
        { id: "drop-seat", name: "UACC-Keystone-Jack-C6A", loc: "Upper/Seating Area", href: UI + "uacc-keystone-jack-c6a", info: "Patched C6A. Wall has one jack.",
          up: [P("drop-seat-up", "gbe10", { poe: "ppp", title: "10G keystone" })],
          down: [P("drop-seat-dn", "gbe10", { poe: "ppp", title: "10G unused", idle: true })] },

        { id: "front-mini", vlan: "security", name: "UA-Hub-Door-Mini", loc: "Front Door", href: UI + "ua-hub-door-mini", info: "Uplink PoE++. PoE+ → UVC-G6-Pro-Entry and Frontyard Turret. REX, DPS, LOCK.",
          devicePower: { value: "19W" },
          /* Datasheet limit: 45W aggregated across the hub's PoE outputs. */
          poeBar: { label: "PoE Output Used", used: 33, cap: 45 },
          up: [P("front-mini-up", "gbe1", { poe: "pp", title: "1G PoE++ uplink" })],
          down: [
            P("front-mini-poe1", "gbe1", { poe: "plus", title: "PoE+ → UVC-G6-Pro-Entry", child: "front-entry" }),
            P("front-mini-poe2", "gbe1", { poe: "plus", title: "PoE+ → Frontyard UVC-G6-Pro-Turret", child: "cam-fy" }),
            P("front-mini-rex", "other", { t: "REX", title: "REX unused", idle: true }),
            P("front-mini-dps", "other", { t: "DPS", title: "DPS → UACC-Lock-Strike-Secure-15mm", child: "front-strike" }),
            P("front-mini-lock", "other", { t: "LOCK", title: "LOCK 12V → UACC-Lock-Strike-Secure-15mm", child: "front-strike" })
          ] },
        { id: "front-entry", vlan: "security", hideLoc: true, name: "UVC-G6-Pro-Entry", loc: "Front Door", href: UI + "uvc-g6-pro-entry", info: "PoE+ from Front UA-Hub-Door-Mini.",
          poeBar: { used: 18, cap: 30 },
          up: [P("front-entry-up", "gbe1", { poe: "plus", title: "1G PoE+" })], down: [] },
        { id: "front-strike", hideLoc: true, name: "UACC-Lock-Strike-Secure-15mm", loc: "Front Door", href: UI + "uacc-lock-strike-secure-15mm", info: "DPS + LOCK 12V from Front UA-Hub-Door-Mini.",
          up: [P("front-strike-dps", "other", { t: "DPS", title: "DPS" }), P("front-strike-lock", "other", { t: "LOCK", title: "LOCK 12V" })], down: [] },

        { id: "mud-mini", vlan: "security", name: "UA-Hub-Door-Mini", loc: "Main/Mud/Back Door", href: UI + "ua-hub-door-mini", info: "Uplink PoE++. PoE → UA-UA-G3 and Backyard Turret. REX, DPS, LOCK.",
          devicePower: { value: "19W" },
          poeBar: { label: "PoE Output Used", used: 20, cap: 45 },
          up: [P("mud-mini-up", "gbe1", { poe: "pp", title: "1G PoE++ uplink" })],
          down: [
            P("mud-mini-poe1", "gbe1", { poe: "plus", title: "1G PoE+ port → UA-G3 at 100M PoE", child: "mud-g3" }),
            P("mud-mini-poe2", "gbe1", { poe: "plus", title: "PoE+ → Backyard UVC-G6-Pro-Turret", child: "cam-by" }),
            P("mud-mini-rex", "other", { t: "REX", title: "REX unused", idle: true }),
            P("mud-mini-dps", "other", { t: "DPS", title: "DPS → UACC-Lock-Strike-Secure-15mm", child: "mud-strike" }),
            P("mud-mini-lock", "other", { t: "LOCK", title: "LOCK 12V → UACC-Lock-Strike-Secure-15mm", child: "mud-strike" })
          ] },
        { id: "mud-g3", vlan: "security", hideLoc: true, name: "UA-G3", loc: "Main/Mud/Back Door", href: UI + "ua-g3", info: "PoE from Mud UA-Hub-Door-Mini.",
          poeBar: { used: 5, cap: 15.4 },
          up: [P("mud-g3-up", "fe", { poe: "poe", title: "100M PoE" })], down: [] },
        { id: "mud-strike", hideLoc: true, name: "UACC-Lock-Strike-Secure-15mm", loc: "Main/Mud/Back Door", href: UI + "uacc-lock-strike-secure-15mm", info: "DPS + LOCK 12V from Mud UA-Hub-Door-Mini.",
          up: [P("mud-strike-dps", "other", { t: "DPS", title: "DPS" }), P("mud-strike-lock", "other", { t: "LOCK", title: "LOCK 12V" })], down: [] },

        { id: "din-mini", vlan: "security", name: "UA-Hub-Door-Mini", loc: "Main/Dining/Back Door", href: UI + "ua-hub-door-mini", info: "Uplink PoE++. PoE → UA-UA-G3 and Walkway Bullet. REX, DPS, LOCK.",
          devicePower: { value: "19W" },
          poeBar: { label: "PoE Output Used", used: 20, cap: 45 },
          up: [P("din-mini-up", "gbe1", { poe: "pp", title: "1G PoE++ uplink" })],
          down: [
            P("din-mini-poe1", "gbe1", { poe: "plus", title: "1G PoE+ port → UA-G3 at 100M PoE", child: "din-g3" }),
            P("din-mini-poe2", "gbe1", { poe: "plus", title: "PoE+ → Walkway UVC-G6-Pro-Bullet", child: "walk" }),
            P("din-mini-rex", "other", { t: "REX", title: "REX unused", idle: true }),
            P("din-mini-dps", "other", { t: "DPS", title: "DPS → UACC-Lock-Strike-Secure-15mm", child: "din-strike" }),
            P("din-mini-lock", "other", { t: "LOCK", title: "LOCK 12V → UACC-Lock-Strike-Secure-15mm", child: "din-strike" })
          ] },
        { id: "din-g3", vlan: "security", hideLoc: true, name: "UA-G3", loc: "Main/Dining/Back Door", href: UI + "ua-g3", info: "PoE from Dining UA-Hub-Door-Mini.",
          poeBar: { used: 5, cap: 15.4 },
          up: [P("din-g3-up", "fe", { poe: "poe", title: "100M PoE" })], down: [] },
        { id: "din-strike", hideLoc: true, name: "UACC-Lock-Strike-Secure-15mm", loc: "Main/Dining/Back Door", href: UI + "uacc-lock-strike-secure-15mm", info: "DPS + LOCK 12V from Dining UA-Hub-Door-Mini.",
          up: [P("din-strike-dps", "other", { t: "DPS", title: "DPS" }), P("din-strike-lock", "other", { t: "LOCK", title: "LOCK 12V" })], down: [] },

        { id: "bsmt-mini", vlan: "security", name: "UA-Hub-Door-Mini", loc: "Basement/Back Door", href: UI + "ua-hub-door-mini", info: "Uplink PoE++. PoE → UA-UA-G3 and Courtyard Turret. REX, DPS, LOCK.",
          devicePower: { value: "19W" },
          poeBar: { label: "PoE Output Used", used: 20, cap: 45 },
          up: [P("bsmt-mini-up", "gbe1", { poe: "pp", title: "1G PoE++ uplink" })],
          down: [
            P("bsmt-mini-poe1", "gbe1", { poe: "plus", title: "1G PoE+ port → UA-G3 at 100M PoE", child: "bsmt-g3" }),
            P("bsmt-mini-poe2", "gbe1", { poe: "plus", title: "PoE+ → Courtyard UVC-G6-Pro-Turret", child: "cam-ct" }),
            P("bsmt-mini-rex", "other", { t: "REX", title: "REX unused", idle: true }),
            P("bsmt-mini-dps", "other", { t: "DPS", title: "DPS → UACC-Lock-Strike-Secure-15mm", child: "bsmt-strike" }),
            P("bsmt-mini-lock", "other", { t: "LOCK", title: "LOCK 12V → UACC-Lock-Strike-Secure-15mm", child: "bsmt-strike" })
          ] },
        { id: "bsmt-g3", vlan: "security", hideLoc: true, name: "UA-G3", loc: "Basement/Back Door", href: UI + "ua-g3", info: "PoE from Basement UA-Hub-Door-Mini.",
          poeBar: { used: 5, cap: 15.4 },
          up: [P("bsmt-g3-up", "fe", { poe: "poe", title: "100M PoE" })], down: [] },
        { id: "bsmt-strike", hideLoc: true, name: "UACC-Lock-Strike-Secure-15mm", loc: "Basement/Back Door", href: UI + "uacc-lock-strike-secure-15mm", info: "DPS + LOCK 12V from Basement UA-Hub-Door-Mini.",
          up: [P("bsmt-strike-dps", "other", { t: "DPS", title: "DPS" }), P("bsmt-strike-lock", "other", { t: "LOCK", title: "LOCK 12V" })], down: [] },

        { id: "view", vlan: "security", name: "UP-Viewport", loc: "Main/Kitchen", href: UI + "ufp-viewport", info: "1G PoE from a USW-Pro-XG-24-PoE 2.5G PoE+++ port.",
          poeBar: { used: 9.5, cap: 15.4 },
          up: [P("view-up", "gbe1", { poe: "poe", title: "1G PoE" })], down: [] },
        { id: "cam-fy", vlan: "security", name: "UVC-G6-Pro-Turret", loc: "Frontyard/Front Eave/North East", href: UI + "uvc-g6-pro-turret", info: "1G PoE+ from Front UA-Hub-Door-Mini.",
          poeBar: { used: 15, cap: 30 },
          up: [P("cam-fy-up", "gbe1", { poe: "plus", title: "1G PoE+" })], down: [] },
        { id: "cam-by", vlan: "security", name: "UVC-G6-Pro-Turret", loc: "Backyard/Balcony Eave/South West", href: UI + "uvc-g6-pro-turret", info: "1G PoE+ from Mud UA-Hub-Door-Mini.",
          poeBar: { used: 15, cap: 30 },
          up: [P("cam-by-up", "gbe1", { poe: "plus", title: "1G PoE+" })], down: [] },
        { id: "cam-ct", vlan: "security", name: "UVC-G6-Pro-Turret", loc: "Courtyard/Eave", href: UI + "uvc-g6-pro-turret", info: "1G PoE+ from Basement UA-Hub-Door-Mini.",
          poeBar: { used: 15, cap: 30 },
          up: [P("cam-ct-up", "gbe1", { poe: "plus", title: "1G PoE+" })], down: [] },

        { id: "wp-b", vlan: "iot", name: "Home Assistant PoE Wallpanel", loc: "Basement Wall Mount", info: "1G PoE+ uplink · 30W reserved (HAT (C) IEEE 802.3at max).",
          poeBar: { used: 30, cap: 30 },
          up: [P("wp-b-up", "gbe1", { poe: "plus", title: "1G PoE+" })], down: [] },
        { id: "wp-m", vlan: "iot", name: "Home Assistant PoE Wallpanel", loc: "Main Wall Mount", info: "1G PoE+ uplink · 30W reserved (HAT (C) IEEE 802.3at max).",
          poeBar: { used: 30, cap: 30 },
          up: [P("wp-m-up", "gbe1", { poe: "plus", title: "1G PoE+" })], down: [] },
        { id: "wp-u", vlan: "iot", name: "Home Assistant PoE Wallpanel", loc: "Upper Wall Mount", info: "1G PoE+ uplink · 30W reserved (HAT (C) IEEE 802.3at max).",
          poeBar: { used: 30, cap: 30 },
          up: [P("wp-u-up", "gbe1", { poe: "plus", title: "1G PoE+" })], down: [] },

        { id: "drop-gar", name: "UACC-Keystone-Jack-C6A", loc: "Garage", href: UI + "uacc-keystone-jack-c6a", info: "C6A home-run → Type 4 / 4PPoE Cat6 short patch → USW-Flex-2.5G-8-PoE 10G RJ45 uplink with PoE+++.",
          up: [P("drop-gar-xg", "gbe10", { poe: "ppp", title: "10G ← USW-Pro-XG-24-PoE" })],
          down: [P("drop-gar-flex", "gbe10", { poe: "ppp", title: "10G → USW-Flex-2.5G-8-PoE 10G RJ45", child: "flex" })] },
        { id: "flex", vlan: "management", name: "USW-Flex-2.5G-8-PoE", loc: "Garage", href: UI + "usw-flex-2-5g-8-poe", info: "C6A home-run ends at the wall; a Cat6 short patch feeds its 10G RJ45 uplink and PoE+++ input from USW-Pro-XG-24-PoE. No AC adapter. SFP+ combo left unused. Eight 2.5G PoE++ downlinks.",
          devicePower: { value: "14W" },
          poeBar: { label: "PoE Output Used", used: 55.4, cap: 76 },
          up: [
            P("flex-up", "gbe10", { poe: "ppp", title: "10G RJ45 uplink · PoE+++ input" }),
            P("flex-sfp", "sfp", { t: "SFP+", title: "SFP+ combo · unused", idle: true })
          ],
          down: [
            P("flex-lite", "gbe2p5", { poe: "pp", title: "2.5G PoE++ port → U7-Lite at PoE", child: "lite" }),
            P("flex-usl", "gbe2p5", { poe: "pp", title: "2.5G PoE++ port → USL at 100M PoE", child: "usl" }),
            P("flex-tesla", "gbe2p5", { poe: "pp", title: "2.5G PoE++ port → PW3 Leader at 1G", child: "pw-lead" }),
            P("flex-gmin", "gbe2p5", { poe: "pp", title: "2.5G PoE++ → Garage UA-Hub-Door-Mini", child: "group-garage-door" }),
            P("flex-x1", "gbe2p5", { poe: "pp", title: "2.5G PoE++ unused", idle: true }),
            P("flex-x2", "gbe2p5", { poe: "pp", title: "2.5G PoE++ unused", idle: true }),
            P("flex-x3", "gbe2p5", { poe: "pp", title: "2.5G PoE++ unused", idle: true }),
            P("flex-x4", "gbe2p5", { poe: "pp", title: "2.5G PoE++ unused", idle: true })
          ] },
        { id: "lite", vlan: "management", name: "U7-Lite", loc: "Garage", href: UI + "u7-lite", info: "2.5G PoE from USW-Flex-2.5G-8-PoE.",
          poeBar: { used: 13, cap: 15.4 },
          up: [P("lite-up", "gbe2p5", { poe: "poe", title: "2.5G PoE" })], down: [] },
        { id: "gar-mini", vlan: "security", name: "UA-Hub-Door-Mini", loc: "Garage Door", href: UI + "ua-hub-door-mini", info: "Uplink from USW-Flex-2.5G-8-PoE. PoE → UA-UA-G3 and Laneway Turret. REX, DPS, LOCK.",
          devicePower: { value: "19W" },
          poeBar: { label: "PoE Output Used", used: 20, cap: 45 },
          up: [P("gar-mini-up", "gbe1", { poe: "pp", title: "1G PoE++ uplink" })],
          down: [
            P("gar-mini-poe1", "gbe1", { poe: "plus", title: "1G PoE+ port → UA-G3 at 100M PoE", child: "gar-g3" }),
            P("gar-mini-poe2", "gbe1", { poe: "plus", title: "PoE+ → Laneway UVC-G6-Pro-Turret", child: "lane" }),
            P("gar-mini-rex", "other", { t: "REX", title: "REX unused", idle: true }),
            P("gar-mini-dps", "other", { t: "DPS", title: "DPS → UACC-Lock-Strike-Secure-15mm", child: "gar-strike" }),
            P("gar-mini-lock", "other", { t: "LOCK", title: "LOCK 12V → UACC-Lock-Strike-Secure-15mm", child: "gar-strike" })
          ] },
        { id: "gar-g3", vlan: "security", hideLoc: true, name: "UA-G3", loc: "Garage Door", href: UI + "ua-g3", info: "PoE from Garage UA-Hub-Door-Mini.",
          poeBar: { used: 5, cap: 15.4 },
          up: [P("gar-g3-up", "fe", { poe: "poe", title: "100M PoE" })], down: [] },
        { id: "gar-strike", hideLoc: true, name: "UACC-Lock-Strike-Secure-15mm", loc: "Garage Door", href: UI + "uacc-lock-strike-secure-15mm", info: "DPS + LOCK 12V from Garage UA-Hub-Door-Mini.",
          up: [P("gar-strike-dps", "other", { t: "DPS", title: "DPS" }), P("gar-strike-lock", "other", { t: "LOCK", title: "LOCK 12V" })], down: [] },
        { id: "walk", vlan: "security", name: "UVC-G6-Pro-Bullet", loc: "Walkway/Balcony Eave/South East", href: UI + "uvc-g6-pro-bullet", info: "1G PoE+ from Dining UA-Hub-Door-Mini.",
          poeBar: { used: 15, cap: 30 },
          up: [P("walk-up", "gbe1", { poe: "plus", title: "1G PoE+" })], down: [] },
        { id: "lane", vlan: "security", name: "UVC-G6-Pro-Turret", loc: "Laneway/Garage/South", href: UI + "uvc-g6-pro-turret", info: "1G PoE+ from Garage UA-Hub-Door-Mini.",
          poeBar: { used: 15, cap: 30 },
          up: [P("lane-up", "gbe1", { poe: "plus", title: "1G PoE+" })], down: [] },
        { id: "usl", vlan: "iot", name: "USL-Gateway", loc: "Garage", href: UI + "usl-gateway", info: "100M PoE from USW-Flex-2.5G-8-PoE.",
          poeBar: { used: 3.4, cap: 15.4 },
          up: [P("usl-up", "fe", { poe: "poe", title: "100M PoE" })], down: [] },
        { id: "pw-lead", vlan: "iot", name: "Tesla Powerwall 3 (Leader)", loc: "Garage", href: "https://www.tesla.com/powerwall", info: "LAN from USW-Flex-2.5G-8-PoE. ETH → Follower. CAN → GW3.",
          up: [P("pw-lead-lan", "gbe1", { title: "1G ← USW-Flex-2.5G-8-PoE" })],
          down: [P("pw-lead-eth", "gbe1", { title: "1G → Follower", child: "pw-follow" }), P("pw-lead-can", "other", { t: "CAN", title: "CAN → GW3", child: "gw3" })] },
        { id: "pw-follow", vlan: "iot", name: "Tesla Powerwall 3 (Follower)", loc: "Garage", href: "https://www.tesla.com/powerwall", info: "Same ports as Leader: 2×ETH + CAN. Second ETH and CAN unused.",
          up: [P("pw-follow-eth", "gbe1", { title: "1G ← Leader" })],
          down: [
            P("pw-follow-2", "gbe1", { title: "1G unused", idle: true }),
            P("pw-follow-can", "other", { t: "CAN", title: "CAN unused", idle: true })
          ] },
        { id: "gw3", name: "Tesla Gateway 3", loc: "Garage", href: "https://energylibrary.tesla.com/docs/Public/EnergyStorage/Powerwall/General/Datasheet/Gateway/3/en-us/Gateway-3-Datasheet.pdf", info: "CAN from Leader only.",
          up: [P("gw3-can", "other", { t: "CAN", title: "CAN ← Leader" })], down: [] },

        { id: "group-wallpanels", name: "Home Assistant PoE Wallpanel ×3", info: "Three identical USW-Pro-XG-24-PoE 10G PoE+++ ports feed Wallpanel runs at 1G PoE+ · 30W (HAT (C) IEEE 802.3at max); locations are listed at right.",
          up: [P("wp-b-up", "gbe1", { poe: "plus", title: "1G PoE+" })], down: [],
          bundle: {
            kind: "single", count: 3, source: "wp-b",
            locations: ["Basement Wall Mount", "Main Wall Mount", "Upper Wall Mount"]
          } },
        { id: "group-aps", name: "U7-Pro ×3", info: "Three identical USW-Pro-XG-24-PoE 2.5G PoE+++ ports feed U7-Pro runs at 2.5G PoE+; locations are listed at left.",
          up: [P("u7b-up", "gbe2p5", { poe: "plus", title: "2.5G PoE+" })], down: [],
          bundle: {
            kind: "single", count: 3, source: "u7b",
            locations: ["Basement", "Main", "Upper"]
          } },
        { id: "group-main-doors", name: "Main House UA-Hub-Door-Mini Subtrees ×4", info: "Four USW-Pro-XG-24-PoE-fed UA-Hub-Door-Mini branches. Each row preserves its individual uplink, reader, Protect camera, strike, ports, and real SVG links.",
          up: [
            P("front-mini-up", "gbe1", { poe: "pp", title: "Front UA-Hub-Door-Mini 1G PoE++ uplink" }),
            P("mud-mini-up", "gbe1", { poe: "pp", title: "Mud UA-Hub-Door-Mini 1G PoE++ uplink" }),
            P("din-mini-up", "gbe1", { poe: "pp", title: "Dining UA-Hub-Door-Mini 1G PoE++ uplink" }),
            P("bsmt-mini-up", "gbe1", { poe: "pp", title: "Basement UA-Hub-Door-Mini 1G PoE++ uplink" })
          ], down: [],
          bundle: DoorHubSubtrees([
              { mini: "front-mini", reader: "front-entry", camera: "cam-fy", strike: "front-strike" },
              { mini: "mud-mini", reader: "mud-g3", camera: "cam-by", strike: "mud-strike" },
              { mini: "din-mini", reader: "din-g3", camera: "walk", strike: "din-strike" },
              { mini: "bsmt-mini", reader: "bsmt-g3", camera: "cam-ct", strike: "bsmt-strike" }
          ]) },
        { id: "group-garage-door", name: "Garage UA-Hub-Door-Mini Subtree", info: "Garage UA-Hub-Door-Mini branch rendered by the shared UA-Hub-Door-Mini subtree component.",
          up: [P("gar-mini-up", "gbe1", { poe: "pp", title: "Garage UA-Hub-Door-Mini 1G PoE++ uplink" })], down: [],
          bundle: DoorHubSubtrees([
            { mini: "gar-mini", reader: "gar-g3", camera: "lane", strike: "gar-strike" }
          ]) },
        { id: "group-room-drops", name: "Room Drop ×5", info: "Five Cat6A runs connect to USW-Pro-XG-24-PoE. Den's other wall jack is the HA home-run, drawn separately. Locations are listed at right.",
          up: [P("drop-den-up", "gbe10", { poe: "ppp", title: "10G keystone" })], down: [],
          bundle: {
            kind: "room", count: 5,
            rows: [
              { source: "drop-den" }
            ],
            locations: ["Main/Den", "Upper/Master Bedroom", "Upper/Bedroom 1", "Upper/Bedroom 2", "Upper/Seating Area"]
          } }
      ];

      function compactIdlePorts(list) {
        var out = [];
        var grouped = {};
        (list || []).forEach(function (port) {
          if (!port.idle || port.child) {
            out.push(port);
            return;
          }
          var key = [port.c, port.poe || "", port.t || "", port.dash ? "dash" : "", port.loose ? "loose" : ""].join("|");
          if (!grouped[key]) {
            grouped[key] = Object.assign({}, port, { count: port.count || 1 });
            out.push(grouped[key]);
          } else {
            grouped[key].count += port.count || 1;
          }
        });
        out.forEach(function (port) {
          if (port.count === 1) delete port.count;
        });
        return out;
      }

      nodes.forEach(function (node) {
        node.up = compactIdlePorts(node.up);
        node.down = compactIdlePorts(node.down);
        if (node.right) node.right = compactIdlePorts(node.right);
      });

      var children = {
        nah: ["udm"],
        udm: ["xg", "ups"],
        xg: ["view", "group-aps", "group-main-doors", "ha", "group-wallpanels", "panel-meter", "nas", "group-room-drops", "drop-media", "drop-gar"],
        "drop-media": ["media-flex"],
        "drop-gar": ["flex"],
        flex: ["lite", "usl", "pw-lead", "group-garage-door"],
        "pw-lead": ["pw-follow", "gw3"]
      };

      var links = [
        { from: "nah", fp: "nah-10g", to: "udm", tp: "udm-wan", cable: "cat6", route: "vertical", info: "ONT/NAH 10G RJ45 → 1 m rear into patch port 24 → 0.15 m up to CM RJ45; CM SFP+ is inserted in UDM-Pro-Max WAN." },
        { from: "udm", fp: "udm-lan-sfp", to: "xg", tp: "xg-sfp", cable: "dac", route: "vertical", label: "UACC-DAC-SFP10", href: UI + "10gbps-direct-attach-cable", info: "One UACC-DAC-SFP10: UDM-Pro-Max LAN SFP+ → USW-Pro-XG-24-PoE SFP28 at 10G." },
        { from: "udm", fp: "udm-lan8", to: "ups", tp: "ups-lan", cable: "cat6", route: "horizontal", info: "UDM-Pro-Max LAN 8 → 0.15 m up from patch port 23 → 1 m from the coupler to the UPS 2U Pro rear 100/10 MbE management jack." },
        { from: "xg", fp: "xg-nas", to: "nas", tp: "nas-10g", cable: "cat6", info: "USW-Pro-XG-24-PoE 10G → Cat6 rack patch → Synology FS2500 LACP." },
        { from: "xg", fp: "xg-nas2", to: "nas", tp: "nas-10g2", cable: "cat6", info: "USW-Pro-XG-24-PoE 10G → Cat6 rack patch → Synology FS2500 LACP." },
        { from: "xg", fp: "xg-ha", to: "ha", tp: "ha-up", cable: "cat6", info: "USW-Pro-XG-24-PoE 10G PoE+++ port → Cat6 rack patch → ameriDroid PoE Mini PC for Home Assistant at 2.5G PoE++." },
        { from: "xg", fp: "xg-gar", to: "drop-gar", tp: "drop-gar-xg", info: "USW-Pro-XG-24-PoE → Garage C6A." },
        { from: "drop-gar", fp: "drop-gar-flex", to: "flex", tp: "flex-up", cable: "cat6", info: "Garage C6A home-run → Type 4 / 4PPoE-rated 24–26AWG pure-copper Cat6 short patch → USW-Flex-2.5G-8-PoE 10G RJ45 / PoE+++ input." },
        { from: "xg", fp: "xg-view", to: "view", tp: "view-up", info: "USW-Pro-XG-24-PoE 2.5G PoE+++ port → UP-Viewport at 1G PoE." },
        { from: "flex", fp: "flex-usl", to: "usl", tp: "usl-up", info: "Flex 2.5G PoE++ port → USL-Gateway at 100M PoE." },
        { from: "flex", fp: "flex-tesla", to: "pw-lead", tp: "pw-lead-lan", info: "Flex 2.5G PoE++ port → PW3 Leader at 1G; PoE disabled at the endpoint." },
        { from: "flex", fp: "flex-lite", to: "lite", tp: "lite-up", info: "Flex 2.5G PoE++ port → U7-Lite at 2.5G PoE." },
        { from: "pw-lead", fp: "pw-lead-eth", to: "pw-follow", tp: "pw-follow-eth", info: "Leader Ethernet → Follower." },
        { from: "pw-lead", fp: "pw-lead-can", to: "gw3", tp: "gw3-can", info: "Leader CAN → Gateway 3." },
        { from: "xg", fp: "xg-wallpanels", to: "group-wallpanels", tp: "wp-b-up", info: "3× USW-Pro-XG-24-PoE 10G PoE+++ ports → Home Assistant PoE Wallpanels at 1G PoE+." },
        { from: "xg", fp: "xg-aps", to: "group-aps", tp: "u7b-up", info: "3× USW-Pro-XG-24-PoE 2.5G PoE+++ ports → U7-Pro at 2.5G PoE+." },
        { from: "xg", fp: "xg-front", to: "group-main-doors", tp: "front-mini-up", info: "USW-Pro-XG-24-PoE → Front UA-Hub-Door-Mini." },
        { from: "xg", fp: "xg-mud", to: "group-main-doors", tp: "mud-mini-up", info: "USW-Pro-XG-24-PoE → Mud UA-Hub-Door-Mini." },
        { from: "xg", fp: "xg-din", to: "group-main-doors", tp: "din-mini-up", info: "USW-Pro-XG-24-PoE → Dining UA-Hub-Door-Mini." },
        { from: "xg", fp: "xg-bsmt", to: "group-main-doors", tp: "bsmt-mini-up", info: "USW-Pro-XG-24-PoE → Basement UA-Hub-Door-Mini." },
        { from: "front-mini", fp: "front-mini-poe1", to: "front-entry", tp: "front-entry-up", route: "horizontal", info: "Front UA-Hub-Door-Mini PoE+ → UVC-G6-Pro-Entry." },
        { from: "front-mini", fp: "front-mini-poe2", to: "cam-fy", tp: "cam-fy-up", cable: "cat6", route: "horizontal", info: "Front UA-Hub-Door-Mini PoE+ → Frontyard UVC-G6-Pro-Turret." },
        { from: "front-mini", fp: "front-mini-lock", to: "front-strike", tp: "front-strike-lock", route: "horizontal", info: "Front UA-Hub-Door-Mini LOCK → UACC-Lock-Strike-Secure-15mm." },
        { from: "front-mini", fp: "front-mini-dps", to: "front-strike", tp: "front-strike-dps", route: "horizontal", info: "Front UA-Hub-Door-Mini DPS → UACC-Lock-Strike-Secure-15mm." },
        { from: "mud-mini", fp: "mud-mini-poe1", to: "mud-g3", tp: "mud-g3-up", route: "horizontal", info: "Mud UA-Hub-Door-Mini 1G PoE+ port → UA-G3 at 100M PoE." },
        { from: "mud-mini", fp: "mud-mini-poe2", to: "cam-by", tp: "cam-by-up", cable: "cat6", route: "horizontal", info: "Mud UA-Hub-Door-Mini PoE+ → Backyard UVC-G6-Pro-Turret." },
        { from: "mud-mini", fp: "mud-mini-lock", to: "mud-strike", tp: "mud-strike-lock", route: "horizontal", info: "Mud UA-Hub-Door-Mini LOCK → UACC-Lock-Strike-Secure-15mm." },
        { from: "mud-mini", fp: "mud-mini-dps", to: "mud-strike", tp: "mud-strike-dps", route: "horizontal", info: "Mud UA-Hub-Door-Mini DPS → UACC-Lock-Strike-Secure-15mm." },
        { from: "din-mini", fp: "din-mini-poe1", to: "din-g3", tp: "din-g3-up", route: "horizontal", info: "Dining UA-Hub-Door-Mini 1G PoE+ port → UA-G3 at 100M PoE." },
        { from: "din-mini", fp: "din-mini-poe2", to: "walk", tp: "walk-up", cable: "cat6", route: "horizontal", info: "Dining UA-Hub-Door-Mini PoE+ → Walkway UVC-G6-Pro-Bullet." },
        { from: "din-mini", fp: "din-mini-lock", to: "din-strike", tp: "din-strike-lock", route: "horizontal", info: "Dining UA-Hub-Door-Mini LOCK → UACC-Lock-Strike-Secure-15mm." },
        { from: "din-mini", fp: "din-mini-dps", to: "din-strike", tp: "din-strike-dps", route: "horizontal", info: "Dining UA-Hub-Door-Mini DPS → UACC-Lock-Strike-Secure-15mm." },
        { from: "bsmt-mini", fp: "bsmt-mini-poe1", to: "bsmt-g3", tp: "bsmt-g3-up", route: "horizontal", info: "Basement UA-Hub-Door-Mini 1G PoE+ port → UA-G3 at 100M PoE." },
        { from: "bsmt-mini", fp: "bsmt-mini-poe2", to: "cam-ct", tp: "cam-ct-up", cable: "cat6", route: "horizontal", info: "Basement UA-Hub-Door-Mini PoE+ → Courtyard UVC-G6-Pro-Turret." },
        { from: "bsmt-mini", fp: "bsmt-mini-lock", to: "bsmt-strike", tp: "bsmt-strike-lock", route: "horizontal", info: "Basement UA-Hub-Door-Mini LOCK → UACC-Lock-Strike-Secure-15mm." },
        { from: "bsmt-mini", fp: "bsmt-mini-dps", to: "bsmt-strike", tp: "bsmt-strike-dps", route: "horizontal", info: "Basement UA-Hub-Door-Mini DPS → UACC-Lock-Strike-Secure-15mm." },
        { from: "flex", fp: "flex-gmin", to: "group-garage-door", tp: "gar-mini-up", info: "Flex 2.5G PoE++ port → Garage UA-Hub-Door-Mini at 1G PoE++." },
        { from: "gar-mini", fp: "gar-mini-poe1", to: "gar-g3", tp: "gar-g3-up", route: "horizontal", info: "Garage UA-Hub-Door-Mini PoE+ port → UA-G3 at 100M PoE." },
        { from: "gar-mini", fp: "gar-mini-poe2", to: "lane", tp: "lane-up", cable: "cat6", route: "horizontal", info: "Garage UA-Hub-Door-Mini PoE+ → Laneway UVC-G6-Pro-Turret." },
        { from: "gar-mini", fp: "gar-mini-lock", to: "gar-strike", tp: "gar-strike-lock", route: "horizontal", info: "Garage UA-Hub-Door-Mini LOCK → UACC-Lock-Strike-Secure-15mm." },
        { from: "gar-mini", fp: "gar-mini-dps", to: "gar-strike", tp: "gar-strike-dps", route: "horizontal", info: "Garage UA-Hub-Door-Mini DPS → UACC-Lock-Strike-Secure-15mm." },
        { from: "xg", fp: "xg-room-live", to: "group-room-drops", tp: "drop-den-up", info: "5× USW-Pro-XG-24-PoE → Room Drop." },
        { from: "xg", fp: "xg-media-live", to: "drop-media", tp: "drop-media-up", info: "USW-Pro-XG-24-PoE 10G PoE+++ port → Media Room Drop." },
        { from: "drop-media", fp: "drop-media-dn", to: "media-flex", tp: "media-flex-up", cable: "cat6", route: "horizontal", info: "Media Room C6A wall jack → Cat6 short patch → USW-Flex-2.5G-8 10G RJ45 uplink with PoE+ input." },
        { from: "xg", fp: "xg-panel", to: "panel-meter", tp: "panel-meter-up", cable: "cat6", info: "USW-Pro-XG-24-PoE with PoE disabled → electrical panel meter. Data only." }
      ];

      var byId = {};
      nodes.forEach(function (n) { byId[n.id] = n; });

      var stage = document.createElement("div");
      stage.className = "topo-stage";
      canvas.appendChild(stage);

      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "topo-edges");
      svg.setAttribute("aria-hidden", "true");
      var CABLE_COLOR = {
        cat6a: "#e65100",
        cat6: "#1565c0",
        dac: "#111111",
        can: "#00897b",
        lock12: "#8e24aa"
      };
      var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      Object.keys(CABLE_COLOR).forEach(function (kind) {
        var marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        marker.setAttribute("id", "topo-arrow-" + kind);
        marker.setAttribute("markerWidth", "7");
        marker.setAttribute("markerHeight", "7");
        marker.setAttribute("refX", "6");
        marker.setAttribute("refY", "3.5");
        marker.setAttribute("orient", "auto");
        marker.setAttribute("markerUnits", "strokeWidth");
        var mpath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        mpath.setAttribute("d", "M0 0 7 3.5 0 7z");
        mpath.setAttribute("fill", CABLE_COLOR[kind]);
        marker.appendChild(mpath);
        defs.appendChild(marker);
      });
      svg.appendChild(defs);
      stage.appendChild(svg);

      function fmtW(n) {
        var r = Math.round(n * 10) / 10;
        return r === Math.round(r) ? String(Math.round(r)) : String(r);
      }

      function poeBarRow(label, used, cap) {
        var pct = cap ? Math.min(100, (used / cap) * 100) : 0;
        var over = used > cap;
        return '<div class="topo-poe' + (over ? " is-over" : "") + '">' +
          '<div class="topo-poe-head"><span>' + label + "</span>" +
          '<span class="topo-poe-num">' + fmtW(used) + "/" + fmtW(cap) + "W</span></div>" +
          '<div class="topo-poe-track"><span class="topo-poe-fill" style="width:' + pct + '%"></span></div>' +
          "</div>";
      }

      function poeBarHTML(n) {
        if (!n.poeBar) return "";
        if (n.poeBar.modes) {
          return n.poeBar.modes.map(function (m) {
            return poeBarRow(m.label, m.used, m.cap);
          }).join("");
        }
        return poeBarRow(n.poeBar.label || "PoE Power Used", n.poeBar.used, n.poeBar.cap);
      }

      function devicePowerHTML(n) {
        if (!n.devicePower) return "";
        return '<div class="topo-device-power">' +
          "<span>Device Power · w/o PoE output</span>" +
          "<strong>" + n.devicePower.value + "</strong></div>";
      }

      function embedHTML(n) {
        var embeds = (n.embed || []).map(function (e) {
          var name = e.href
            ? '<a class="topo-embed-name" href="' + e.href + '" target="_blank" rel="noopener noreferrer">' + e.name + "</a>"
            : '<span class="topo-embed-name">' + e.name + "</span>";
          return '<span class="topo-embed">' + name + "</span>";
        }).join("");
        return embeds ? '<span class="topo-embeds">' + embeds + "</span>" : "";
      }

      function midHTML(n) {
        var html = n.href
          ? '<a class="topo-name" href="' + n.href + '" target="_blank" rel="noopener noreferrer">' + n.name + "</a>"
          : '<span class="topo-name">' + n.name + "</span>";
        if (n.loc && !n.hideLoc) html += "<small>" + n.loc + "</small>";
        html += embedHTML(n);
        html += devicePowerHTML(n);
        html += poeBarHTML(n);
        return html;
      }

      function downRowHTML(n, side) {
        return downSlots(n, side).map(function (s) {
          return '<span class="topo-slot"' + (s.child ? ' data-child="' + s.child + '"' : "") + ">" + portsHTML(s.ports) + "</span>";
        }).join("");
      }

      function bundleDeviceHTML(id, extraClass, useSlots, showLoc) {
        var n = byId[id];
        if (!n) return "";
        var copy = Object.assign({}, n, { hideLoc: !showLoc });
        return '<div class="topo-bundle-device' + (n.vlan ? " vlan-" + n.vlan : "") + (extraClass ? " " + extraClass : "") + '" data-bundle-source="' + id + '"' + (n.vlan ? ' data-vlan="' + n.vlan + '"' : "") + '>' +
          '<span class="topo-ports up">' + portsHTML(n.up) + "</span>" +
          '<span class="topo-mid">' + midHTML(copy) + "</span>" +
          '<span class="topo-ports down">' + (useSlots ? downRowHTML(n) : portsHTML(n.down)) + "</span>" +
          "</div>";
      }

      function makeBundle(n) {
        var b = n.bundle;
        var box = document.createElement("div");
        box.className = "topo-bundle" + (b.kind === "door-hub-subtrees" ? " topo-bundle-door-matrix" : "");
        box.setAttribute("data-id", n.id);
        box.setAttribute("data-title", n.name);
        box.setAttribute("data-info", n.info);
        box.setAttribute("role", "group");
        box.setAttribute("aria-label", n.name);

        var diagram = "";
        if (b.kind === "single") {
          diagram = '<div class="topo-bundle-row">' +
            bundleDeviceHTML(b.source, "", false) +
            "</div>";
        } else if (b.kind === "room") {
          diagram = b.rows.map(function (row) {
            var isBackup = !!byId[row.source].backup;
            return '<div class="topo-bundle-row">' +
              bundleDeviceHTML(row.source, isBackup ? "topo-backup" : "", false, !!b.showLoc) +
              "</div>";
          }).join("");
        } else if (b.kind === "door-hub-subtrees") {
          diagram = b.branches.map(function (branch) {
              return '<div class="topo-door-matrix-row" data-branch="' + branch.mini + '">' +
                '<div class="topo-door-matrix-branch">' +
                  bundleDeviceHTML(branch.mini, "topo-door-matrix-root", true, true) +
                  '<div class="topo-door-matrix-endpoints">' +
                    bundleDeviceHTML(branch.reader, "topo-door-matrix-endpoint topo-door-matrix-reader", false, false) +
                    bundleDeviceHTML(branch.camera, "topo-door-matrix-endpoint topo-door-matrix-camera", false, true) +
                    bundleDeviceHTML(branch.strike, "topo-door-matrix-endpoint topo-door-matrix-strike", false, false) +
                  "</div>" +
                "</div>" +
              "</div>";
            }).join("");
        }

        var locations = (b.locations || []).map(function (loc) {
          return '<span class="topo-bundle-location">' + loc + "</span>";
        }).join("");
        box.innerHTML = '<div class="topo-bundle-port-gutter" aria-hidden="true"></div>' +
          '<div class="topo-bundle-diagram">' + diagram + "</div>" +
          (locations ? '<div class="topo-bundle-locations" aria-label="Locations">' + locations + "</div>" : "");
        return box;
      }

      function makeNode(n) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "topo-node" + (n.vlan ? " vlan-" + n.vlan : "") + (isTB(n.id) ? " topo-tb" : "") + (n.id === "nah" || n.id === "udm" ? " topo-core-vertical" : "") + (n.id === "xg" ? " topo-xg" : "") + (n.backup ? " topo-backup" : "");
        btn.setAttribute("data-id", n.id);
        if (n.vlan) btn.setAttribute("data-vlan", n.vlan);
        btn.setAttribute("data-title", n.name);
        btn.setAttribute("data-info", n.info);
        if (n.id === "xg") {
          btn.innerHTML =
            '<span class="topo-ports up">' + portsHTML(n.up) + "</span>" +
            '<span class="topo-ports down left">' + downRowHTML(n, "left") + "</span>" +
            '<span class="topo-mid">' + midHTML(n) + "</span>" +
            '<span class="topo-ports down right">' + downRowHTML(n, "right") + "</span>";
        } else {
          btn.innerHTML =
            '<span class="topo-ports up">' + portsHTML(n.up) + "</span>" +
            '<span class="topo-mid">' + midHTML(n) + "</span>" +
            '<span class="topo-ports down">' + downRowHTML(n) + "</span>";
        }
        return btn;
      }

      var els = {};
      function mount(id, parentEl) {
        var n = byId[id];
        if (n.bundle) {
          var bundle = makeBundle(n);
          parentEl.appendChild(bundle);
          els[id] = bundle;
          return;
        }
        var el = makeNode(n);
        parentEl.appendChild(el);
        els[id] = el;
      }

      mount("nah", stage);
      function mountTree(id) {
        (children[id] || []).forEach(function (cid) {
          if (!els[cid]) mount(cid, stage);
          mountTree(cid);
        });
      }
      mountTree("nah");

      var leftFlowRoots = ["view", "group-aps", "group-main-doors"];
      function markFlowLeft(id) {
        if (!els[id]) return;
        els[id].classList.add("flow-left");
        stageKids(id).forEach(markFlowLeft);
      }
      leftFlowRoots.forEach(markFlowLeft);

      Object.keys(els).forEach(function (id) {
        var a = els[id].querySelectorAll("a");
        Array.prototype.forEach.call(a, function (link) {
          link.addEventListener("click", function (ev) { ev.stopPropagation(); });
        });
      });

      var natural = {};
      var subH = {};
      var subW = {};

      function normalizeDoorHubPoeWidths() {
        [
          ".topo-bundle-door-matrix .topo-door-matrix-root > .topo-mid > .topo-poe",
          ".topo-bundle-door-matrix .topo-door-matrix-endpoint > .topo-mid > .topo-poe"
        ].forEach(function (selector) {
          var bars = stage.querySelectorAll(selector);
          var maxWidth = 0;
          Array.prototype.forEach.call(bars, function (bar) {
            bar.style.width = "";
            bar.style.minWidth = "";
          });
          Array.prototype.forEach.call(bars, function (bar) {
            maxWidth = Math.max(maxWidth, bar.getBoundingClientRect().width);
          });
          if (!maxWidth) return;
          var width = Math.ceil(maxWidth * 10) / 10 + "px";
          Array.prototype.forEach.call(bars, function (bar) {
            bar.style.width = width;
            bar.style.minWidth = width;
          });
        });
      }

      function layoutDoorHubRows() {
        Array.prototype.forEach.call(stage.querySelectorAll(".topo-bundle-door-matrix .topo-door-matrix-row"), function (row) {
          var miniId = row.getAttribute("data-branch");
          var root = row.querySelector(".topo-door-matrix-root");
          var col = root ? root.querySelector(":scope > .topo-ports.down") : null;
          var slots = col ? col.querySelectorAll(":scope > .topo-slot") : [];
          if (!col || slots.length < 4) return;
          var cr = col.getBoundingClientRect();
          var matrixSlots = downSlots(byId[miniId]);
          var placed = {};
          [0, 1, 3].forEach(function (index) {
            var slot = slots[index];
            var spec = matrixSlots[index];
            if (!slot || !spec) return;
            var link = links.filter(function (candidate) {
              return candidate.from === miniId && candidate.fp === spec.ports[0].id;
            })[0];
            var target = link ? portEl(link.tp) : null;
            var probe = slot.querySelector("[data-port]");
            if (!target || !probe) return;
            var sr = slot.getBoundingClientRect();
            var pr = probe.getBoundingClientRect();
            var tr = target.getBoundingClientRect();
            var probeOffset = pr.top + pr.height / 2 - sr.top;
            var top = tr.top + tr.height / 2 - cr.top - probeOffset;
            slot.style.position = "absolute";
            slot.style.top = top + "px";
            placed[index] = top;
          });
          if (slots[2] && placed[3] != null) {
            slots[2].style.position = "absolute";
            slots[2].style.top = (placed[3] - slots[2].offsetHeight - PORT_GAP_MINI) + "px";
          }
        });
      }

      function measureNatural() {
        Object.keys(els).forEach(function (id) {
          var el = els[id];
          el.style.width = "";
          el.style.height = "";
          el.style.gridTemplateColumns = "";
          el.classList.remove("is-fanout");
          Array.prototype.forEach.call(el.querySelectorAll(".topo-slot"), function (slot) {
            slot.style.top = "";
            slot.style.left = "";
            slot.style.position = "";
            slot.style.paddingTop = "";
          });
          Array.prototype.forEach.call(el.querySelectorAll(".topo-counted-port, .udc-port.loose"), function (port) {
            port.style.position = "";
            port.style.left = "";
            port.style.top = "";
            port.style.transform = "";
            port.style.translate = "";
          });
          Array.prototype.forEach.call(el.querySelectorAll("[data-port]"), function (port) {
            port.style.position = "";
            port.style.left = "";
            port.style.top = "";
            port.style.transform = "";
            port.style.translate = "";
          });
        });
        normalizeDoorHubPoeWidths();
        layoutDoorHubRows();
        Object.keys(els).forEach(function (id) {
          var el = els[id];
          var r = el.getBoundingClientRect();
          natural[id] = { w: r.width, h: r.height };
        });
      }

      function isTB(id) {
        return id === "nah" || id === "udm";
      }

      function isFanout(id) {
        return downSlots(byId[id] || {}).filter(function (s) { return s.child; }).length > 1;
      }

      function pairedBackupId() {
        return null;
      }

      function isLTRFanout(id) {
        return id !== "xg" && isFanout(id) && !isTB(id);
      }

      function isDoorMini(id) {
        return /-mini$/.test(id || "");
      }

      function gapDown(id) {
        return isDoorMini(id) ? GAP_MINI : GAP_Y;
      }

      function boxPad(id) {
        return isDoorMini(id) ? BOX_PAD_MINI : BOX_PAD;
      }

      function stageKids(id) {
        return children[id] || [];
      }

      function inboundPort(id) {
        var n = byId[id];
        if (n && n.inbound) return n.inbound;
        if (n && n.up && n.up[0]) return n.up[0].id;
        var hit = links.filter(function (L) { return L.to === id; })[0];
        if (hit) return hit.tp;
        return null;
      }

      function slotH(s, parentId) {
        if (s.child) {
          var backupId = pairedBackupId(s.child);
          if (backupId && natural[backupId]) {
            var pairedBranchH = boxHeight(s.child);
            stageKids(s.child).forEach(function (childId) {
              pairedBranchH = Math.max(pairedBranchH, subtreeH(childId));
            });
            return Math.max(SLOT_MIN, pairedBranchH + natural[backupId].h + 8);
          }
          return Math.max(SLOT_MIN, subtreeH(s.child));
        }
        return isDoorMini(parentId) ? SLOT_IDLE_MINI : SLOT_MIN;
      }

      function slotsSum(id) {
        var slots = downSlots(byId[id]);
        return slotsListSum(slots, id);
      }

      function slotsListSum(slots, id, suppliedGap) {
        var g = suppliedGap == null ? gapDown(id) : suppliedGap;
        var s = 0;
        slots.forEach(function (slot, i) {
          s += slotH(slot, id);
          if (i) s += g;
        });
        return s;
      }

      function kidsSumH(id) {
        var kids = stageKids(id);
        var s = 0;
        kids.forEach(function (k, i) { s += subtreeH(k); if (i) s += GAP_Y; });
        return s;
      }

      function boxHeight(id) {
        if (isLTRFanout(id)) return Math.max(natural[id].h, slotsSum(id) + boxPad(id));
        return natural[id].h;
      }

      function subtreeH(id) {
        if (subH[id] != null) return subH[id];
        var bh = boxHeight(id);
        var kids = stageKids(id);
        var h;
        if (isTB(id) && kids.length === 1 && isTB(kids[0])) {
          h = bh + GAP_TB + subtreeH(kids[0]);
        } else if (isTB(id) && kids.length === 1) {
          h = Math.max(bh, subtreeH(kids[0]));
        } else if (isLTRFanout(id)) {
          h = Math.max(bh, slotsSum(id) + boxPad(id));
        } else if (kids.length) {
          h = Math.max(bh, kidsSumH(id));
        } else {
          h = bh;
        }
        subH[id] = h;
        return h;
      }

      function subtreeW(id) {
        if (subW[id] != null) return subW[id];
        var bw = natural[id].w;
        var kids = stageKids(id);
        var w;
        if (isTB(id) && kids.length === 1 && isTB(kids[0])) {
          w = Math.max(bw, subtreeW(kids[0]));
        } else if (kids.length) {
          var maxC = 0;
          kids.forEach(function (k) { maxC = Math.max(maxC, subtreeW(k)); });
          w = bw + GAP_X + maxC;
        } else {
          w = bw;
        }
        subW[id] = w;
        return w;
      }

      function applySlotHeights(id) {
        if (!isLTRFanout(id)) return;
        els[id].classList.add("is-fanout");
      }

      function coverFanout(id) {
        if (!isLTRFanout(id)) return;
        var el = els[id];
        var top = parseFloat(el.style.top || 0);
        var bot = top + (natural[id] ? natural[id].h : 0);
        stageKids(id).forEach(function (cid) {
          var c = els[cid];
          if (!c) return;
          bot = Math.max(bot, parseFloat(c.style.top || 0) + c.offsetHeight);
        });
        el.style.height = Math.max(natural[id].h, bot - top) + "px";
      }

      function pinFanoutUpPorts(id) {
        if (id !== "flex" || !isLTRFanout(id) || !els[id]) return;
        var el = els[id];
        var col = el.querySelector(":scope > .topo-ports.up");
        if (!col) return;
        var inbound = links.filter(function (link) {
          return link.to === id && col.querySelector('[data-port="' + link.tp + '"]');
        })[0];
        if (!inbound) return;
        var source = portEl(inbound.fp);
        var active = col.querySelector('[data-port="' + inbound.tp + '"]');
        if (!source || !active) return;
        var item = active.closest(".topo-counted-port") || active;
        var cr = col.getBoundingClientRect();
        var ir = item.getBoundingClientRect();
        var ar = active.getBoundingClientRect();
        var iconOffset = ar.top + ar.height / 2 - ir.top;
        var targetCenter = cr.top + cr.height / 2;
        var activeTop = targetCenter - cr.top - iconOffset;
        item.style.position = "absolute";
        item.style.left = "50%";
        item.style.top = activeTop + "px";
        item.style.transform = "translateX(-50%)";
        var cursor = activeTop + item.offsetHeight + PORT_GAP_MINI;
        Array.prototype.forEach.call(col.children, function (other) {
          if (other === item || other.contains(item)) return;
          other.style.position = "absolute";
          other.style.left = "50%";
          other.style.top = cursor + "px";
          other.style.transform = "translateX(-50%)";
          cursor += other.offsetHeight + PORT_GAP_MINI;
        });
      }

      function pinCenteredPortBand(row, activePortId) {
        if (!row) return;
        var active = row.querySelector('[data-port="' + activePortId + '"]');
        if (!active) return;
        var item = active.closest(".topo-slot") || active.closest(".topo-counted-port") || active;
        while (item.parentElement !== row && item.parentElement) item = item.parentElement;
        var rr = row.getBoundingClientRect();
        var ir = item.getBoundingClientRect();
        var ar = active.getBoundingClientRect();
        var iconOffsetX = ar.left + ar.width / 2 - ir.left;
        var itemLeft = rr.width / 2 - iconOffsetX;
        item.style.position = "absolute";
        item.style.left = itemLeft + "px";
        item.style.top = Math.max(0, (rr.height - ir.height) / 2) + "px";
        item.style.transform = "none";

        var cursor = itemLeft + ir.width + 6;
        Array.prototype.forEach.call(row.children, function (other) {
          if (other === item || other.contains(item)) return;
          var or = other.getBoundingClientRect();
          other.style.position = "absolute";
          other.style.left = cursor + "px";
          other.style.top = Math.max(0, (rr.height - or.height) / 2) + "px";
          other.style.transform = "none";
          cursor += or.width + 6;
        });
      }

      function pinCorePortBands() {
        if (els.nah) {
          pinCenteredPortBand(els.nah.querySelector(":scope > .topo-ports.up"), "nah-pon");
          pinCenteredPortBand(els.nah.querySelector(":scope > .topo-ports.down"), "nah-10g");
        }
        if (els.udm) {
          pinCenteredPortBand(els.udm.querySelector(":scope > .topo-ports.up"), "udm-wan");
          pinCenteredPortBand(els.udm.querySelector(":scope > .topo-ports.down"), "udm-lan-sfp");
        }
        if (els.xg) {
          pinCenteredPortBand(els.xg.querySelector(":scope > .topo-ports.up"), "xg-sfp");
        }
      }

      function xgSideSlots(side) {
        return downSlots(byId.xg, side);
      }

      function xgBranchSlots(side) {
        var slots = xgSideSlots(side);
        var lastChild = -1;
        slots.forEach(function (slot, index) {
          if (slot.child) lastChild = index;
        });
        return slots.slice(0, lastChild + 1);
      }

      function xgSideGap(side) {
        if (side === "left") return GAP_Y;
        var left = xgBranchSlots("left");
        var right = xgBranchSlots("right");
        var target = slotsListSum(left, "xg", GAP_Y);
        var slotTotal = 0;
        right.forEach(function (slot) { slotTotal += slotH(slot, "xg"); });
        return right.length > 1 ? Math.max(GAP_Y, (target - slotTotal) / (right.length - 1)) : 0;
      }

      function xgSideHeight(side) {
        var slots = xgBranchSlots(side);
        return slotsListSum(slots, "xg", xgSideGap(side));
      }

      function pinXgSidePorts(side) {
        if (!els.xg) return;
        var col = els.xg.querySelector(":scope > .topo-ports." + side);
        if (!col) return;
        var specs = xgSideSlots(side);
        var slots = col.querySelectorAll(":scope > .topo-slot");
        var cr = col.getBoundingClientRect();
        specs.forEach(function (spec, index) {
          var slot = slots[index];
          if (!slot || !spec.child) return;
          var target = portEl(inboundPort(spec.child));
          var probe = slot.querySelector("[data-port]");
          if (!target || !probe) return;
          var sr = slot.getBoundingClientRect();
          var pr = probe.getBoundingClientRect();
          var tr = target.getBoundingClientRect();
          var probeOffset = pr.top + pr.height / 2 - sr.top;
          slot.style.top = (tr.top + tr.height / 2 - cr.top - probeOffset) + "px";
        });
        pinTrailingIdleSlots("xg", col, slots, specs, xgSideGap(side));
      }

      function pinXgPorts() {
        pinXgSidePorts("left");
        pinXgSidePorts("right");
        pinAllXgLinkedPorts();
        centerXgVisiblePortBands();
        pinCorePortBands();
      }

      function pinAllXgLinkedPorts() {
        links.filter(function (link) { return link.from === "xg"; }).forEach(function (link) {
          var source = portEl(link.fp);
          var target = portEl(link.tp);
          var slot = source && source.closest(".topo-slot");
          if (!source || !target || !slot) return;
          var item = source.closest(".topo-counted-port") || source;
          var sr = slot.getBoundingClientRect();
          var ir = item.getBoundingClientRect();
          var pr = source.getBoundingClientRect();
          var tr = target.getBoundingClientRect();
          var iconOffset = pr.top + pr.height / 2 - ir.top;
          item.style.position = "absolute";
          item.style.left = "50%";
          item.style.top = (tr.top + tr.height / 2 - sr.top - iconOffset) + "px";
          item.style.transform = "translateX(-50%)";
        });
      }

      function centerXgVisiblePortBand(side) {
        var col = els.xg && els.xg.querySelector(":scope > .topo-ports." + side);
        if (!col) return;
        var slots = Array.prototype.slice.call(col.querySelectorAll(":scope > .topo-slot"));
        var entries = slots.map(function (slot, index) {
          var ports = Array.prototype.slice.call(slot.querySelectorAll("[data-port]"));
          if (!ports.length) return null;
          var rects = ports.map(function (port) { return port.getBoundingClientRect(); });
          return {
            index: index,
            slot: slot,
            top: Math.min.apply(null, rects.map(function (rect) { return rect.top; })),
            bottom: Math.max.apply(null, rects.map(function (rect) { return rect.bottom; }))
          };
        }).filter(Boolean);
        if (!entries.length) return;
        var cr = col.getBoundingClientRect();
        var topEntry = entries.reduce(function (best, entry) { return entry.top < best.top ? entry : best; });
        var bottomEntry = entries.reduce(function (best, entry) { return entry.bottom > best.bottom ? entry : best; });
        var offset = (cr.top + cr.bottom - topEntry.top - bottomEntry.bottom) / 2;
        if (Math.abs(offset) < 0.4) return;

        var specs = xgSideSlots(side);
        var movable = side === "right"
          ? entries.filter(function (entry) { return specs[entry.index] && !specs[entry.index].child; }).pop()
          : bottomEntry;
        if (!movable) movable = offset > 0 ? topEntry : bottomEntry;
        movable.slot.style.top = ((parseFloat(movable.slot.style.top) || 0) + 2 * offset) + "px";
      }

      function centerXgVisiblePortBands() {
        centerXgVisiblePortBand("right");
      }

      /*
       * Rendered bottom of a whole branch, kept in sub-pixel space. offsetHeight
       * rounds, and a rounded parent leaves a visible step against its deepest
       * child once the sheet prints as vector instead of as a blurred bitmap.
       */
      function renderedTreeBottom(id) {
        var el = els[id];
        if (!el) return 0;
        var bottom = el.getBoundingClientRect().bottom;
        stageKids(id).forEach(function (childId) {
          bottom = Math.max(bottom, renderedTreeBottom(childId));
        });
        var backupId = pairedBackupId(id);
        if (backupId && els[backupId]) {
          bottom = Math.max(bottom, els[backupId].getBoundingClientRect().bottom);
        }
        return bottom;
      }

      function containPinnedSlots(id) {
        var el = els[id];
        if (!el) return;
        var col = el.querySelector(".topo-ports.down");
        if (!col) return;
        var items = col.querySelectorAll(".topo-slot, [data-port]");
        if (!items.length) return;
        var er = el.getBoundingClientRect();
        var cs = window.getComputedStyle(el);
        var maxBottom = er.top;
        Array.prototype.forEach.call(items, function (item) {
          maxBottom = Math.max(maxBottom, item.getBoundingClientRect().bottom);
        });
        /*
         * Every fanout closes on its own subtree, not just flex: the parent's
         * bottom border and the deepest descendant's have to resolve to one
         * line. The height stays unrounded for the same reason.
         */
        var subtreeBottom = 0;
        stageKids(id).forEach(function (childId) {
          subtreeBottom = Math.max(subtreeBottom, renderedTreeBottom(childId));
        });
        var bottomPad = subtreeBottom ? 0 : (parseFloat(cs.paddingBottom) || 0);
        var targetHeight = maxBottom - er.top + bottomPad;
        if (subtreeBottom) {
          /* Start on Blink's 1/64px layout grid, then correct against the used
             rectangle. The second step removes the one-grid-step over/under
             shoot that can otherwise survive after nested fanouts reflow. */
          var exact = Math.max(targetHeight, subtreeBottom - er.top);
          el.style.height = (Math.ceil(exact * 64) / 64) + "px";
          var used = el.getBoundingClientRect();
          var correction = subtreeBottom - used.bottom;
          if (Math.abs(correction) >= 0.001) {
            el.style.height = (used.height + correction) + "px";
          }
          return;
        }
        el.style.height = Math.ceil(targetHeight) + "px";
      }

      function pinTrailingIdleSlots(id, col, slots, suppliedSpecs, suppliedGap) {
        var specs = suppliedSpecs || downSlots(byId[id]);
        var slotGap = suppliedGap == null ? gapDown(id) : suppliedGap;
        var lastChild = -1;
        specs.forEach(function (spec, index) {
          if (spec.child) lastChild = index;
        });
        if (lastChild < 0 || lastChild >= specs.length - 1) return;
        for (var i = lastChild + 1; i < specs.length; i++) {
          if (specs[i].child) return;
        }
        var cr = col.getBoundingClientRect();
        var maxBottom = cr.top;
        for (var j = 0; j <= lastChild; j++) {
          Array.prototype.forEach.call(slots[j].querySelectorAll("[data-port]"), function (port) {
            maxBottom = Math.max(maxBottom, port.getBoundingClientRect().bottom);
          });
        }
        var cursor = maxBottom - cr.top + slotGap;
        for (var k = lastChild + 1; k < specs.length; k++) {
          slots[k].style.top = cursor + "px";
          cursor += slots[k].offsetHeight + slotGap;
        }
      }

      function pinDownPorts(id) {
        if (!isLTRFanout(id) || !els[id]) return;
        var el = els[id];
        pinFanoutUpPorts(id);
        var col = el.querySelector(".topo-ports.down");
        if (!col) return;
        var slots = col.querySelectorAll(".topo-slot");
        var cr = col.getBoundingClientRect();
        var used = [];
        downSlots(byId[id]).forEach(function (s, i) {
          var slot = slots[i];
          if (!slot) return;
          if (id === "xg" && s.child === "nas") slot.style.gap = "0.1rem";
          slot.style.paddingTop = "0px";
          slot.style.justifyContent = "center";
          if (!s.child) return;
          var p = portEl(inboundPort(s.child));
          var probe = slot.querySelector("[data-port]");
          if (!p || !probe) return;
          var pr = p.getBoundingClientRect();
          var sr = slot.getBoundingClientRect();
          var probeRect = probe.getBoundingClientRect();
          var off = probeRect.top + probeRect.height / 2 - sr.top;
          var top = pr.top + pr.height / 2 - cr.top - off;
          slot.style.top = top + "px";
          used.push({ i: i, top: top, sh: slot.offsetHeight || 17 });
        });
        var idleTop = 6;
        if (used.length) {
          used.sort(function (a, b) { return a.top - b.top; });
          idleTop = used[used.length - 1].top + used[used.length - 1].sh + gapDown(id);
        }
        downSlots(byId[id]).forEach(function (s, i) {
          if (s.child || !slots[i]) return;
          var prev = null, next = null;
          used.forEach(function (u) {
            if (u.i < i) prev = u;
            if (u.i > i && !next) next = u;
          });
          var slot = slots[i];
          var sh = slot.offsetHeight || 17;
          if (prev && next) {
            slot.style.top = (prev.top + prev.sh + (next.top - prev.top - prev.sh - sh) / 2) + "px";
          } else {
            slot.style.top = idleTop + "px";
            idleTop += sh + gapDown(id);
          }
        });
        if (isDoorMini(id) && slots[2]) {
          var dpsSlot = used.filter(function (entry) { return entry.i === 3; })[0];
          if (dpsSlot) {
            slots[2].style.top = (dpsSlot.top - slots[2].offsetHeight - PORT_GAP_MINI) + "px";
          }
        }
        pinTrailingIdleSlots(id, col, slots);
        containPinnedSlots(id);
        pinFanoutUpPorts(id);
      }

      function pinAllFanout() {
        Object.keys(els).forEach(pinDownPorts);
      }

      function bundleLeftInset(el) {
        if (!el) return GAP_X;
        var device = el.querySelector(".topo-bundle-device");
        if (!device) return GAP_X;
        var er = el.getBoundingClientRect();
        var dr = device.getBoundingClientRect();
        return dr.left - er.left;
      }

      function placeInSlot(id, x, slotTop, slotHgt) {
        /* Pull group frames over source ports and preserve inner left padding. */
        if (byId[id] && byId[id].bundle) {
          x -= bundleLeftInset(els[id]);
        }
        var backupId = pairedBackupId(id);
        if (backupId && natural[backupId]) {
          place(id, x, slotTop + natural[backupId].h + 8);
          return;
        }
        var h = natural[id] ? natural[id].h : 0;
        place(id, x, slotTop + Math.max(0, (slotHgt - h) / 2));
      }

      function nearDeviceEdge(id, side) {
        var el = els[id];
        if (!el) return 0;
        var device = byId[id] && byId[id].bundle ? el.querySelector(".topo-bundle-device") : el;
        var sr = stage.getBoundingClientRect();
        var dr = (device || el).getBoundingClientRect();
        return side === "left" ? dr.right - sr.left : dr.left - sr.left;
      }

      function placeLeftInSlot(id, anchorRight, slotTop, slotHgt) {
        var h = natural[id] ? natural[id].h : 0;
        place(id, 0, slotTop + Math.max(0, (slotHgt - h) / 2));
        var dx = anchorRight - nearDeviceEdge(id, "left");
        if (Math.abs(dx) >= 0.4) shiftTree(id, dx, 0);
      }

      function xgRequiredHeight() {
        var el = els.xg;
        var leftH = xgSideHeight("left");
        var rightH = xgSideHeight("right");
        var up = el.querySelector(":scope > .topo-ports.up");
        var mid = el.querySelector(":scope > .topo-mid");
        var cs = window.getComputedStyle(el);
        var pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
        var border = (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
        var rowGap = parseFloat(cs.rowGap) || 0;
        var headerH = (up ? up.offsetHeight : 0) + (mid ? mid.offsetHeight : 0) + 2 * rowGap;
        var bodyH = Math.max(leftH, rightH);
        return Math.ceil(border + pad + headerH + bodyH);
      }

      function fitXgLowerSection() {
        var el = els.xg;
        var col = el && el.querySelector(":scope > .topo-ports.left");
        if (!col) return;
        var delta = Math.max(xgSideHeight("left"), xgSideHeight("right")) - col.getBoundingClientRect().height;
        if (Math.abs(delta) >= 0.05) {
          el.style.height = (el.getBoundingClientRect().height + delta) + "px";
        }
      }

      function placeXgSide(side) {
        var el = els.xg;
        var col = el.querySelector(":scope > .topo-ports." + side);
        if (!col) return;
        var specs = xgSideSlots(side);
        var slots = col.querySelectorAll(":scope > .topo-slot");
        var stageRect = stage.getBoundingClientRect();
        var colRect = col.getBoundingClientRect();
        var stackHeight = xgSideHeight(side);
        var colTop = colRect.top - stageRect.top;
        var cursor = colTop + Math.max(0, (colRect.height - stackHeight) / 2);
        var gap = xgSideGap(side);
        var anchor = side === "left"
          ? parseFloat(el.style.left || 0) - GAP_X
          : parseFloat(el.style.left || 0) + el.offsetWidth + GAP_X;

        specs.forEach(function (spec, index) {
          var h = slotH(spec, "xg");
          var slot = slots[index];
          if (slot) {
            slot.style.top = (cursor - colTop + Math.max(0, (h - slot.offsetHeight) / 2)) + "px";
          }
          if (spec.child) {
            if (side === "left") placeLeftInSlot(spec.child, anchor, cursor, h);
            else placeInSlot(spec.child, anchor, cursor, h);
          }
          cursor += h + gap;
        });
      }

      function xgBranchBox(id) {
        var box = treeBox(id);
        var backupId = pairedBackupId(id);
        if (!backupId || !els[backupId]) return box;
        var backupTop = parseFloat(els[backupId].style.top || 0);
        return {
          top: Math.min(box.top, backupTop),
          bottom: Math.max(box.bottom, backupTop + els[backupId].offsetHeight),
          left: Math.min(box.left, parseFloat(els[backupId].style.left || 0)),
          right: Math.max(box.right, parseFloat(els[backupId].style.left || 0) + els[backupId].offsetWidth)
        };
      }

      function shiftXgBranch(id, dy) {
        if (Math.abs(dy) < 0.01) return;
        shiftTree(id, 0, dy);
        var backupId = pairedBackupId(id);
        if (backupId && els[backupId]) shiftTree(backupId, 0, dy);
      }

      function balanceXgBranchExtents() {
        var left = xgBranchSlots("left").filter(function (slot) { return slot.child; });
        var right = xgBranchSlots("right").filter(function (slot) { return slot.child; });
        if (left.length < 2 || right.length < 2) return;
        var leftTop = xgBranchBox(left[0].child).top;
        var leftBottom = xgBranchBox(left[left.length - 1].child).bottom;
        var boxes = right.map(function (slot) { return xgBranchBox(slot.child); });
        var occupied = boxes.reduce(function (sum, box) { return sum + box.bottom - box.top; }, 0);
        var gap = Math.max(GAP_Y, ((leftBottom - leftTop) - occupied) / (right.length - 1));
        var cursor = leftTop;
        right.forEach(function (slot, index) {
          var dy = cursor - boxes[index].top;
          shiftXgBranch(slot.child, dy);
          cursor += boxes[index].bottom - boxes[index].top + gap;
        });
      }

      function alignXgBranchBottoms() {
        if (!els.xg) return;
        var targetBottom = els.xg.getBoundingClientRect().bottom;
        var stageRect = stage.getBoundingClientRect();
        var scaleY = stage.offsetHeight ? stageRect.height / stage.offsetHeight : 1;
        ["left", "right"].forEach(function (side) {
          var roots = xgBranchSlots(side).filter(function (slot) { return slot.child; });
          if (!roots.length) return;
          var bottom = Math.max.apply(null, roots.map(function (slot) {
            return renderedTreeBottom(slot.child);
          }));
          var dy = (targetBottom - bottom) / scaleY;
          roots.forEach(function (slot) { shiftXgBranch(slot.child, dy); });
        });
      }

      /*
       * Child spacing is adjusted more than once during a dense relayout. Close
       * every nested LTR fanout after those moves, deepest first, so each frame
       * shares its final bottom coordinate with its subtree before XG aligns
       * the two sides.
       */
      function reconcileFanoutBottoms() {
        function depth(id) {
          var kids = stageKids(id);
          if (!kids.length) return 0;
          return 1 + Math.max.apply(null, kids.map(depth));
        }
        var ids = Object.keys(els).filter(function (id) {
          return isLTRFanout(id) && stageKids(id).length;
        }).sort(function (a, b) {
          return depth(b) - depth(a);
        });
        ids.forEach(function (id) {
          var target = Math.max.apply(null, stageKids(id).map(renderedTreeBottom));
          var el = els[id];
          var used = el.getBoundingClientRect();
          var delta = target - used.bottom;
          if (Math.abs(delta) >= 0.001) {
            el.style.height = (used.height + delta) + "px";
          }
        });
      }

      function placeDenseTopology() {
        var xg = els.xg;
        var nah = els.nah;
        var udm = els.udm;
        var nahTop = PAD;
        var udmTop = nahTop + natural.nah.h + GAP_CORE;
        var xgTop = udmTop + natural.udm.h + GAP_CORE_DAC;

        xg.style.left = "0px";
        xg.style.top = xgTop + "px";
        xg.style.height = xgRequiredHeight() + "px";
        fitXgLowerSection();

        var coreWidth = xg.getBoundingClientRect().width;
        var xgCenter = parseFloat(xg.style.left || 0) + coreWidth / 2;
        nah.style.width = coreWidth + "px";
        udm.style.width = coreWidth + "px";
        nah.style.left = (xgCenter - coreWidth / 2) + "px";
        nah.style.top = nahTop + "px";
        udm.style.left = (xgCenter - coreWidth / 2) + "px";
        udm.style.top = udmTop + "px";

        placeXgSide("left");
        placeXgSide("right");
        pinCorePortBands();
      }

      function place(id, x, y) {
        var el = els[id];
        if (isLTRFanout(id)) applySlotHeights(id);
        var bw = natural[id].w;
        var bh = el.offsetHeight || natural[id].h;
        el.style.left = x + "px";
        el.style.top = y + "px";
        var kids = stageKids(id);
        if (!kids.length) return;
        if (isTB(id) && kids.length === 1 && isTB(kids[0])) {
          var cw = natural[kids[0]].w;
          place(kids[0], x + (bw - cw) / 2, y + bh + GAP_TB);
          return;
        }
        if (isTB(id) && kids.length === 1) {
          place(kids[0], x + bw + GAP_X, y);
          return;
        }
        var cx = x + bw + GAP_X;
        if (isLTRFanout(id)) {
          var g = gapDown(id);
          var cursor = y;
          downSlots(byId[id]).forEach(function (s) {
            var h = slotH(s, id);
            if (s.child) placeInSlot(s.child, cx, cursor, h);
            cursor += h + g;
          });
          coverFanout(id);
          pinDownPorts(id);
        } else if (kids.length === 1) {
          place(kids[0], cx, y);
        } else {
          var cy = y;
          kids.forEach(function (cid) {
            place(cid, cx, cy);
            cy += subtreeH(cid) + GAP_Y;
          });
        }
      }

      function shiftTree(id, dx, dy) {
        if (!els[id]) return;
        if (dx) els[id].style.left = (parseFloat(els[id].style.left || 0) + dx) + "px";
        if (dy) els[id].style.top = (parseFloat(els[id].style.top || 0) + dy) + "px";
        stageKids(id).forEach(function (cid) { shiftTree(cid, dx, dy); });
      }

      function fitStage() {
        var maxR = 0, maxB = 0;
        Object.keys(els).forEach(function (id) {
          var el = els[id];
          maxR = Math.max(maxR, el.offsetLeft + el.offsetWidth);
          maxB = Math.max(maxB, el.offsetTop + el.offsetHeight);
        });
        stage.style.width = Math.ceil(maxR + PAD) + "px";
        stage.style.height = Math.ceil(maxB + PAD) + "px";
      }

      function inferCable(L) {
        if (L.cable) return L.cable;
        var ports = (L.fp || "") + " " + (L.tp || "");
        if (/can/i.test(ports)) return "can";
        if (/lock|dps/i.test(ports)) return "lock12";
        if (L.from === "flex" || L.to === "pw-follow" || /(entry|g3)$/.test(L.to)) return "cat6";
        return "cat6a";
      }

      var linkLabels = [];
      var linkEls = links.map(function (L, index) {
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("id", "topo-link-" + index);
        path.setAttribute("class", "topo-link cable-" + inferCable(L));
        path.setAttribute("data-from", L.from);
        path.setAttribute("data-to", L.to);
        path.setAttribute("data-from-port", L.fp);
        path.setAttribute("data-to-port", L.tp);
        path.setAttribute("data-info", L.info);
        if (L.route) path.setAttribute("data-route", L.route);
        svg.appendChild(path);
        if (L.label) {
          var label = document.createElementNS("http://www.w3.org/2000/svg", "text");
          label.setAttribute("class", "topo-link-label");
          label.textContent = L.label;
          var labelRoot = label;
          if (L.href) {
            var labelLink = document.createElementNS("http://www.w3.org/2000/svg", "a");
            labelLink.setAttribute("class", "topo-link-label-link");
            labelLink.setAttribute("href", L.href);
            labelLink.setAttribute("target", "_blank");
            labelLink.setAttribute("rel", "noopener noreferrer");
            labelLink.setAttribute("aria-label", L.label + " product page");
            labelLink.appendChild(label);
            labelRoot = labelLink;
          }
          svg.appendChild(labelRoot);
          linkLabels.push({ path: path, label: label, root: labelRoot });
        }
        return path;
      });
      /* Keep all labels above every cable path. */
      linkLabels.forEach(function (item) { svg.appendChild(item.root); });

      function pt(el, edgeSide) {
        var c = stage.getBoundingClientRect();
        var r = el.getBoundingClientRect();
        var x = r.left + r.width / 2 - c.left;
        var y = r.top + r.height / 2 - c.top;
        if (edgeSide === "right") x = r.right - c.left;
        if (edgeSide === "left") x = r.left - c.left;
        if (edgeSide === "bottom") y = r.bottom - c.top;
        if (edgeSide === "top") y = r.top - c.top;
        return { x: x, y: y };
      }

      function treeBox(id) {
        var el = els[id];
        var top = parseFloat(el.style.top || 0);
        var left = parseFloat(el.style.left || 0);
        var bottom = top + el.offsetHeight;
        var right = left + el.offsetWidth;
        stageKids(id).forEach(function (cid) {
          var b = treeBox(cid);
          top = Math.min(top, b.top);
          bottom = Math.max(bottom, b.bottom);
          left = Math.min(left, b.left);
          right = Math.max(right, b.right);
        });
        return { top: top, bottom: bottom, left: left, right: right };
      }

      function separateSiblings(id) {
        var kids = stageKids(id);
        for (var i = 1; i < kids.length; i++) {
          var need = treeBox(kids[i - 1]).bottom + GAP_Y - treeBox(kids[i]).top;
          if (need > 0.4) shiftTree(kids[i], 0, need);
        }
        kids.forEach(separateSiblings);
      }

      function portEl(id) {
        return id ? canvas.querySelector('[data-port="' + id + '"]') : null;
      }

      function linkIsVertical(fromId, toId) {
        return !!(fromId && isTB(fromId) && isTB(toId));
      }

      function linkRunsVertical(link) {
        var route = link.getAttribute("data-route");
        return route === "vertical" ||
          (route !== "horizontal" &&
            linkIsVertical(link.getAttribute("data-from"), link.getAttribute("data-to")));
      }

      /*
       * Centre of a port chip as it will be painted: Blink snaps a box to whole
       * pixels, so the painted centre is round(edge) + half the box.
       */
      function snappedPortCenter(el) {
        var center = pt(el);
        var rect = el.getBoundingClientRect();
        var halfW = rect.width / 2;
        var halfH = rect.height / 2;
        return {
          x: Math.round(center.x - halfW) + halfW,
          y: Math.round(center.y - halfH) + halfH
        };
      }

      /*
       * A connection is one straight horizontal or vertical segment. Therefore
       * collinearity is a layout invariant, not something paintLinks() can hide
       * with a bend. Move only the source port glyph (and its count, when any)
       * by the residual amount after all boxes and slots settle.
       *
       * The nudge is measured between snapped centres, which makes it a whole
       * number of pixels. A transform is applied after Blink snaps the box, so a
       * fractional nudge would push the chip off the pixel grid that
       * paintLinks() rounds cable endpoints onto.
       */
      function alignLinkedPortAxes() {
        var offsets = new Map();
        linkEls.forEach(function (link) {
          var port = portEl(link.getAttribute("data-from-port"));
          if (!port) return;
          var mover = port.closest(".topo-counted-port") || port;
          if (!offsets.has(mover)) offsets.set(mover, { x: 0, y: 0 });
          mover.style.translate = "";
        });

        for (var pass = 0; pass < 2; pass++) {
          linkEls.forEach(function (link) {
            var source = portEl(link.getAttribute("data-from-port"));
            var target = portEl(link.getAttribute("data-to-port"));
            if (!source || !target) return;
            var mover = source.closest(".topo-counted-port") || source;
            var offset = offsets.get(mover) || { x: 0, y: 0 };
            var sourceCenter = snappedPortCenter(source);
            var targetCenter = snappedPortCenter(target);
            if (linkRunsVertical(link)) {
              offset.x += targetCenter.x - sourceCenter.x;
            } else {
              offset.y += targetCenter.y - sourceCenter.y;
            }
            offsets.set(mover, offset);
            mover.style.translate = offset.x + "px " + offset.y + "px";
          });
        }
      }

      function paintLinks() {
        fitStage();
        var w = stage.offsetWidth, h = stage.offsetHeight;
        svg.setAttribute("viewBox", "0 0 " + w + " " + h);
        svg.setAttribute("width", w);
        svg.setAttribute("height", h);
        linkEls.forEach(function (link) {
          var a = portEl(link.getAttribute("data-from-port"));
          var b = portEl(link.getAttribute("data-to-port"));
          if (!a || !b) return;
          var sc = pt(a);
          var ec = pt(b);
          var vertical = linkRunsVertical(link);
          var s, e, d;
          /*
           * alignLinkedPortAxes() guarantees collinearity, so one segment is
           * enough: no diagonal, elbow or jog is permitted. Coordinates are
           * rounded because Blink snaps painted HTML boxes to whole CSS pixels
           * while SVG keeps fractional geometry - a cable drawn at a port's
           * exact layout centre would land up to half a pixel off the painted
           * chip. A port box is 26px, so its snapped centre is round(centre).
           */
          if (vertical) {
            s = pt(a, sc.y <= ec.y ? "bottom" : "top");
            e = pt(b, sc.y <= ec.y ? "top" : "bottom");
            s.x = e.x = Math.round((sc.x + ec.x) / 2);
            s.y = Math.round(s.y);
            e.y = Math.round(e.y);
          } else {
            s = pt(a, sc.x <= ec.x ? "right" : "left");
            e = pt(b, sc.x <= ec.x ? "left" : "right");
            s.y = e.y = Math.round((sc.y + ec.y) / 2);
            s.x = Math.round(s.x);
            e.x = Math.round(e.x);
          }
          d = "M" + s.x + " " + s.y + " L" + e.x + " " + e.y;
          link.setAttribute("d", d);
          var linkLabel = null;
          for (var i = 0; i < linkLabels.length; i++) {
            if (linkLabels[i].path === link) {
              linkLabel = linkLabels[i].label;
              break;
            }
          }
          if (linkLabel) {
            var labelX = (s.x + e.x) / 2;
            if (vertical) labelX = s.x + linkLabel.getComputedTextLength() / 2 + 10;
            linkLabel.setAttribute("x", labelX);
            linkLabel.setAttribute("y", (s.y + e.y) / 2 + (vertical ? 0 : -11));
          }
        });
      }

      function svgNode(name, attrs, text) {
        var el = document.createElementNS("http://www.w3.org/2000/svg", name);
        Object.keys(attrs || {}).forEach(function (key) {
          el.setAttribute(key, attrs[key]);
        });
        if (text != null) el.textContent = text;
        return el;
      }

      function legendUse(href, x, y, size, color) {
        var g = svgNode("g", { transform: "translate(" + x + " " + y + ")", color: color || "#141414" });
        var nested = svgNode("svg", { x: "0", y: "0", width: String(size), height: String(size), viewBox: "0 0 20 20" });
        nested.appendChild(svgNode("use", { href: href, fill: "currentColor" }));
        g.appendChild(nested);
        return g;
      }

      function legendChip(x, y, spec) {
        var g = svgNode("g", { transform: "translate(" + x + " " + y + ")" });
        var size = 26;
        var icon = 14;
        var inset = (size - icon) / 2;
        var rect = svgNode("rect", { x: "0", y: "0", width: String(size), height: String(size), rx: "4" });
        if (spec.kind === "fill") {
          rect.setAttribute("fill", spec.color);
        } else if (spec.kind === "sfp") {
          rect.setAttribute("fill", "#2b2b2b");
        } else if (spec.kind === "other") {
          rect.setAttribute("fill", "#c4785a");
        } else {
          rect.setAttribute("fill", "#fff");
          rect.setAttribute("stroke", spec.stroke || "#666");
          rect.setAttribute("stroke-width", "1");
        }
        g.appendChild(rect);
        if (spec.kind === "hollow") {
          g.appendChild(legendUse(spec.href, inset, inset, icon, "#333"));
        } else if (spec.kind === "sfp" || spec.kind === "other") {
          g.appendChild(svgNode("text", {
            x: String(size / 2), y: "17", fill: "#fff", "font-size": "7", "font-weight": "700",
            "text-anchor": "middle", "font-family": "system-ui, sans-serif", "letter-spacing": "-0.04em"
          }, spec.t || ""));
        }
        return { node: g, width: size };
      }

      function legendCard(title, width, innerH) {
        var PADX = 14;
        var PADY = 14;
        var HEAD = 18;
        var height = PADY * 2 + HEAD + innerH;
        var g = svgNode("g", { "class": "topo-legend-card" });
        g.appendChild(svgNode("rect", {
          x: "0", y: "0", width: String(width), height: String(height),
          rx: "5", fill: "#fff", stroke: "#bbb", "stroke-width": "1"
        }));
        g.appendChild(svgNode("text", {
          x: String(PADX), y: String(PADY + 12), "font-size": "10", "font-weight": "700",
          "font-family": "system-ui, sans-serif", fill: "#263746", "letter-spacing": "0.05em"
        }, title));
        g.setAttribute("data-pad-x", String(PADX));
        g.setAttribute("data-pad-y", String(PADY));
        g.setAttribute("data-head", String(HEAD));
        g.setAttribute("data-width", String(width));
        g.setAttribute("data-height", String(height));
        return g;
      }

      function buildLegendGroup(colW) {
        var ports = [
          { kind: "fill", color: "#f0b429", label: "100M RJ45" },
          { kind: "fill", color: "#38cc65", label: "1G RJ45" },
          { kind: "fill", color: "#99c5ff", label: "2.5G RJ45" },
          { kind: "fill", color: "#3a9fcb", label: "10G RJ45" },
          { kind: "sfp", t: "SFP+", label: "SFP+" },
          { kind: "sfp", t: "SFP28", label: "SFP28" },
          { kind: "hollow", href: "#udc-poe", label: "PoE · ≤15.4W" },
          { kind: "hollow", href: "#udc-poe-plus", label: "PoE+ · ≤30W" },
          { kind: "hollow", href: "#udc-poe-plusplus", label: "PoE++ · ≤60W" },
          { kind: "hollow", href: "#udc-poe-plusplusplus", label: "PoE+++ · ≤90W" },
          { kind: "hollow", href: "#udc-wan", label: "WAN" },
          { kind: "other", t: "F", label: "Fiber" },
          { kind: "other", t: "USB-C", label: "USB-C" },
          { kind: "other", t: "USB-2", label: "USB 2.0" },
          { kind: "other", t: "USB-3", label: "USB 3.0 / 3.2" },
          { kind: "other", t: "HDMI", label: "HDMI" },
          { kind: "other", t: "DP", label: "DisplayPort" },
          { kind: "other", t: "COM", label: "RS232 / Console" },
          { kind: "other", t: "CAN", label: "CAN" },
          { kind: "other", t: "REX", label: "Request to Exit" },
          { kind: "other", t: "DPS", label: "Door Position Sensor" },
          { kind: "other", t: "LOCK", label: "Lock relay" }
        ];
        var cables = [
          { color: "#e65100", label: "Cat6A · Type 4 / 4PPoE" },
          { color: "#1565c0", label: "Cat6 · Type 4 / 4PPoE" },
          { color: "#111111", label: "10G SFP+ DAC" },
          { color: "#00897b", label: "CAN" },
          { color: "#8e24aa", label: "12V Lock / DPS" }
        ];
        var vlans = [
          { color: "#005ea8", fill: "#edf3f7", label: "VLAN 10 · Management", sub: "UniFi network gear" },
          { color: "#2e7d32", fill: "#eef4ee", label: "VLAN 20 · Trusted", sub: "Personal devices · not shown" },
          { color: "#6a3d9a", fill: "#f2eff5", label: "VLAN 30 · Servers", sub: "Mac Studio · NAS · HA" },
          { color: "#a15c00", fill: "#f7f2ea", label: "VLAN 40 · IoT / Energy", sub: "Wallpanels · USL · Powerwall · Electrical Panel" },
          { color: "#b3263e", fill: "#f7eff0", label: "VLAN 50 · Protect / Access", sub: "Cameras · door controllers" },
          { color: "#007c7a", fill: "#edf5f4", label: "VLAN 60 · Guest", sub: "Guest clients · not shown" }
        ];

        var ROW = 30;
        var VLAN_ROW = 28;
        var LABEL = { "font-size": "11.2", "font-family": "system-ui, sans-serif", fill: "#1a1a1a" };
        var root = svgNode("g", { id: "topo-legend", "font-family": "system-ui, sans-serif" });
        var PADX = 14;
        var PADY = 14;
        var HEAD = 18;

        var portG = legendCard("PORTS", colW, ports.length * ROW);
        ports.forEach(function (item, row) {
          var y = PADY + HEAD + row * ROW;
          var chip = legendChip(PADX, y, item);
          portG.appendChild(chip.node);
          portG.appendChild(svgNode("text", Object.assign({
            x: String(PADX + chip.width + 8), y: String(y + 17)
          }, LABEL), item.label));
        });

        var cableG = legendCard("CABLES", colW, cables.length * ROW);
        cables.forEach(function (item, row) {
          var y = PADY + HEAD + row * ROW + 12;
          cableG.appendChild(svgNode("rect", {
            x: String(PADX), y: String(y), width: "26", height: "4", rx: "2", fill: item.color
          }));
          cableG.appendChild(svgNode("text", Object.assign({
            x: String(PADX + 34), y: String(y + 5)
          }, LABEL), item.label));
        });

        var vlanG = legendCard("VLANS", colW, vlans.length * VLAN_ROW);
        vlans.forEach(function (item, row) {
          var y = PADY + HEAD + row * VLAN_ROW;
          vlanG.appendChild(svgNode("rect", {
            x: String(PADX), y: String(y + 6), width: "22", height: "12", rx: "2",
            fill: item.fill, stroke: item.color, "stroke-width": "1"
          }));
          vlanG.appendChild(svgNode("text", Object.assign({
            x: String(PADX + 30), y: String(y + 12)
          }, LABEL), item.label));
          vlanG.appendChild(svgNode("text", {
            x: String(PADX + 30), y: String(y + 23), fill: "#68737f", "font-size": "9",
            "font-family": "system-ui, sans-serif"
          }, item.sub));
        });

        root.appendChild(portG);
        root.appendChild(cableG);
        root.appendChild(vlanG);
        root.setAttribute("data-port-h", portG.getAttribute("data-height"));
        root.setAttribute("data-cable-h", cableG.getAttribute("data-height"));
        root.setAttribute("data-vlan-h", vlanG.getAttribute("data-height"));
        return root;
      }

      function layoutLegend() {
        var old = svg.querySelector("#topo-legend");
        if (old) old.remove();
        var coreRight = 0;
        var drawingRight = 0;
        var nahTop = PAD;
        Object.keys(els).forEach(function (id) {
          var el = els[id];
          var right = el.offsetLeft + el.offsetWidth;
          drawingRight = Math.max(drawingRight, right);
          if (id === "nah" || id === "udm" || id === "xg") {
            coreRight = Math.max(coreRight, right);
          }
          if (id === "nah") nahTop = el.offsetTop;
        });
        var gap = GAP_X;
        var colW = 236;
        var rightX = drawingRight - colW;
        var midX = rightX - gap - colW;
        var g = buildLegendGroup(colW);
        var portG = g.childNodes[0];
        var cableG = g.childNodes[1];
        var vlanG = g.childNodes[2];
        var cableH = parseFloat(cableG.getAttribute("data-height")) || 0;
        var vlanH = parseFloat(vlanG.getAttribute("data-height")) || 0;
        var portH = parseFloat(portG.getAttribute("data-height")) || 0;
        var vlanY = nahTop + cableH + gap;
        portG.setAttribute("transform", "translate(" + Math.round(midX) + " " + Math.round(nahTop) + ")");
        cableG.setAttribute("transform", "translate(" + Math.round(rightX) + " " + Math.round(nahTop) + ")");
        vlanG.setAttribute("transform", "translate(" + Math.round(rightX) + " " + Math.round(vlanY) + ")");
        var maxH = Math.max(portH, cableH + gap + vlanH);
        if (nahTop + maxH + PAD > stage.offsetHeight) {
          stage.style.height = Math.ceil(nahTop + maxH + PAD) + "px";
        }
        svg.appendChild(g);
        svg.setAttribute("viewBox", "0 0 " + stage.offsetWidth + " " + stage.offsetHeight);
        svg.setAttribute("width", stage.offsetWidth);
        svg.setAttribute("height", stage.offsetHeight);
      }

      function clampOrigin() {
        var minX = Infinity, minY = Infinity;
        Object.keys(els).forEach(function (id) {
          minX = Math.min(minX, parseFloat(els[id].style.left || 0));
          minY = Math.min(minY, parseFloat(els[id].style.top || 0));
        });
        var dx = minX < PAD ? PAD - minX : 0;
        var dy = minY < PAD ? PAD - minY : 0;
        if (!dx && !dy) return;
        Object.keys(els).forEach(function (id) {
          if (dx) els[id].style.left = (parseFloat(els[id].style.left || 0) + dx) + "px";
          if (dy) els[id].style.top = (parseFloat(els[id].style.top || 0) + dy) + "px";
        });
      }

      function pinBackupPairs() {}

      function portCenterY(id) {
        var port = portEl(id);
        if (!port) return null;
        var rect = port.getBoundingClientRect();
        return rect.top + rect.height / 2;
      }

      function moveNodeOnly(id, dy) {
        if (!els[id] || Math.abs(dy) < 0.4) return;
        els[id].style.top = (parseFloat(els[id].style.top || 0) + dy) + "px";
      }

      function placeUps() {
        var udm = els.udm;
        var ups = els.ups;
        var source = portEl("udm-lan8");
        var target = portEl("ups-lan");
        if (!udm || !ups || !source || !target) return;
        var stageRect = stage.getBoundingClientRect();
        var scaleX = stage.offsetWidth ? stageRect.width / stage.offsetWidth : 1;
        var scaleY = stage.offsetHeight ? stageRect.height / stage.offsetHeight : 1;
        var udmRect = udm.getBoundingClientRect();
        var sourceRect = source.getBoundingClientRect();
        var targetRect = target.getBoundingClientRect();
        var upsRect = ups.getBoundingClientRect();
        var sourceCenter = (sourceRect.top + sourceRect.height / 2 - stageRect.top) / scaleY;
        var targetOff = (targetRect.top + targetRect.height / 2 - upsRect.top) / scaleY;
        ups.style.left = ((udmRect.right - stageRect.left) / scaleX + GAP_X) + "px";
        ups.style.top = (sourceCenter - targetOff) + "px";
      }

      function alignGarageUplink() {
        var flexY = portCenterY("flex-up");
        var dropY = portCenterY("drop-gar-flex");
        if (flexY == null || dropY == null) return;
        var dy = flexY - dropY;
        moveNodeOnly("drop-gar", dy);
      }

      function alignMediaSwitchUplink() {
        var dropY = portCenterY("drop-media-dn");
        var switchY = portCenterY("media-flex-up");
        if (dropY == null || switchY == null) return;
        shiftTree("media-flex", 0, dropY - switchY);
      }

      function spaceGarageFlexBranches() {
        var flex = els.flex;
        var roots = ["lite", "usl", "pw-lead", "group-garage-door"];
        if (!flex || roots.some(function (id) { return !els[id]; })) return;
        var fixedHeight = flex.style.height || (flex.offsetHeight + "px");
        var frame = flex.getBoundingClientRect();
        var stageRect = stage.getBoundingClientRect();
        var scaleY = stage.offsetHeight ? stageRect.height / stage.offsetHeight : 1;

        function renderedTreeBounds(id) {
          var rect = els[id].getBoundingClientRect();
          var bounds = { top: rect.top, bottom: rect.bottom };
          stageKids(id).forEach(function (childId) {
            var child = renderedTreeBounds(childId);
            bounds.top = Math.min(bounds.top, child.top);
            bounds.bottom = Math.max(bounds.bottom, child.bottom);
          });
          return bounds;
        }

        var boxes = roots.map(renderedTreeBounds);
        var occupied = boxes.reduce(function (sum, box) {
          return sum + box.bottom - box.top;
        }, 0);
        var gap = roots.length > 1 ? Math.max(0, (frame.height - occupied) / (roots.length - 1)) : 0;
        var cursor = frame.top;
        roots.forEach(function (id, index) {
          shiftTree(id, 0, (cursor - boxes[index].top) / scaleY);
          cursor += boxes[index].bottom - boxes[index].top + gap;
        });

        pinDownPorts("flex");
        flex.style.height = fixedHeight;
        var col = flex.querySelector(":scope > .topo-ports.down");
        var fourthPort = portEl("flex-gmin");
        var idlePort = portEl("flex-x1");
        var idleSlot = idlePort && idlePort.closest(".topo-slot");
        if (col && fourthPort && idleSlot) {
          var colRect = col.getBoundingClientRect();
          var fourthRect = fourthPort.getBoundingClientRect();
          var defaultGap = parseFloat(window.getComputedStyle(col).rowGap) || 0;
          idleSlot.style.top = (fourthRect.bottom - colRect.top + defaultGap) + "px";
        }
      }

      function relayout() {
        subH = {};
        subW = {};
        measureNatural();
        stage.style.width = "1px";
        stage.style.height = "1px";
        placeDenseTopology();
        separateSiblings("flex");
        pinAllFanout();
        spaceGarageFlexBranches();
        pinBackupPairs();
        alignGarageUplink();
        alignMediaSwitchUplink();
        balanceXgBranchExtents();
        alignXgBranchBottoms();
        pinXgPorts();
        clampOrigin();
        pinAllFanout();
        spaceGarageFlexBranches();
        pinBackupPairs();
        alignGarageUplink();
        alignMediaSwitchUplink();
        reconcileFanoutBottoms();
        alignXgBranchBottoms();
        pinXgPorts();
        placeUps();
        alignLinkedPortAxes();
        paintLinks();
        layoutLegend();
        canvas.scrollLeft = Math.max(0, (canvas.scrollWidth - canvas.clientWidth) / 2);
      }

      window.addEventListener("resize", function () {
        if (canvas.offsetWidth > 40) {
          paintLinks();
          layoutLegend();
        }
      });
      window.relayoutTopo = relayout;
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
        if (canvas.offsetWidth > 40) relayout();
      });
      if (canvas.offsetWidth > 40) {
        relayout();
        setTimeout(relayout, 60);
      }
    })();

(function () {
      var exportRoot = document.getElementById("export-root");
      var exportButton = document.getElementById("export-page-pdf");
      var pageStyle = document.createElement("style");
      pageStyle.id = "print-page-size";

      /*
       * Export Blueprint is topology-only. The sheet goes through the browser's
       * own PDF writer so type, rules and port chips stay vector. Sheet boxes
       * are declared in inches (1in === 96px). The Arch C topology sheet has
       * enough room for its 1917 × 1626px stage at exactly 1:1.
       *
       * Every offset from the page corner to the drawing is a whole CSS pixel:
       * page margin 30px + sheet border 2px + sheet padding 8px + an integral
       * centring offset. Blink snaps painted boxes to whole pixels in page
       * space, so an integral origin is what lets paintLinks() round cable
       * endpoints onto the very grid the port chips are painted on.
       */
      var topologyPaper = {
        page: "24in 18in",
        margin: "0.3125in",
        sheet: { w: 2240, h: 1664 },
        label: "ARCH C · 24 × 18 IN · LANDSCAPE"
      };

      function waitFrame() {
        return new Promise(function (resolve) {
          requestAnimationFrame(function () { requestAnimationFrame(resolve); });
        });
      }

      /*
       * The print pass re-measures text, and a half-pixel difference in a
       * text-driven box re-centres the ports inside it while the SVG cables keep
       * the coordinates measured here. Pin every box in the clone to the size it
       * had when the links were painted, so print has nothing left to measure.
       */
      function freezeCloneSizes(source, clone) {
        var srcEls = source.querySelectorAll("*");
        var cloneEls = clone.querySelectorAll("*");
        if (srcEls.length !== cloneEls.length) return;
        for (var i = 0; i < srcEls.length; i++) {
          var el = srcEls[i];
          if (el.namespaceURI !== "http://www.w3.org/1999/xhtml") continue;
          if (window.getComputedStyle(el).display === "inline") continue;
          var rect = el.getBoundingClientRect();
          if (!rect.width || !rect.height) continue;
          var target = cloneEls[i];
          target.style.boxSizing = "border-box";
          target.style.width = rect.width + "px";
          target.style.height = rect.height + "px";
        }
      }

      function cloneTopology() {
        var source = document.querySelector("#topo-canvas .topo-stage");
        if (!source) return null;
        var clone = source.cloneNode(true);
        freezeCloneSizes(source, clone);
        clone.removeAttribute("id");
        Array.prototype.forEach.call(clone.querySelectorAll("[id]"), function (el) {
          /* arrow markers stay: the cloned edges still point at url(#topo-arrow-*) */
          if (!/^topo-arrow-/.test(el.id)) el.removeAttribute("id");
        });
        Array.prototype.forEach.call(clone.querySelectorAll("a, button"), function (el) {
          el.setAttribute("tabindex", "-1");
        });
        return clone;
      }

      function placeTargetOneToOne(target) {
        var viewport = target && target.parentElement;
        var content = target && target.firstElementChild;
        if (!viewport || !content) return null;
        target.style.transform = "none";
        target.style.left = "0px";
        target.style.top = "0px";
        var viewportStyle = window.getComputedStyle(viewport);
        var padLeft = parseFloat(viewportStyle.paddingLeft) || 0;
        var padRight = parseFloat(viewportStyle.paddingRight) || 0;
        var padTop = parseFloat(viewportStyle.paddingTop) || 0;
        var padBottom = parseFloat(viewportStyle.paddingBottom) || 0;
        var viewportRect = viewport.getBoundingClientRect();
        var availableWidth = Math.max(1, viewportRect.width - padLeft - padRight);
        var availableHeight = Math.max(1, viewportRect.height - padTop - padBottom);
        var width = Math.max(content.scrollWidth, content.offsetWidth, 1);
        var height = Math.max(content.scrollHeight, content.offsetHeight, 1);
        if (availableWidth + 0.5 < width || availableHeight + 0.5 < height) {
          throw new Error("Arch C topology viewport is smaller than the 1:1 stage");
        }
        /* Whole pixels only: a fractional offset would shift the drawing off the
           page's pixel grid and undo the endpoint rounding in paintLinks(). */
        target.style.left = Math.round(padLeft + (availableWidth - width) / 2) + "px";
        target.style.top = Math.round(padTop + (availableHeight - height) / 2) + "px";
        return 1;
      }

      /*
       * Metadata occupies a genuinely empty part of the topology instead of a
       * separate header/footer band. That leaves the full sheet height to the
       * stage and removes the old 0.92 fit transform. Only the sheet carries a
       * frame; the drawing area has no nested panel border.
       */
      function buildSheet(spec) {
        if (!exportRoot) return null;
        exportRoot.innerHTML = "";
        var sheet = document.createElement("div");
        sheet.className = "export-sheet";
        sheet.style.width = spec.sheet.w + "px";
        sheet.style.height = spec.sheet.h + "px";
        sheet.innerHTML =
          '<div class="blueprint-viewport"><div class="blueprint-placement" data-export="main"></div></div>';
        exportRoot.appendChild(sheet);
        var mainTarget = sheet.querySelector('[data-export="main"]');
        var main = cloneTopology();
        if (main && mainTarget) {
          mainTarget.appendChild(main);
          var meta = document.createElement("section");
          meta.className = "blueprint-meta";
          meta.innerHTML =
            '<h2>HOME NETWORK</h2>' +
            '<p class="blueprint-meta-subtitle">Physical Topology</p>' +
            '<div class="blueprint-meta-details">' +
            '<span><strong>Document</strong>Home Spec</span>' +
            '<span><strong>Scope</strong>Physical Topology</span>' +
            '<span><strong>Sheet</strong>N-001</span>' +
            '<span><strong>Format</strong>' + spec.label + '</span>' +
            '</div>';
          main.appendChild(meta);
        }
        return sheet;
      }

      function clearPrintMode() {
        document.body.classList.remove("print-topology", "export-source-measure");
        if (pageStyle.parentNode) pageStyle.parentNode.removeChild(pageStyle);
        if (exportRoot) exportRoot.innerHTML = "";
        if (typeof window.relayoutTopo === "function") window.relayoutTopo();
      }

      /*
       * The topology is cloned while the source tab is forced to its full
       * drawing width, so a narrow window never bakes a cramped layout into the
       * sheet.
       */
      async function stageTopologySheet(spec) {
        document.body.classList.add("export-source-measure");
        if (typeof window.relayoutTopo === "function") window.relayoutTopo();
        await waitFrame();
        var sheet = buildSheet(spec);
        await waitFrame();
        document.body.classList.remove("export-source-measure");
        if (sheet) placeTargetOneToOne(sheet.querySelector('[data-export="main"]'));
        return sheet;
      }

      async function runPrint() {
        var spec = topologyPaper;
        clearPrintMode();
        pageStyle.textContent = "@page { size: " + spec.page + "; margin: " + spec.margin + "; }";
        document.head.appendChild(pageStyle);
        document.body.classList.add("print-topology");
        await stageTopologySheet(spec);
        await waitFrame();
        window.print();
      }

      /*
       * The browser writes the vector PDF, but two dialog defaults still spoil a
       * sheet: page headers stamp over the frame, and any scale other than 100%
       * throws off the drawing scale. State the settings once, then stay quiet.
       */
      var HINT_KEY = "hn-export-hint-muted";

      function buildHint() {
        var hint = document.createElement("div");
        hint.className = "print-hint";
        hint.hidden = true;
        hint.setAttribute("role", "dialog");
        hint.setAttribute("aria-label", "Export Blueprint settings");
        hint.innerHTML =
          '<p class="print-hint-title">Export Blueprint</p>' +
          '<p class="print-hint-sheet" data-hint="sheet"></p>' +
          '<ul>' +
          '<li>Destination · <strong>Save as PDF</strong></li>' +
          '<li>Paper size · <strong data-hint="paper"></strong></li>' +
          '<li>Scale · <strong>100%</strong> (not “Fit to page”)</li>' +
          '<li>Headers and footers · <strong>off</strong></li>' +
          '</ul>' +
          '<label class="print-hint-mute"><input type="checkbox" data-hint="mute"> Skip this reminder next time</label>' +
          '<div class="print-hint-actions">' +
          '<button type="button" data-hint="cancel">Cancel</button>' +
          '<button type="button" class="is-primary" data-hint="go">Open print dialog</button>' +
          '</div>';
        document.body.appendChild(hint);
        return hint;
      }

      if (exportButton) {
        var hint = buildHint();
        var muted = false;
        try { muted = window.localStorage.getItem(HINT_KEY) === "1"; } catch (error) { muted = false; }

        function startTopologyPrint() {
          hint.hidden = true;
          exportButton.disabled = true;
          runPrint().catch(function (error) {
            console.error(error);
            clearPrintMode();
          }).then(function () {
            exportButton.disabled = false;
          });
        }

        exportButton.addEventListener("click", function () {
          var spec = topologyPaper;
          if (muted) {
            startTopologyPrint();
            return;
          }
          hint.querySelector('[data-hint="sheet"]').textContent = spec.label;
          hint.querySelector('[data-hint="paper"]').textContent = spec.page.replace("in ", " × ").replace("in", " in");
          hint.hidden = false;
          hint.querySelector('[data-hint="go"]').focus();
        });

        hint.addEventListener("click", function (event) {
          var action = event.target.getAttribute("data-hint");
          if (action !== "go" && action !== "cancel") return;
          var check = hint.querySelector('[data-hint="mute"]');
          if (check && check.checked) {
            muted = true;
            try { window.localStorage.setItem(HINT_KEY, "1"); } catch (error) { /* private mode */ }
          }
          if (action === "cancel") {
            hint.hidden = true;
            return;
          }
          startTopologyPrint();
        });

        hint.addEventListener("keydown", function (event) {
          if (event.key === "Escape") hint.hidden = true;
        });
      }

      window.addEventListener("afterprint", clearPrintMode);
    })();

(function () {
      var tabs = document.querySelectorAll(".spa-tab");
      var buttons = document.querySelectorAll(".spa-nav button[data-tab]");
      var brand = document.querySelector("a.brand[data-tab]");
      var known = { topology: true, spec: true };

      function showTab(key, hash) {
        if (!known[key]) key = "spec";
        Array.prototype.forEach.call(tabs, function (t) {
          t.classList.toggle("is-on", t.getAttribute("data-tab") === key);
        });
        Array.prototype.forEach.call(buttons, function (b) {
          b.classList.toggle("is-on", b.getAttribute("data-tab") === key);
        });
        document.body.classList.toggle("tab-spec", key === "spec");
        document.body.classList.toggle("tab-topology", key === "topology");
        if (typeof window.setSpecSidebar === "function") window.setSpecSidebar(false);
        if (history.replaceState) history.replaceState(null, "", "#" + (hash || key));
        if (key === "topology" && typeof window.relayoutTopo === "function") {
          requestAnimationFrame(function () {
            window.relayoutTopo();
            setTimeout(window.relayoutTopo, 60);
          });
        }
        if (key === "spec" && typeof window.equalizeDoorRows === "function") {
          requestAnimationFrame(window.equalizeDoorRows);
        }
        if (key === "spec" && typeof window.fitScheduleLines === "function") {
          requestAnimationFrame(window.fitScheduleLines);
        }
      }

      function applyLocationHash(rawHash, scrollBehavior) {
        var id = (rawHash || "").replace(/^#/, "");
        try { id = decodeURIComponent(id); } catch (err) { /* keep raw id */ }
        if (id === "topology") {
          showTab("topology");
          return;
        }
        if (!id || id === "spec") {
          showTab("spec");
          return;
        }
        var heading = typeof window.specHeadingById === "function" ? window.specHeadingById(id) : null;
        if (!heading) {
          var el = document.getElementById(id);
          if (el && document.querySelector("#tab-spec .spa-article") &&
              document.querySelector("#tab-spec .spa-article").contains(el)) {
            heading = el;
          }
        }
        showTab("spec", heading ? heading.id : "spec");
        if (heading && typeof window.scrollSpecHeading === "function") {
          var behavior = scrollBehavior || "auto";
          var go = function () { window.scrollSpecHeading(heading, behavior); };
          requestAnimationFrame(function () {
            go();
            requestAnimationFrame(go);
          });
          /* Spec pane may still be measuring after the tab turns on. */
          if (behavior === "auto") setTimeout(go, 80);
        }
      }

      window.applyLocationHash = applyLocationHash;

      Array.prototype.forEach.call(buttons, function (b) {
        b.addEventListener("click", function () { showTab(b.getAttribute("data-tab")); });
      });
      if (brand) {
        brand.addEventListener("click", function (event) {
          event.preventDefault();
          showTab(brand.getAttribute("data-tab") || "spec");
        });
      }

      window.addEventListener("hashchange", function () {
        applyLocationHash(location.hash, "smooth");
      });

      applyLocationHash(location.hash, "auto");
    })();

    (function () {
      var table = document.getElementById("door-access");
      if (!table) return;
      var doorRoot = table.querySelector("[data-door-select]");
      var nameEl = doorRoot.querySelector("[data-door-name]");
      var indexEl = doorRoot.querySelector("[data-door-index]");
      var uplinkEl = table.querySelector("[data-door-uplink]");
      var statusRoot = table.querySelector("[data-status-select]");
      var statusNameEl = statusRoot.querySelector("[data-status-name]");
      var XG = { name: "Pro XG 24 PoE", href: "https://store.ui.com/us/en/products/usw-pro-xg-24-poe" };
      var FLEX = { name: "Flex 2.5G PoE", href: "https://store.ui.com/us/en/products/usw-flex-2-5g-8-poe" };
      var G3 = {
        name: "G3 Reader",
        href: "https://store.ui.com/us/en/products/ua-g3",
        meta: []
      };
      var LOCK = {
        name: "Fail-Secure Strike Lock",
        href: "https://store.ui.com/us/en/products/uacc-lock-strike-secure-15mm",
        meta: []
      };
      var DPS = {
        name: "Securitron DPS",
        href: "https://www.securitron.com/en/products/system-accessories/dps-w--dps-m",
        meta: []
      };
      function turret(place) {
        return {
          name: "G6 Pro Turret",
          href: "https://store.ui.com/us/en/products/uvc-g6-pro-turret",
          meta: [place]
        };
      }
      var doors = [
        {
          id: "front",
          name: "Front Door",
          uplink: XG,
          hint: "G6 Pro Entry · Frontyard",
          reader: {
            name: "G6 Pro Entry",
            href: "https://store.ui.com/us/en/products/uvc-g6-pro-entry",
            meta: []
          },
          camera: turret("Frontyard / Front Eave / North East"),
          lock: LOCK,
          dps: DPS
        },
        {
          id: "mud",
          name: "Mud Door",
          uplink: XG,
          hint: "G3 Reader · Backyard",
          reader: G3,
          camera: turret("Backyard / Balcony Eave / South West"),
          lock: LOCK,
          dps: DPS
        },
        {
          id: "dining",
          name: "Dining Door",
          uplink: XG,
          hint: "G3 Reader · Walkway",
          reader: G3,
          camera: {
            name: "G6 Pro Bullet",
            href: "https://store.ui.com/us/en/products/uvc-g6-pro-bullet",
            meta: ["Walkway / Balcony Eave / South East"]
          },
          lock: LOCK,
          dps: DPS
        },
        {
          id: "basement",
          name: "Basement Door",
          uplink: XG,
          hint: "G3 Reader · Courtyard",
          reader: G3,
          camera: turret("Courtyard / Eave"),
          lock: LOCK,
          dps: DPS
        },
        {
          id: "garage",
          name: "Garage Door",
          uplink: FLEX,
          hint: "G3 Reader · Laneway · Flex",
          reader: G3,
          camera: turret("Laneway / Garage / South"),
          lock: LOCK,
          dps: DPS
        }
      ];
      var statuses = [
        { id: "locked", name: "Locked", lock: false, dps: false, hint: "Closed · Locked" },
        { id: "unlocked", name: "Unlocked", lock: true, dps: false, hint: "Closed · Unlocked" },
        { id: "open", name: "Open", lock: true, dps: true, hint: "Open · Unlocked" },
        { id: "forced", name: "Unauthorized Opening", lock: false, dps: true, hint: "Open · Locked" }
      ];
      var ready = false;

      function pad(n) {
        return (n < 10 ? "0" : "") + n;
      }

      function metaText(item) {
        return item.meta.join("\n");
      }

      function currentMeta(row) {
        var box = row.querySelector("[data-role-meta]");
        var lines = [];
        Array.prototype.forEach.call(box.querySelectorAll(".cell-meta"), function (line) {
          lines.push(line.textContent);
        });
        return lines.join("\n");
      }

      function fillUplink(door, animate) {
        var prev = uplinkEl.textContent.replace(/\s+/g, " ").trim();
        var next = "PoE++ from " + door.uplink.name;
        uplinkEl.textContent = "";
        uplinkEl.appendChild(document.createTextNode("PoE++ from "));
        var link = document.createElement("a");
        link.href = door.uplink.href;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = door.uplink.name;
        uplinkEl.appendChild(link);
        if (animate && prev !== next) {
          uplinkEl.classList.remove("is-fresh");
          void uplinkEl.offsetWidth;
          uplinkEl.classList.add("is-fresh");
        }
      }

      function fillRole(role, item, animate) {
        var row = table.querySelector('.door-role[data-role="' + role + '"]');
        var link = row.querySelector("[data-role-name]");
        var changed = link.textContent !== item.name || currentMeta(row) !== metaText(item);
        link.href = item.href;
        link.textContent = item.name;
        var box = row.querySelector("[data-role-meta]");
        box.textContent = "";
        item.meta.forEach(function (line) {
          var span = document.createElement("span");
          span.className = "cell-meta";
          span.textContent = line;
          box.appendChild(span);
        });
        if (animate && changed) {
          row.classList.remove("is-fresh");
          void row.offsetWidth;
          row.classList.add("is-fresh");
        }
      }

      function placeList(button, list) {
        var rect = button.getBoundingClientRect();
        var gap = 6;
        var edge = 8;
        var mast = document.querySelector(".masthead");
        var mastBottom = mast ? mast.getBoundingClientRect().bottom : 0;
        list.style.position = "fixed";
        list.style.left = rect.left + "px";
        list.style.width = rect.width + "px";
        list.style.right = "auto";
        list.style.maxHeight = "";
        list.style.overflowY = "";
        list.style.top = "0px";
        list.style.bottom = "auto";
        var height = list.scrollHeight;
        var spaceBelow = window.innerHeight - rect.bottom - gap - edge;
        var spaceAbove = rect.top - mastBottom - gap - edge;
        var openDown = height <= spaceBelow || spaceBelow >= spaceAbove;
        var room = Math.max(120, openDown ? spaceBelow : spaceAbove);
        if (openDown) {
          list.style.top = (rect.bottom + gap) + "px";
          list.style.bottom = "auto";
        } else {
          list.style.top = "auto";
          list.style.bottom = (window.innerHeight - rect.top + gap) + "px";
        }
        if (height > room) {
          list.style.maxHeight = room + "px";
          list.style.overflowY = "auto";
        }
      }

      function bindMenu(root, items, hooks) {
        var button = root.querySelector(".door-select-btn");
        var list = root.querySelector(".door-select-list");
        var index = 0;
        var active = 0;

        items.forEach(function (item, i) {
          var opt = document.createElement("li");
          opt.className = "door-opt" + (hooks.plain ? " is-plain" : "");
          opt.id = hooks.idPrefix + item.id;
          opt.setAttribute("role", "option");
          opt.setAttribute("data-index", String(i));
          hooks.fillOption(opt, item, i);
          list.appendChild(opt);
        });

        function paintActive() {
          Array.prototype.forEach.call(list.children, function (opt, i) {
            opt.classList.toggle("is-active", i === active);
            opt.setAttribute("aria-selected", i === index ? "true" : "false");
          });
          var current = list.children[active];
          if (current && !list.hidden) {
            button.setAttribute("aria-activedescendant", current.id);
            var top = current.offsetTop;
            var bottom = top + current.offsetHeight;
            if (top < list.scrollTop) list.scrollTop = top;
            else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
          }
        }

        function openList() {
          if (hooks.onOpen) hooks.onOpen();
          list.hidden = false;
          root.classList.add("is-open");
          button.setAttribute("aria-expanded", "true");
          active = index;
          placeList(button, list);
          paintActive();
        }

        function closeList() {
          list.hidden = true;
          root.classList.remove("is-open");
          button.setAttribute("aria-expanded", "false");
          button.removeAttribute("aria-activedescendant");
        }

        function commit(i, animate) {
          index = i;
          active = i;
          hooks.apply(items[i], i, animate);
          paintActive();
        }

        function choose(i) {
          commit(i, ready);
          closeList();
        }

        button.addEventListener("click", function () {
          if (list.hidden) openList();
          else closeList();
        });

        button.addEventListener("keydown", function (event) {
          var key = event.key;
          if (key === "ArrowDown" || key === "ArrowUp") {
            event.preventDefault();
            if (list.hidden) openList();
            else active = (active + (key === "ArrowDown" ? 1 : items.length - 1)) % items.length;
            paintActive();
          } else if (key === "Home") {
            event.preventDefault();
            if (list.hidden) openList();
            active = 0;
            paintActive();
          } else if (key === "End") {
            event.preventDefault();
            if (list.hidden) openList();
            active = items.length - 1;
            paintActive();
          } else if (key === "Enter" || key === " ") {
            event.preventDefault();
            if (list.hidden) openList();
            else choose(active);
          } else if (key === "Escape" && !list.hidden) {
            event.preventDefault();
            closeList();
          }
        });

        list.addEventListener("click", function (event) {
          var opt = event.target.closest(".door-opt");
          if (!opt) return;
          choose(Number(opt.getAttribute("data-index")));
          button.focus();
        });

        list.addEventListener("mousemove", function (event) {
          var opt = event.target.closest(".door-opt");
          if (!opt || list.hidden) return;
          active = Number(opt.getAttribute("data-index"));
          paintActive();
        });

        document.addEventListener("click", function (event) {
          if (!root.contains(event.target) && !list.contains(event.target)) closeList();
        });

        return { close: closeList, commit: commit };
      }

      function switchLabel(which, on) {
        if (which === "lock") return on ? "Unlocked" : "Locked";
        return on ? "Open" : "Closed";
      }

      function paintSwitch(which, on, animate) {
        var control = table.querySelector('.door-switch[data-switch="' + which + '"]');
        var was = control.getAttribute("aria-checked") === "true";
        var label = switchLabel(which, on);
        control.setAttribute("aria-checked", on ? "true" : "false");
        control.setAttribute("aria-label", (which === "lock" ? "Lock，" : "DPS，") + label);
        control.classList.toggle("is-on", on);
        control.querySelector("[data-switch-label]").textContent = label;
        if (animate && was !== on) {
          var row = control.closest(".door-role");
          row.classList.remove("is-fresh");
          void row.offsetWidth;
          row.classList.add("is-fresh");
        }
      }

      function statusIndexFor(lockOn, dpsOn) {
        var found = 0;
        statuses.forEach(function (state, i) {
          if (state.lock === lockOn && state.dps === dpsOn) found = i;
        });
        return found;
      }

      function equalizeRows() {
        var rows = table.querySelectorAll(".door-role");
        var stacked = window.matchMedia("(max-width: 720px)").matches;
        Array.prototype.forEach.call(rows, function (row) { row.style.height = ""; });
        if (stacked) return;
        var max = 0;
        Array.prototype.forEach.call(rows, function (row) {
          var h = row.getBoundingClientRect().height;
          if (h > max) max = h;
        });
        if (max < 1) return;
        var px = Math.ceil(max) + "px";
        Array.prototype.forEach.call(rows, function (row) { row.style.height = px; });
      }
      window.equalizeDoorRows = equalizeRows;

      var doorMenu;
      var statusMenu;

      doorMenu = bindMenu(doorRoot, doors, {
        idPrefix: "door-opt-",
        fillOption: function (opt, door, i) {
          var num = document.createElement("span");
          num.className = "door-opt-index";
          num.textContent = pad(i + 1);
          var copy = document.createElement("span");
          copy.className = "door-opt-name";
          copy.textContent = door.name;
          opt.appendChild(num);
          opt.appendChild(copy);
        },
        onOpen: function () { statusMenu.close(); },
        apply: function (door, i, animate) {
          nameEl.textContent = door.name;
          indexEl.textContent = pad(i + 1) + " / " + pad(doors.length);
          doorRoot.querySelector(".door-select-btn").setAttribute("aria-label", "人行门，" + door.name + "，第 " + (i + 1) + " 扇，共 " + doors.length + " 扇");
          fillUplink(door, animate);
          fillRole("reader", door.reader, animate);
          fillRole("camera", door.camera, animate);
          fillRole("lock", door.lock, animate);
          fillRole("dps", door.dps, animate);
          equalizeRows();
        }
      });

      statusMenu = bindMenu(statusRoot, statuses, {
        idPrefix: "door-status-",
        plain: true,
        fillOption: function (opt, state) {
          var copy = document.createElement("span");
          copy.className = "door-opt-name";
          copy.textContent = state.name;
          opt.appendChild(copy);
        },
        onOpen: function () { doorMenu.close(); },
        apply: function (state, i, animate) {
          statusNameEl.textContent = state.name;
          statusRoot.querySelector(".door-select-btn").setAttribute("aria-label", "Access 状态，" + state.name + "，" + state.hint);
          paintSwitch("lock", state.lock, animate);
          paintSwitch("dps", state.dps, animate);
        }
      });

      var relayBtn = table.querySelector(".door-relay-btn");
      var relayNote = table.querySelector(".door-relay-note");
      function paintRelay(wet) {
        relayBtn.classList.toggle("is-wet", wet);
        relayBtn.setAttribute("aria-checked", wet ? "true" : "false");
        relayBtn.setAttribute("aria-label", wet ? "门锁输出，12V = 1A" : "门锁输出，DRY");
        relayNote.hidden = wet;
      }
      relayBtn.addEventListener("click", function () {
        paintRelay(!relayBtn.classList.contains("is-wet"));
      });

      Array.prototype.forEach.call(table.querySelectorAll(".door-switch"), function (control) {
        control.addEventListener("click", function () {
          var which = control.getAttribute("data-switch");
          var lockOn = table.querySelector('.door-switch[data-switch="lock"]').classList.contains("is-on");
          var dpsOn = table.querySelector('.door-switch[data-switch="dps"]').classList.contains("is-on");
          if (which === "lock") lockOn = !lockOn;
          else dpsOn = !dpsOn;
          statusMenu.commit(statusIndexFor(lockOn, dpsOn), true);
        });
      });

      var specPane = document.getElementById("tab-spec");
      if (specPane) {
        specPane.addEventListener("scroll", function () {
          doorMenu.close();
          statusMenu.close();
        }, { passive: true });
      }
      window.addEventListener("resize", function () {
        doorMenu.close();
        statusMenu.close();
        equalizeRows();
      });

      doorMenu.commit(0, false);
      statusMenu.commit(0, false);
      ready = true;
      equalizeRows();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(equalizeRows);
    })();
})();