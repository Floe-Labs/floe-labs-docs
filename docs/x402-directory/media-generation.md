---
icon: image
---

# Media Generation

Image, video, audio, and music generation. All payable with Floe credit on Base.

| API | Provider | Price | Method | Status |
|-----|----------|-------|--------|--------|
| Freepik | Freepik | $0.02 | POST | Verified |
| Genbase | Genbase | $0.10 | POST | Verified |
| Imference | Imference | $0.05 | POST | Verified |
| Kodo | Kodo | $0.05 | POST | Verified |
| Soundside | Soundside | $0.02 | POST | Verified |
| Spraay | Spraay | $0.03 | POST | Verified |

---

## Freepik

**Provider:** [Freepik](https://www.freepik.com)
**Endpoint:** `POST https://api.freepik.com/v1/x402/generate`
**Price:** $0.02 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> Design assets and AI image generation.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.freepik.com/v1/x402/generate", "method": "POST"}'
```

## Genbase

**Provider:** [Genbase](https://genbase.ai)
**Endpoint:** `POST https://api.genbase.ai/v1/video`
**Price:** $0.10 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> AI video generation platform.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.genbase.ai/v1/video", "method": "POST"}'
```

## Imference

**Provider:** [Imference](https://imference.com)
**Endpoint:** `POST https://api.imference.com/v1/generate`
**Price:** $0.05 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> High-performance image generation REST API.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.imference.com/v1/generate", "method": "POST"}'
```

## Kodo

**Provider:** [Kodo](https://kodo.ai)
**Endpoint:** `POST https://api.kodo.ai/v1/create`
**Price:** $0.05 USDC per call · Base mainnet · x402 v2
**Floe compatible:** Yes

> AI creative tools for images, video, and audio.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.kodo.ai/v1/create", "method": "POST"}'
```

## Soundside

**Provider:** [Soundside](https://soundside.ai)
**Endpoint:** `POST https://api.soundside.ai/v1/generate`
**Price:** $0.02 USDC per call (dynamic) · Base mainnet · x402 v2
**Floe compatible:** Yes

> 22 image/video/audio/music tools and providers on Base.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.soundside.ai/v1/generate", "method": "POST"}'
```

## Spraay

**Provider:** [Spraay](https://spraay.ai)
**Endpoint:** `POST https://gateway.spraay.app/api/v1/compute/text-to-speech`
**Price:** $0.03 USDC per call (tiered) · Base mainnet · x402 v2
**Floe compatible:** Yes

> AI inference including Replicate-backed image/video/audio, plus voice at gateway.spraay.app — text-to-speech (XTTS-v2, $0.03) and speech-to-text (Whisper, $0.02). Also settles on Solana.

```bash
# Call through Floe
curl -X POST https://credit-api.floelabs.xyz/v1/proxy/fetch \
  -H "Authorization: Bearer $FLOE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://gateway.spraay.app/api/v1/compute/text-to-speech", "method": "POST"}'
```

