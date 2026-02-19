# Product Steering

## Purpose
This project is a realtime voice AI demo that shows how to build bidirectional streaming interactions with Google ADK over WebSocket.

## Core Value
The app demonstrates a single, practical loop for multimodal conversation:
- user sends text, microphone audio, or camera image
- ADK streams model events back in realtime
- UI renders partial/final outputs and operational telemetry

## Core Capabilities
- Realtime bidirectional session via `/ws/{user_id}/{session_id}`
- Multimodal upstream input: text, PCM audio chunks, JPEG image payloads
- Streaming downstream handling: text, audio, transcriptions, event lifecycle (`turnComplete`, `interrupted`)
- Interactive event console for protocol visibility and debugging

## Product Boundaries
- This repository is a demo/reference implementation, not a production-hardened platform.
- Session persistence is in-memory by default; behavior is optimized for clarity and workshop learning.

## Experience Principles
- Keep the conversation flow immediate and interruption-friendly.
- Surface transport/model state clearly (connection, event stream, reconnection).
- Prefer understandable streaming behavior over feature breadth.
