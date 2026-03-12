# ESTÁGIO 1: Compilação (Builder)
FROM golang:1.21 AS builder

# Instala o Node.js e ferramentas necessárias para compilar o frontend
RUN apt-get update && apt-get install -y curl jq \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs build-essential

# Prevenção: Aumenta a memória do Node.js para o build do React não falhar
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Define a pasta de trabalho e copia todo o seu código do GitHub para dentro
WORKDIR /build
COPY . .

# 1. Compila o Frontend (A interface Web e o novo Player de Áudio)
# Instalamos as dependências na raiz do webapp para respeitar os workspaces, e depois compilamos
RUN cd webapp && npm install
RUN cd webapp/channels && npm run build

# 2. Compila o Backend e empacota tudo (Agora a pasta dist do webapp existe!)
RUN cd server && make build && make package

# ==============================================================================
# ESTÁGIO 2: Produção (Imagem final leve)
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Instala apenas as dependências essenciais de sistema
RUN apt-get update && apt-get install -y \
    ca-certificates curl jq libc6 libffi-dev libgmp-dev libjpeg-dev \
    libpq-dev libssl-dev mailcap netcat-openbsd xmlsec1 tzdata \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 2000 mattermost \
    && useradd -u 2000 -g 2000 -m -s /bin/bash mattermost

WORKDIR /mattermost

# Copia o pacote gerado com sucesso no Estágio 1
COPY --from=builder /build/server/dist/mattermost-*.tar.gz /tmp/mattermost.tar.gz

# Extrai e aplica permissões de segurança
RUN tar -xvzf /tmp/mattermost.tar.gz -C /tmp \
    && cp -a /tmp/mattermost/. /mattermost/ \
    && rm -rf /tmp/mattermost* \
    && chown -R mattermost:mattermost /mattermost

USER mattermost
EXPOSE 8065
CMD ["./bin/mattermost"]