# Аудит-сервер Commerce OS. Собирать из КОРНЯ репозитория:
#   docker build -f worker/Dockerfile -t weexp-audit .
# Воркер импортирует чистые модули портала (../portal/src/lib) — поэтому в образ
# кладём и worker/, и portal/ рядом, как в репозитории.
FROM mcr.microsoft.com/playwright:v1.62.1-jammy

WORKDIR /app/worker
COPY worker/package.json worker/package-lock.json ./
# Сервер стартует через tsx (запускаем TypeScript напрямую), поэтому tsx живёт
# в dependencies, а не в dev: раньше он был dev-зависимостью, и чтобы npm ci его
# не пропустил, весь образ собирался с NODE_ENV=development. Переменная не
# снималась после установки — контейнер и работал в дев-режиме, а vitest и
# @types/* ехали в боевой образ. Теперь состав честный: только прод-зависимости.
RUN npm ci --omit=dev
# mcporter — мост к Exa для внешнего поиска (соцсети, инфофон, отзывы). Без него
# agentReach молча деградировал: бинаря в образе не было с самого начала.
RUN npm i -g mcporter || echo "mcporter не установлен — внешний поиск будет помечен как недоступный" 

WORKDIR /app
# Скиллы плагинов (~5.7 МБ вместе с references). Без этого движок аудита их не
# видит: .claude/ живёт в корне репозитория, а контейнер собирался только из
# worker/ и portal/. В промпты идут лишь SKILL.md — остальное лежит про запас.
COPY .claude/skills/ ./.claude/skills/
COPY worker/ ./worker/
COPY portal/ ./portal/

WORKDIR /app/worker
ENV NODE_ENV=production
ENV PORT=8787
# Каталог результатов вынесен на постоянный том Railway (Mount path /data).
# Внутри образа файлы не переживают редеплой — тогда документы прогонов терялись.
ENV AUDIT_OUT=/data/results
# Браузер уже в образе Playwright — заново не качаем.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
EXPOSE 8787
CMD ["npm", "run", "serve"]
