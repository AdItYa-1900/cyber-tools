# -*- coding: utf-8 -*-
"""Build data/rdap.js, the IANA RDAP bootstrap tables.

WHY THIS EXISTS
  The tool used to send every lookup to rdap.org, which is a redirect
  service: it works out the right registry and answers 302, so the
  browser pays two round trips, and when rdap.org is slow or down
  everything is slow or down.

  IANA publishes the same routing information as three small files.
  Bundling them lets the tool address the correct registry on the first
  request, which removes a whole round trip and the dependency on a
  third party staying up.

  Sizes are modest: 221 IPv4 prefixes, 34 IPv6 prefixes and 1,200 TLDs
  across 590 registries.

  The publication date of each file is carried through, because an RDAP
  base URL that has moved since then would produce a failed lookup, and
  an officer should be able to see how old the routing table is.
"""
import json, os, sys

sys.stdout.reconfigure(encoding="utf-8")

SRC = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")


def load(name):
    with open(os.path.join(SRC, name), encoding="utf-8") as f:
        return json.load(f)


def https_first(urls):
    """Prefer the TLS endpoint; a browser will refuse the plain-http one
    anyway when the page itself is served over https."""
    for u in urls:
        if u.startswith("https://"):
            return u if u.endswith("/") else u + "/"
    return (urls[0] if urls else "")


def compact(doc):
    out = []
    for keys, urls in doc["services"]:
        url = https_first(urls)
        if url:
            out.append([keys, url])
    return out


v4 = load("rdap_boot.json")
v6 = load("rdap_v6.json")
dns = load("rdap_dns.json")

payload = {
    "v4": compact(v4),
    "v6": compact(v6),
    "dns": compact(dns),
    "published": {
        "v4": v4.get("publication", "")[:10],
        "v6": v6.get("publication", "")[:10],
        "dns": dns.get("publication", "")[:10],
    },
}

os.makedirs(OUT, exist_ok=True)
path = os.path.join(OUT, "rdap.js")
with open(path, "w", encoding="utf-8") as f:
    f.write("/* IANA RDAP bootstrap: which registry answers for a given IP range\n"
            "   or TLD. Source: data.iana.org/rdap. Bundling this lets a lookup\n"
            "   go straight to the right registry instead of bouncing through a\n"
            "   redirect service. */\n")
    f.write("window.RDAP_BOOT = " + json.dumps(payload, separators=(",", ":")) + ";\n")

print(f"v4 prefixes : {sum(len(k) for k, _ in payload['v4']):,}  ({payload['published']['v4']})")
print(f"v6 prefixes : {sum(len(k) for k, _ in payload['v6']):,}  ({payload['published']['v6']})")
print(f"TLDs        : {sum(len(k) for k, _ in payload['dns']):,} across "
      f"{len(payload['dns'])} registries  ({payload['published']['dns']})")
print(f"\nrdap.js  {os.path.getsize(path)/1024:.1f} KB")
