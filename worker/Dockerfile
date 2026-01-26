FROM python:2.7-slim

# Fix for Debian Buster repositories being archived
RUN echo "deb http://archive.debian.org/debian buster main" > /etc/apt/sources.list && \
    echo "deb http://archive.debian.org/debian-security buster/updates main" >> /etc/apt/sources.list && \
    apt-get -o Acquire::Check-Valid-Until=false update && \
    apt-get -o Acquire::Check-Valid-Until=false install -y \
    git \
    wget \
    gcc \
    python-dev \
    tar \
    emboss \
    && rm -rf /var/lib/apt/lists/*

# Install vsearch binary manually (v2.15.2)
# Using linux-x86_64 architecture (Container must run as linux/amd64)
RUN wget https://github.com/torognes/vsearch/releases/download/v2.15.2/vsearch-2.15.2-linux-x86_64.tar.gz && \
    tar xzf vsearch-2.15.2-linux-x86_64.tar.gz && \
    cp vsearch-2.15.2-linux-x86_64/bin/vsearch /usr/local/bin/ && \
    rm -rf vsearch-2.15.2-linux-x86_64*

# Install Python dependencies
RUN pip install --no-cache-dir \
    pandas==0.24.2 \
    biopython==1.76 \
    "pika<1.2.0"

# Clone CRISPR-PLANTv2
WORKDIR /app
RUN git clone https://github.com/bminkenberg/CRISPR-PLANTv2.git

# Copy worker script and pipeline wrapper
COPY worker.py .
COPY run_pipeline.sh .
RUN chmod +x worker.py run_pipeline.sh

# Expected volume mount point
RUN mkdir -p /data/genomes

ENV RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/%2F
ENV PYTHONUNBUFFERED=1

CMD ["python", "-u", "worker.py"]

