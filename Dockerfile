FROM oven/bun:latest AS build

WORKDIR /tmp

COPY ./node_modules ./node_modules

COPY ./routes ./routes

COPY build.ts ./build.ts

RUN bun run build.ts

FROM iyormobi/tachyon:lambda-nightly

WORKDIR ${LAMBDA_TASK_ROOT}

RUN mkdir -p ./routes

COPY --from=build /tmp/dist/ ./routes

RUN chmod 777 ./routes

RUN chmod 777 /opt/bun

RUN chmod 777 ${LAMBDA_TASK_ROOT}/lambda

RUN chmod 777 ${LAMBDA_RUNTIME_DIR}/bootstrap