# Conler Studio website

Static HTML/CSS/JS site for Conler Studio.

## Run locally

Serve the folder over HTTP. Do not open the files as `file://` — the carousel uses ES modules, which browsers block on the file protocol.

```bash
python3 -m http.server 8090
```

Then open http://localhost:8090
