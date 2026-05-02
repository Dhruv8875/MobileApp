# This file makes supervisor's `uvicorn server:app` command bootstrap
# the actual Node.js Roomzy backend on port 8001.
#
# Supervisor launches `/root/.venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001`.
# When uvicorn imports this module, we replace the running Python process with
# `node server.js` via os.execvp. The Node process inherits PID + supervisor
# control, so autorestart + logs continue to work seamlessly.
import os
import sys

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BACKEND_DIR)

# Ensure node finds its modules
node_bin = "/usr/bin/node"
server_js = os.path.join(BACKEND_DIR, "server.js")

sys.stdout.flush()
sys.stderr.flush()
os.execvp(node_bin, [node_bin, server_js])
