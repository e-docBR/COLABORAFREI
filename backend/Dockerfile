FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (gcc and libpq-dev for postgres)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy project definition
COPY pyproject.toml README.md ./
COPY app ./app

# Install dependencies (requires app code to be present for setuptools build)
RUN pip install --no-cache-dir .

# Copy application code (overwriting if needed, effectively adding other files like migrations)
COPY . .

# Expose port
EXPOSE 5000

# Entrypoint handled by docker-compose or command
CMD ["flask", "--app", "app", "run", "--host=0.0.0.0", "--port=5000"]
