# ESTÁGIO 1: Compilação (Builder)
FROM golang:1.21 AS builder

# Instala o Node.js e ferramentas necessárias para compilar o frontend
RUN apt-get update && apt-get install -y curl jq \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs build-essential

# Define a pasta de trabalho e copia todo o seu repositório para dentro
WORKDIR /build
COPY . .

# Compila os binários e empacota tudo (exatamente como você fez no terminal)
RUN cd server && make build && make package

# ==============================================================================
# ESTÁGIO 2: Produção (Imagem final leve)
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Instala apenas as dependências de sistema para o Mattermost rodar
RUN apt-get update && apt-get install -y \
    ca-certificates curl jq libc6 libffi-dev libgmp-dev libjpeg-dev \
    libpq-dev libssl-dev mailcap netcat-openbsd xmlsec1 tzdata \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 2000 mattermost \
    && useradd -u 2000 -g 2000 -m -s /bin/bash mattermost

WORKDIR /mattermost

# A mágica acontece aqui: O Docker puxa o .tar.gz do Estágio 1, sem depender do GitHub!
COPY --from=builder /build/server/dist/mattermost-*.tar.gz /tmp/mattermost.tar.gz

# Extrai e aplica permissões
RUN tar -xvzf /tmp/mattermost.tar.gz -C /tmp \
    && cp -a /tmp/mattermost/. /mattermost/ \
    && rm -rf /tmp/mattermost* \
    && chown -R mattermost:mattermost /mattermost

USER mattermost
EXPOSE 8065
CMD ["./bin/mattermost"]