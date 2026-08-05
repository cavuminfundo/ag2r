FROM node:22-alpine

WORKDIR /app

# Installa git, necessario per alcuni script interni (es. lettura commit hash)
RUN apk add --no-cache git

# Copia package.json e package-lock.json per sfruttare la cache
COPY package*.json ./

# Installa solo le dipendenze di produzione
RUN npm install --omit=dev

# Copia il resto del codice sorgente
COPY . .

# Esponi la porta del server
EXPOSE 3000

# Delay configurabile per consentire l'avvio di servizi collegati (es. Antigravity)
ENV STARTUP_DELAY=0

# Il comando di avvio gestisce l'eventuale timer prima di eseguire Node
CMD sh -c "if [ \"$STARTUP_DELAY\" -gt 0 ]; then echo \"Waiting $STARTUP_DELAY seconds for dependencies to start...\"; sleep \"$STARTUP_DELAY\"; fi && npm start"
