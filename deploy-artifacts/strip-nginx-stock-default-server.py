#!/usr/bin/env python3
"""
Amazon Linux nginx packages ship http { ... include conf.d/*.conf ... server {... server_name _; root /usr/share/nginx/html;} }.
conf.d/site.conf cannot serve :80 alongside that duplicate server_name (_) — nginx drops our vhost.

This script removes the stock default server block after the conf.d include (idempotent).
"""
from __future__ import annotations

import pathlib
import re
import sys


def strip_conf(path: pathlib.Path) -> bool:
    text = path.read_text()
    if "/usr/share/nginx/html" not in text:
        print(f"strip-nginx: marker not present, skipping {path}")
        return False
    # Exact block from Fedora/AL nginx default (keep conf.d include, drop following server {})
    pattern = (
        r"(\n    include /etc/nginx/conf\.d/\*\.conf;\n)"
        r"\n    server \{"
        r"\n        listen       80;"
        r"\n        listen       \[::\]:80;"
        r"\n        server_name  _;"
        r"\n        root         /usr/share/nginx/html;"
        r".*?\n    \}\n"
    )
    new, count = re.subn(pattern, r"\1\n", text, count=1, flags=re.DOTALL)
    if count == 0:
        print(f"strip-nginx: pattern not matched (already stripped or different layout); not modifying {path}")
        return False
    if count != 1:
        print(f"strip-nginx: expected at most 1 replacement on {path}, got {count}", file=sys.stderr)
        sys.exit(1)
    path.write_text(new)
    print(f"strip-nginx: removed stock default server from {path}")
    return True


def main() -> None:
    strip_conf(pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/etc/nginx/nginx.conf"))


if __name__ == "__main__":
    main()
