#!/bin/sh

# Generate runtime config from environment variables
cat > /usr/share/nginx/html/config.js << EOF
window.__RUNTIME_CONFIG__ = {
  VITE_API_URL: "${VITE_API_URL}",
  VITE_SOCKET_URL: "${VITE_SOCKET_URL}",
  VITE_GROQ_API_KEY: "${VITE_GROQ_API_KEY}"
};
EOF

echo "Runtime config generated:"
cat /usr/share/nginx/html/config.js

# Start nginx
exec nginx -g "daemon off;"
