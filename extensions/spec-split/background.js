/* global chrome */

const SPLIT_NONE =
  typeof chrome.tabs.SPLIT_VIEW_ID_NONE === "number"
    ? chrome.tabs.SPLIT_VIEW_ID_NONE
    : -1;

function isSplit(tab) {
  return typeof tab.splitViewId === "number" && tab.splitViewId !== SPLIT_NONE;
}

async function findSplitPartner(tab) {
  if (!isSplit(tab)) return null;
  const tabs = await chrome.tabs.query({ windowId: tab.windowId });
  return tabs.find((t) => t.id !== tab.id && t.splitViewId === tab.splitViewId) || null;
}

/**
 * Open url in Chrome Split View with the Spec tab.
 * If Spec is already split, navigate the other pane instead of nesting splits.
 * Falls back to a normal new tab when Split View API is missing / fails.
 */
async function openBesideSpec(url, specTabId) {
  const specTab = await chrome.tabs.get(specTabId);
  const partner = await findSplitPartner(specTab);
  if (partner) {
    await chrome.tabs.update(partner.id, { url, active: false });
    return { mode: "update-partner", tabId: partner.id };
  }

  try {
    const created = await chrome.tabs.create({
      url,
      splitWithTabId: specTabId,
      openerTabId: specTabId,
      windowId: specTab.windowId,
      active: false,
    });
    return { mode: "create-split", tabId: created.id };
  } catch (err) {
    const created = await chrome.tabs.create({
      url,
      openerTabId: specTabId,
      windowId: specTab.windowId,
      active: false,
    });
    return {
      mode: "fallback-tab",
      tabId: created.id,
      error: String(err && err.message ? err.message : err),
    };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "spec-split-open") return;
  const url = message.url;
  const tabId = sender.tab && sender.tab.id;
  if (!url || tabId == null) {
    sendResponse({ ok: false, error: "missing url or tab" });
    return;
  }
  openBesideSpec(url, tabId)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((err) => sendResponse({ ok: false, error: String(err && err.message ? err.message : err) }));
  return true;
});
