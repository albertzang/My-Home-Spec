# Home Spec Split View

Local Chrome extension: Spec body links open in **Chrome Split View** beside the Spec tab (no iframe).

## Requirements

- Chrome **155+** (Split View API: `tabs.create({ splitWithTabId })`)
- Spec at `http://127.0.0.1:8000/`, `http://localhost:8000/`, or `https://albertzang.github.io/My-Home-Spec/`

## Install (this machine only)

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. **Load unpacked** → choose this folder: `extensions/spec-split`
4. Keep the Spec tab open; click a product / brand / datasheet link in the Spec article

Modifier / Ctrl / middle-click still use the normal new-tab behavior. In-page refs (`§1.3`, Topology, heading tags) are unchanged.

## Behavior

- First link: creates a Split View with the Spec tab
- Later links: navigate the other pane (does not nest another split)
- Older Chrome without the API: opens a normal background tab instead
