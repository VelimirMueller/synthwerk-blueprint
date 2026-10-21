# Python service conventions

- Scope: every Synthwerk HTTP service in Python (FastAPI). Today: `synthwerk-vision`.
- Goal: a Python service has the same health endpoints, telemetry and log shape as a Go service on day one.
- Go counterpart: [synthwerk#25](https://github.com/VelimirMueller/synthwerk/issues/25). This page: [synthwerk#71](https://github.com/VelimirMueller/synthwerk/issues/71).
- Sources: ecosystem plan `01-decisions.md` (D-07, D-12, D-15, D-20, D-36, D-40), `04-logging-observability-reporting.md`, `services/synthwerk-pulse.md` §8.
- Rule: [synthwerk/docs/architecture.md](https://github.com/VelimirMueller/synthwerk/blob/main/docs/architecture.md) wins over this page. Change it there first.

## 1. Layout

| Path | Contents |
|---|---|
| `src/<package>/platform/config.py` | `Settings` (pydantic-settings), env prefix `SYNTHWERK_<SERVICE>_` |
| `src/<package>/platform/log.py` | JSON logging setup (structlog over stdlib `logging`) |
| `src/<package>/platform/otel.py` | OpenTelemetry setup: resource, traces, metrics, logs |
| `src/<package>/platform/health.py` | `/healthz` and `/readyz` router and readiness checks |
| `tests/` | All tests (D-15). Never next to the source. |

- When the `synthwerk_contracts` Python kit (`kit/{health,log}`) is published, use it and delete the local copy.
- Until then, keep the local module small and test it against the contract schema.

## 2. Health and readiness

| Endpoint | Status code | Body | Rules |
|---|---|---|---|
| `GET /healthz` | 200 | `{"status":"ok"}` | Liveness. No dependency checks. Answers in < 10 ms. |
| `GET /readyz` | 200 when `ok` or `degraded`, 503 when `down` | `{"status","version","commit","checks":[{"name","status","latency_ms","detail"}]}` | Readiness. Answers in < 1 s. Pulse times out at 3 s. |

- `status` and each `checks[].status` take one value: `ok`, `degraded` or `down`. On `/healthz`, `status` is always `ok`.
- Both `/readyz` answers (200 and 503) use the same body.

| `/readyz` field | Required | Rule |
|---|---|---|
| `status` | yes | `ok`, `degraded` or `down` |
| `version` | yes | String, max 64 characters |
| `commit` | yes | Git SHA, `^[0-9a-f]{7,40}$` |
| `checks` | yes | Array, max 32 items |
| `checks[].name` | yes | `^[a-z][a-z0-9_-]*$`, max 64 characters |
| `checks[].status` | yes | `ok`, `degraded` or `down` |
| `checks[].latency_ms` | yes | Integer, 0 to 60000 |
| `checks[].detail` | no | Max 256 characters |

- Every object has `additionalProperties: false`. An extra field breaks the contract.
- The overall `status` is the worst check status.
- One check per dependency the service needs to serve traffic (for example `model`, `postgres`, `nats`).
- Each check has its own timeout. The sum stays below 1 s.
- `detail` is short, constant text. It never holds secrets, URLs with credentials or user data.
- `/readyz` returns 503 until startup is complete (for example, until the model is loaded).
- Both endpoints need no auth. They are on the Spectral allow-list in `synthwerk-contracts`.
- No other health path. A service that has `/health` removes it.
- The image `HEALTHCHECK` calls `/healthz`. The deploy smoke test calls `/readyz`.
- The shape is defined in `openapi/_shared/health.yaml` in [synthwerk-contracts](https://github.com/VelimirMueller/synthwerk-contracts) ([synthwerk#23](https://github.com/VelimirMueller/synthwerk/issues/23)). If they differ, the contract wins: change this page.

## 3. Environment variables

| Kind | Pattern | Example |
|---|---|---|
| Service setting | `SYNTHWERK_<SERVICE>_<NAME>` (D-40) | `SYNTHWERK_VISION_MODEL_PATH` |
| Shared platform setting | `SYNTHWERK_PLATFORM_<NAME>` (D-40) | `SYNTHWERK_PLATFORM_ENV` |
| OpenTelemetry | `OTEL_*`, no prefix (OTel spec) | `OTEL_EXPORTER_OTLP_ENDPOINT` |

| Variable | Value |
|---|---|
| `SYNTHWERK_PLATFORM_ENV` | `local`, `ci`, `dev`, `stg` or `prd` |
| `SYNTHWERK_<SERVICE>_LOG_LEVEL` | `DEBUG`, `INFO`, `WARN`, `ERROR`. Default `INFO`. |
| `SYNTHWERK_<SERVICE>_LOG_FORMAT` | `json` (default) or `console`. `console` only in `local`. |
| `OTEL_SERVICE_NAME` | Repo name, for example `synthwerk-vision` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Collector address, for example `http://otel-collector:4317` |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | `grpc` |
| `OTEL_RESOURCE_ATTRIBUTES` | `service.namespace=synthwerk,deployment.environment.name=<env>` |
| `OTEL_TRACES_SAMPLER` / `OTEL_TRACES_SAMPLER_ARG` | `parentbased_traceidratio`; `1.0` up to `stg`, `0.2` in `prd` |

- Read service settings with pydantic-settings and `env_prefix="SYNTHWERK_<SERVICE>_"`.
- List every variable in `.env.example` and in the README configuration table.
- Secrets use `SecretStr`. They never appear in logs or in `/readyz`.

## 4. OpenTelemetry

| Signal | How | Notes |
|---|---|---|
| Traces | `opentelemetry-instrumentation-fastapi` | Exclude `/healthz` and `/readyz` (`OTEL_PYTHON_FASTAPI_EXCLUDED_URLS`). W3C `traceparent` propagation. |
| Metrics | HTTP server RED metrics from the instrumentation | `http.server.request.duration`. Add service metrics with the prefix `<service>.` (for example `vision.classifications`). |
| Logs | OTel `LoggingHandler` with the OTLP log exporter | Same records as stdout. stdout JSON stays as the fallback. |

- `platform/otel.py` sets up the providers once, in the app factory, before the first request.
- The resource holds `service.name`, `service.version`, `service.namespace`, `deployment.environment.name` and `service.instance.id`.
- Shut down the providers in the lifespan exit. This flushes the last spans and logs.
- When `OTEL_EXPORTER_OTLP_ENDPOINT` is not set, the service installs no exporter and writes one `WARN` line. Tests and plain local runs need no collector.
- Exporters speak only OTLP (D-12, D-36). The service does not know the backend (otel-lgtm now, SigNoz from M3).

## 5. JSON logs

- Format: one JSON object per line on stdout. structlog formats, stdlib `logging` is the transport, so uvicorn and library loggers use the same handler.
- Required fields: `timestamp` (RFC 3339 UTC, ms), `level`, `msg`, `event.name` (INFO and above), `service.name`, `service.version`, `deployment.environment.name`.
- Fields when present: `trace_id`, `span_id` (from the active span), `synthwerk.request_id` (HTTP), `synthwerk.tenant.id`, `user.id` (pseudonym only).
- HTTP request line: `http.request.method`, `http.route` (the route template, never the raw path), `http.response.status_code`, `synthwerk.duration_ms`.
- `msg` is constant text. Values go into fields.
- Forbidden keys: `password`, `token`, `access_token`, `refresh_token`, `id_token`, `authorization`, `cookie`, `set-cookie`, `secret`, `api_key`, `prompt`, `messages`, `content`, `email`, `image`, `body`.
- Disable `uvicorn.access`. The request middleware writes the request line.
- Do not log `/healthz` and `/readyz` requests at `INFO`.
- `X-Request-ID`: accept the caller value only when it matches `[A-Za-z0-9_.-]{1,64}`. Else make a new one. Echo it in the response.
- Full field list: `04-logging-observability-reporting.md` §2.1.

## 6. Events and the outbox

- Rule (D-07): a service that publishes facts writes the data row and the outbox row in one Postgres transaction. A relay publishes the CloudEvents 1.0.2 event to NATS JetStream with `Nats-Msg-Id` = the event `id`.
- **Python services skip the outbox for now.** Reasons:
  - The only Python service, `synthwerk-vision`, publishes no events in M1 and has no Postgres.
  - The planned Python kit in `synthwerk-contracts` has `authn`, `cloudevents`, `health` and `log`. It has no outbox.
  - Vision gets Postgres, events and the outbox in epic E5.
- When a Python service publishes its first event:
  - Add the outbox to the Python kit first, with the same table and relay behaviour as the Go kit ([synthwerk#25](https://github.com/VelimirMueller/synthwerk/issues/25)).
  - Add the same two integration tests: a rolled-back transaction publishes no event; after a restart the event is published once.
  - Update this section.
- A service must never publish an event directly from a request handler.

## 7. Tests

| Level | Test name (`method - condition - outcome`) |
|---|---|
| component | `healthz - process runs - 200 ok` |
| component | `readyz - startup not complete - 503 down` |
| component | `readyz - optional dependency down - 200 degraded` |
| contract | `readyz - any state - body matches health schema` |
| unit | `log line - request completed - required fields, no forbidden keys` |
| unit | `otel setup - endpoint not set - no exporter, one warning` |
| unit | `settings - variable without service prefix - ignored` |

## 8. Checklist for a new Python service

- [ ] `/healthz` and `/readyz` exist with the shape in §2. `/health` does not exist.
- [ ] `/readyz` returns 503 until startup is complete.
- [ ] The image `HEALTHCHECK` calls `/healthz`. The deploy smoke test calls `/readyz`.
- [ ] Settings use `SYNTHWERK_<SERVICE>_*`. Every variable is in `.env.example`.
- [ ] OTel traces, metrics and logs go to `OTEL_EXPORTER_OTLP_ENDPOINT`. No endpoint means no exporter.
- [ ] Logs are JSON on stdout with the required fields and no forbidden keys.
- [ ] The tests in §7 exist and pass.
- [ ] The CI calls `py-ci.yml@v1`. The image workflow calls `image.yml@v1`.
- [ ] No outbox until the service publishes events (§6).

## 9. Known gaps

| Service | Gap list |
|---|---|
| `synthwerk-vision` | [synthwerk-vision#23](https://github.com/VelimirMueller/synthwerk-vision/issues/23): readiness, OTel, JSON logs. Outbox out of scope (§6). |
