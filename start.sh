#!/bin/bash
echo "Starting Ducky-Time..."
open "http://localhost:8000" || xdg-open "http://localhost:8000" 2>/dev/null
python3 -m http.server 8000
