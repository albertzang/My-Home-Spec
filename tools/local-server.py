#!/usr/bin/env python3
"""Serve this checkout on localhost:8000 without browser caching.

A normal reload rechecks HTML, CSS, and JavaScript. Python's built-in
server does not send a cache header, so browsers keep stale stylesheets.
"""

import os
from pathlib import Path

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


if __name__ == "__main__":
    os.chdir(Path(__file__).resolve().parent.parent)
    # Bind all interfaces so Cloud Agent / remote port-forward can reach :8000.
    # Still open http://127.0.0.1:8000/ in the browser.
    server = ThreadingHTTPServer(("0.0.0.0", 8000), NoCacheHandler)
    print("Serving /workspace at http://127.0.0.1:8000/ (Cache-Control: no-cache)")
    server.serve_forever()
