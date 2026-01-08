# ADK Bidi-streaming Workshop Outline

**Duration:** 1.5 hours (90 minutes)
**Environment:** Google Cloud Shell Editor
**Demo Application:** bidi-demo

## Workshop Overview

This hands-on workshop teaches participants how to build real-time, bidirectional streaming AI applications using Google's Agent Development Kit (ADK). Participants will deploy and explore the bidi-demo application on Cloud Shell Editor, learning the core concepts of ADK Bidi-streaming through practical experimentation.

### Prerequisites

- Google Cloud account with billing enabled
- Basic Python knowledge
- Familiarity with async/await concepts
- Web browser with microphone access

### Learning Objectives

By the end of this workshop, participants will be able to:

1. Understand ADK's 4-phase streaming lifecycle
2. Set up and run a Bidi-streaming application on Cloud Shell
3. Implement bidirectional communication with LiveRequestQueue
4. Process streaming events from run_live()
5. Configure RunConfig for different modalities
6. Work with audio, image, and video inputs

---

## Workshop Schedule

| Time | Duration | Section |
|------|----------|---------|
| 0:00 | 10 min | Section 1: Introduction & Environment Setup |
| 0:10 | 15 min | Section 2: Architecture Overview |
| 0:25 | 20 min | Section 3: Running the Demo |
| 0:45 | 10 min | Break |
| 0:55 | 20 min | Section 4: Code Walkthrough |
| 1:15 | 10 min | Section 5: Experimentation & Customization |
| 1:25 | 5 min | Section 6: Wrap-up & Resources |

---

## Section 1: Introduction & Environment Setup (10 min)

### 1.1 Workshop Introduction (3 min)

- What is ADK Bidi-streaming?
- Real-world use cases: voice assistants, real-time translation, interactive AI agents
- Workshop goals and structure

### 1.2 Cloud Shell Editor Setup (7 min)

