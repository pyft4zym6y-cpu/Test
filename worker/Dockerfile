# Аудит-сервер Commerce OS. Собирать из КОРНЯ репозитория:
#   docker build -f worker/Dockerfile -t weexp-audit .
# Воркер импортирует чистые модули портала (../portal/src/lib) — поэтому в образ
# кладём и worker/, и portal/ рядом, как в репозитории.
FROM mcr.microsoft.com/playwright:v1.62.1-jammy

WORKDIR /app/worker
COPY worker/package.json worker/package-lock.json ./
RUN npm ci

WORKDIR /app
COPY worker/ ./worker/
COPY portal/ ./portal/

WORKDIR /app/worker
ENV PORT=8787
ENV AUDIT_OUT=/app/worker/results
# Браузер уже в образе Playwright — заново не качаем.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
EXPOSE 8787
CMD ["npm", "run", "serve"]
