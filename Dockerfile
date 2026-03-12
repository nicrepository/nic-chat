# Usa uma imagem base limpa do Ubuntu
FROM ubuntu:22.04

# Evita prompts interativos que travam a instalação no momento do build
ENV DEBIAN_FRONTEND=noninteractive

# Instala as dependências essenciais de sistema exigidas pelo Mattermost
RUN apt-get update && apt-get install -y \
    ca-certificates curl jq libc6 libffi-dev libgmp-dev libjpeg-dev \
    libpq-dev libssl-dev mailcap netcat-openbsd xmlsec1 tzdata \
    && rm -rf /var/lib/apt/lists/*

# Cria o usuário e grupo com IDs específicos exigidos (2000)
RUN groupadd -g 2000 mattermost \
    && useradd -u 2000 -g 2000 -m -s /bin/bash mattermost

# Define o diretório de trabalho apontando para o caminho correto dos volumes
WORKDIR /mattermost

# Copia o arquivo compilado da pasta dist para a imagem temporária
# Importante: O build vai procurar esse pacote gerado previamente
COPY dist/mattermost-*.tar.gz /tmp/mattermost.tar.gz

# Extrai o pacote do sistema e move o conteúdo para a pasta de trabalho oficial
RUN tar -xvzf /tmp/mattermost.tar.gz -C /tmp \
    && cp -a /tmp/mattermost/. /mattermost/ \
    && rm -rf /tmp/mattermost*

# Aplica as permissões restritas para o usuário correto
RUN chown -R mattermost:mattermost /mattermost

# Troca para o usuário sem privilégios de root por segurança
USER mattermost

# Expõe a porta padrão
EXPOSE 8065

# Inicia o binário do servidor
CMD ["./bin/mattermost"]