# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim

WORKDIR /app
COPY . .
RUN --mount=type=secret,id=proxy_ca,required=false \
    if [ -f /run/secrets/proxy_ca ]; then \
      NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca npm ci --strict-ssl=true; \
    else \
      npm ci --strict-ssl=true; \
    fi

EXPOSE 8081 19000 19001 19002
CMD ["npm", "start", "--", "--lan"]
