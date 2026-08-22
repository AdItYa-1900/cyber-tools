# -*- coding: utf-8 -*-
"""Double-click launcher for running the toolkit on your own PC.

This just starts serve.py (the single server that runs the whole app and
the tracer on one port) and opens the browser. Kept as a friendly
entry point so an officer can double-click "Start Sutra" instead of
typing a command.
"""
import os
import runpy
import sys
import threading
import time
import webbrowser

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("PORT", "8777"))


def open_browser():
    time.sleep(1.4)
    try:
        webbrowser.open(f"http://127.0.0.1:{PORT}/index.html")
    except Exception:
        pass


if __name__ == "__main__":
    print("Starting Sutra… your browser will open in a moment.")
    print("Keep this window open while you work. Close it to stop.\n")
    threading.Thread(target=open_browser, daemon=True).start()
    # bind to localhost for a desktop run; serve.py honours HOST/PORT
    os.environ.setdefault("HOST", "127.0.0.1")
    sys.argv = [os.path.join(HERE, "serve.py")]
    runpy.run_path(os.path.join(HERE, "serve.py"), run_name="__main__")
