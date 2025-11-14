# 📱 SMS SERVER - GAMMU + API REST
FROM ubuntu:22.04

# Variables d'environnement
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Africa/Brazzaville

# Installation des dépendances système
RUN apt-get update && apt-get install -y \
    gammu \
    gammu-smsd \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    wget \
    udev \
    usb-modeswitch \
    usb-modeswitch-data \
    && rm -rf /var/lib/apt/lists/*

# Créer utilisateur non-root
RUN useradd -m -s /bin/bash smsuser && \
    usermod -a -G dialout smsuser

# Répertoire de travail
WORKDIR /app

# Copier les fichiers
COPY requirements.txt .
COPY src/ ./src/
COPY config/ ./config/

# Installation des dépendances Python
RUN python3 -m pip install --no-cache-dir -r requirements.txt

# Permissions
RUN chown -R smsuser:smsuser /app
RUN chmod +x src/start.sh

# Créer les répertoires nécessaires
RUN mkdir -p /var/spool/gammu/inbox /var/spool/gammu/outbox /var/spool/gammu/sent /var/spool/gammu/error && \
    chown -R smsuser:smsuser /var/spool/gammu

# Exposition du port
EXPOSE 8080

# Utilisateur non-root
USER smsuser

# Point d'entrée
CMD ["./src/start.sh"]
