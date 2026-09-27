# Copy to env.sh and adjust. n8n 2.x needs Node.js >= 24.
export PATH=/path/to/node24/bin:$PATH
N8N=/path/to/n8n/node_modules/.bin/n8n
export N8N_MODS=/path/to/n8n/node_modules
export N8N_USER_FOLDER=/path/to/throwaway-n8n-home
export N8N_ENCRYPTION_KEY=testkey123 N8N_DIAGNOSTICS_ENABLED=false DB_TYPE=sqlite
# Trust the mock's self-signed certificate and bypass any HTTP proxy for the mocked host.
export NODE_EXTRA_CA_CERTS=$(dirname "${BASH_SOURCE[0]}")/cert.pem
export NO_PROXY=$NO_PROXY,api.rentman.net no_proxy=$no_proxy,api.rentman.net