- Navigate to [ide.cloud.google.com](https://ide.cloud.google.com)
- Clone the repository:
  ```bash
  git clone https://github.com/google/adk-samples.git
  cd adk-samples/python/agents/bidi-demo
  ```
- Configure environment:
  ```bash
  cp app/.env.example app/.env
  # Edit .env to add GOOGLE_API_KEY
  ```
- Install dependencies:
  ```bash
  pip install -e .
  ```

---

## Section 2: Architecture Overview (15 min)

### 2.1 The 4-Phase Lifecycle (5 min)

| Phase | When | What Happens |
|-------|------|--------------|
| **Application Initialization** | Once at startup | Create Agent, SessionService, Runner |
| **Session Initialization** | Per connection | Create Session, RunConfig, LiveRequestQueue, start run_live() |
| **Bidi-streaming** | Active session | Concurrent upstream/downstream tasks |
| **Termination** | Session end | Close LiveRequestQueue, cleanup |

### 2.2 Core Components (5 min)

- **Agent**: Defines model, tools, and instructions
- **Runner**: Orchestrates agent execution
- **SessionService**: Manages conversation state
- **LiveRequestQueue**: Handles upstream messages
- **run_live()**: Async generator for downstream events
- **RunConfig**: Configures streaming behavior

### 2.3 Upstream/Downstream Pattern (5 min)

```
Client ──WebSocket──> Server ──LiveRequestQueue──> Live API
                                                      │
Client <──WebSocket── Server <────run_live()──────────┘
```

- **Upstream task**: WebSocket → LiveRequestQueue (text, audio, images)
- **Downstream task**: run_live() → WebSocket (events, audio, transcriptions)
- Both tasks run concurrently with `asyncio.gather()`

---

## Section 3: Running the Demo (20 min)

### 3.1 Start the Server (5 min)

```bash
cd app
uvicorn main:app --host 0.0.0.0 --port 8080
```

- Open Web Preview on port 8080
- Verify the UI loads correctly

### 3.2 Text Interaction (5 min)

- Send text messages to the agent
- Observe streaming responses
- Try the Google Search tool

### 3.3 Audio Interaction (5 min)

- Enable microphone access
- Speak to the agent
- Observe:
  - Input transcription (your speech → text)
  - Audio response playback
  - Output transcription (model speech → text)

### 3.4 Image/Camera Input (5 min)

- Use the camera button to capture an image
- Ask the agent about the image content
- Observe multimodal understanding

---

## Break (10 min)

---

## Section 4: Code Walkthrough (20 min)

### 4.1 Application Initialization - `main.py` (5 min)

```python
# Phase 1: Application Initialization (once at startup)
app = FastAPI()
session_service = InMemorySessionService()
runner = Runner(app_name=APP_NAME, agent=agent, session_service=session_service)
```

Key points:
- Agent defined separately in `google_search_agent/agent.py`
- Environment variables loaded before agent import
- Single Runner instance shared across connections

### 4.2 Session Initialization - WebSocket Endpoint (5 min)

```python
# Phase 2: Session Initialization (per connection)
run_config = RunConfig(
    streaming_mode=StreamingMode.BIDI,
    response_modalities=["AUDIO"],  # or ["TEXT"]
    input_audio_transcription=types.AudioTranscriptionConfig(),
    output_audio_transcription=types.AudioTranscriptionConfig(),
)

live_request_queue = LiveRequestQueue()
```

Key points:
- RunConfig determines streaming behavior
- Native audio vs half-cascade model detection
- LiveRequestQueue created per session

### 4.3 Upstream Task - Receiving Client Input (5 min)

```python
async def upstream_task():
    while True:
        message = await websocket.receive()

        if "bytes" in message:  # Audio
            audio_blob = types.Blob(mime_type="audio/pcm;rate=16000", data=audio_data)
            live_request_queue.send_realtime(audio_blob)

        elif "text" in message:  # Text or Image
            if json_message.get("type") == "text":
                live_request_queue.send_content(content)
            elif json_message.get("type") == "image":
                live_request_queue.send_realtime(image_blob)
```

Key points:
- `send_content()` for text (turn-based)
- `send_realtime()` for audio/images (streaming)
- Binary WebSocket frames for audio efficiency

### 4.4 Downstream Task - Processing Events (5 min)

```python
async def downstream_task():
    async for event in runner.run_live(
        user_id=user_id,
        session_id=session_id,
        live_request_queue=live_request_queue,
        run_config=run_config,
    ):
        event_json = event.model_dump_json(exclude_none=True, by_alias=True)
        await websocket.send_text(event_json)
```

Key points:
- `run_live()` is an async generator
- Events include: content, transcriptions, tool calls, errors
- Forward all events to client for processing

---

## Section 5: Experimentation & Customization (10 min)

### 5.1 Modify the Agent (5 min)

Edit `google_search_agent/agent.py`:

- Change the agent instruction
- Add a custom tool
- Modify the model (native audio vs half-cascade)

```python
agent = Agent(
    name="my_custom_agent",
    model=os.getenv("DEMO_AGENT_MODEL", "gemini-2.5-flash-native-audio-preview-12-2025"),
    instruction="You are a helpful travel assistant...",
    tools=[google_search, my_custom_tool],
)
```

### 5.2 Experiment with RunConfig (5 min)

Try different configurations:

```python
# Enable proactivity (native audio only)
run_config = RunConfig(
    proactivity=types.ProactivityConfig(proactive_audio=True),
    enable_affective_dialog=True,
)

# Change voice
run_config = RunConfig(
    speech_config=types.SpeechConfig(
        voice_config=types.VoiceConfig(
            prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name="Kore")
        )
    ),
)
```

---

## Section 6: Wrap-up & Resources (5 min)

### 6.1 Key Takeaways

1. ADK Bidi-streaming uses a 4-phase lifecycle
2. Upstream/downstream concurrent tasks enable real-time communication
3. LiveRequestQueue handles all input types (text, audio, images)
4. run_live() streams events for processing
5. RunConfig controls modalities and advanced features

### 6.2 Resources

| Resource | URL |
|----------|-----|
| ADK Documentation | https://google.github.io/adk-docs/ |
| ADK Bidi-streaming Guide | https://google.github.io/adk-docs/streaming/dev-guide/ |
| Gemini Live API | https://ai.google.dev/gemini-api/docs/live |
| Vertex AI Live API | https://cloud.google.com/vertex-ai/generative-ai/docs/live-api |
| ADK Samples Repository | https://github.com/google/adk-samples |

### 6.3 Next Steps

- Explore multi-agent configurations with different voices
- Implement custom streaming tools
- Build production deployments with session persistence
- Integrate with Cloud Run for scalable hosting

---

## Appendix: Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Microphone not working | Check browser permissions, ensure HTTPS |
| No audio response | Verify model supports AUDIO modality |
| API key errors | Check .env file, verify GOOGLE_API_KEY is set |
| WebSocket disconnects | Check session timeout, implement reconnection |
| Slow responses | Try TEXT modality for half-cascade models |

### Environment Variables

```bash
# Required
GOOGLE_API_KEY=your_api_key_here

# Optional
DEMO_AGENT_MODEL=gemini-2.5-flash-native-audio-preview-12-2025
```
