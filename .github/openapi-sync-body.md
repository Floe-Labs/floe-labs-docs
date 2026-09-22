Automated sync of `openapi/floe-api.yaml` from floe-monorepo's `apps/api/openapi.yaml`, which is the spec actually served at `/.well-known/openapi.yaml`.

`/v1/status` is preserved rather than dropped: `@floe/status-api` serves it as a separate deployment, so the credit-api spec does not carry it and a straight copy would delete documentation for a live endpoint.

`llms-full.txt` regenerated. Draft, as every sync PR here is — a person reviews and merges.
