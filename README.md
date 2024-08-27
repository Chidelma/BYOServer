# BYOServer

BYOServer is an API server wrapper for BYOS [(Bring Your Own Storage)](https://github.com/Chidelma/BYOS). This enabales you to deploy BYOS as a standalone API server.

## Features

- Uses BYOS [(Bring Your Own Storage)](https://github.com/Chidelma/BYOS) integration
- Use Tachyon [(API Framework)](https://github.com/Chidelma/Tachyon) for routes

## Installation

```bash
bun create @vyckr/byoserver
```

## Configuration

The .env file should be in the root directory of your project. The following environment variables:
```
# Tachyon environment variables
PORT=8000 (optional)
ALLOW_HEADERS=* (optional)
ALLOW_ORGINS=* (optional)
ALLOW_CREDENTIALS=true|false (optional)
ALLOW_EXPOSE_HEADERS=* (optional)
ALLOW_MAX_AGE=3600 (optional)
ALLOW_METHODS=GET,POST,PUT,DELETE,PATCH (optional)
PRODUCTION=true|false (optional)
SAVE_LOGS=true|false (optional)
SAVE_STATS=true|false (optional)
SAVE_REQUESTS=true|false (optional)
SAVE_ERRORS=true|false (optional)

# BYOS environment variables
DB_DIR=/path/to/disk/database (required)
SCHEMA=LOOSE|STRICT (optional)
LOGGING=true|false (optional)
SCHEMA_PATH=/path/to/schema/directory (required if SCHEMA is set to STRICT)
MEM_DR=/path/to/memory/database (optional)
S3_REGION=region (optional)
S3_INDEX_BUCKET=bucket (required)
S3_DATA_BUCKET=bucket (required)
S3_ENDPOINT=https//example.com (optional)
```

## Usage/Example

Make sure you have set the 'SCHEMA_PATH' if 'SCHEMA' is set to 'STRICT'. The schema path should be a directory containing the declaration files. for example:

```
/path/to/schema/directory
    /users.d.ts
```

To run the application, you can use the following command:

```bash 
bun tach
```

These are the available endpoints:

- /byos/[primary]/doc
- /byos/[primary]/docs
- /byos/[primary]/migrate
- /byos/[primary]/schema
- /byos/[primary]/stream/doc
- /byos/[primary]/stream/docs
- /byos/[primary]/join/[secondary]/docs

## Deployment

An Image is provided for deployment specifically for [(AWS Lambda)](https://hub.docker.com/repository/docker/iyormobi/byoserver/general). As for other platforms that don't require specific runtimes, you can simply use the following command:

```bash
docker -rm -it run -p 8000:8000 iyormobi/byoserver:latest
```

Do not forget to configure the environment variables in the Dockerfile/Docker Compose file.

# License

Tachyon is licensed under the MIT License.