# -*- coding: utf-8 -*-
"""Tiny KV client for the tracer, over the Upstash / Vercel KV REST API.

Vercel functions are stateless and have no persistent disk, so a hit
logged by one invocation cannot be read by another through a file. A KV
store is the shared memory between them.

This talks to the store over plain HTTPS with the standard library, so
there is no dependency to install. It works with either set of
environment variables Vercel injects:

    KV_REST_API_URL / KV_REST_API_TOKEN            (Vercel KV)
    UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN  (Upstash direct)

If neither is configured, configured() is False and the functions return
a clear "storage not set up" message instead of failing obscurely.
"""
import json
import os
import urllib.request

URL = (os.environ.get("KV_REST_API_URL")
       or os.environ.get("UPSTASH_REDIS_REST_URL") or "").rstrip("/")
TOKEN = (os.environ.get("KV_REST_API_TOKEN")
         or os.environ.get("UPSTASH_REDIS_REST_TOKEN") or "")

# Hits are kept for this many seconds, then the store drops them. A
# tracer log is evidence for a live case, not an archive; export what you
# need into the case file.
TTL_SECONDS = int(os.environ.get("TRACER_TTL_SECONDS", str(60 * 60 * 24 * 30)))


def configured():
    return bool(URL and TOKEN)


def _cmd(command):
    """Run one Redis command, given as a list, and return its result."""
    req = urllib.request.Request(
        URL,
        data=json.dumps(command).encode(),
        headers={"Authorization": "Bearer " + TOKEN,
                 "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=8) as r:
        return json.loads(r.read().decode()).get("result")


def append_hit(token, record):
    key = "tracer:" + token
    _cmd(["RPUSH", key, json.dumps(record, ensure_ascii=False)])
    _cmd(["EXPIRE", key, str(TTL_SECONDS)])


def read_hits(token):
    raw = _cmd(["LRANGE", "tracer:" + token, "0", "-1"]) or []
    out = []
    for item in raw:
        try:
            out.append(json.loads(item))
        except (ValueError, TypeError):
            pass
    return out
