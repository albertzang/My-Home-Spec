/* Intercept Spec article links and ask the extension to open them in Split View. */

(function () {
  function isPreviewableHref(href) {
    if (!href || href.charAt(0) === "#") return false;
    var lower = href.toLowerCase();
    if (
      lower.indexOf("javascript:") === 0 ||
      lower.indexOf("mailto:") === 0 ||
      lower.indexOf("tel:") === 0
    ) {
      return false;
    }
    return true;
  }

  function shouldHandleClick(event, anchor) {
    if (event.defaultPrevented) return false;
    if (event.button != null && event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (!anchor || !anchor.href) return false;
    if (anchor.classList.contains("page-ref") || anchor.classList.contains("heading-ref")) {
      return false;
    }
    var href = anchor.getAttribute("href") || "";
    if (!isPreviewableHref(href)) return false;
    /* In-page hash / Spec pane navigation stays in the page. */
    try {
      var url = new URL(anchor.href, location.href);
      if (url.origin === location.origin && url.pathname === location.pathname && url.hash) {
        return false;
      }
    } catch (err) {
      return false;
    }
    return true;
  }

  document.addEventListener(
    "click",
    function (event) {
      var article = document.querySelector("#tab-spec .spa-article");
      if (!article) return;
      var anchor = event.target.closest && event.target.closest("a[href]");
      if (!anchor || !article.contains(anchor)) return;
      if (!shouldHandleClick(event, anchor)) return;

      event.preventDefault();
      event.stopPropagation();
      chrome.runtime.sendMessage(
        { type: "spec-split-open", url: anchor.href },
        function () {
          /* Ignore; background opens the tab. */
          void chrome.runtime.lastError;
        }
      );
    },
    true
  );
})();
