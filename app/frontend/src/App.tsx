import { type FormEvent, useCallback, useEffect, useReducer, useRef, useState } from "react";

import {
  connectionStateMachine,
  getConnectionStateLabel,
  initialConnectionState
} from "./connection/connection-state-machine";

type LayoutMode = "desktop" | "tablet" | "mobile";
type ConversationMessage = {
  id: string;
  role: "user" | "agent" | "system";
  content: string;
  status: "partial" | "complete" | "interrupted";
};
type EventLogCategory = "notification" | "conversation";
type EventLogKind = "standard" | "audio";
type EventLogEntry = {
  id: string;
  timestamp: string;
  summary: string;
  category: EventLogCategory;
  kind: EventLogKind;
  detail: string;
};
type MockStreamEvent =
  | {
      kind: "text";
      role: "user" | "agent";
      text: string;
      partial: boolean;
    }
  | {
      kind: "audioOutput";
      chunkSize: number;
    }
  | { kind: "turnComplete" }
  | { kind: "interrupted" };

function detectLayoutMode(width: number): LayoutMode {
  if (width <= 767) {
    return "mobile";
  }
  if (width <= 1023) {
    return "tablet";
  }
  return "desktop";
}

function getInitialLayoutMode(): LayoutMode {
  if (typeof window === "undefined") {
    return "desktop";
  }
  return detectLayoutMode(window.innerWidth);
}

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function App(): JSX.Element {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(getInitialLayoutMode);
  const [connectionState, dispatchConnectionEvent] = useReducer(
    connectionStateMachine,
    initialConnectionState
  );
  const [reconnectScheduled, setReconnectScheduled] = useState(false);
  const [systemNotices, setSystemNotices] = useState<string[]>([]);
  const [textInputValue, setTextInputValue] = useState("");
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  const [audioUpstreamChunkCount, setAudioUpstreamChunkCount] = useState(0);
  const [audioDownstreamChunkCount, setAudioDownstreamChunkCount] = useState(0);
  const [audioPlaybackState, setAudioPlaybackState] = useState<"idle" | "playing" | "interrupted">("idle");
  const [imageUpstreamCount, setImageUpstreamCount] = useState(0);
  const [eventLogs, setEventLogs] = useState<EventLogEntry[]>([]);
  const [expandedEventLogIds, setExpandedEventLogIds] = useState<string[]>([]);
  const [showAudioEventLogs, setShowAudioEventLogs] = useState(true);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const previousConnectionState = useRef(initialConnectionState);
  const conversationLogRef = useRef<HTMLUListElement>(null);
  const activeAgentMessageIdRef = useRef<string | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const appendEventLog = useCallback(
    (category: EventLogCategory, summary: string, detail: unknown, kind: EventLogKind = "standard"): void => {
      const entry: EventLogEntry = {
        id: createMessageId(),
        timestamp: new Date().toISOString(),
        summary,
        category,
        kind,
        detail: JSON.stringify(detail)
      };
      setEventLogs((items) => [entry, ...items].slice(0, 100));
    },
    []
  );

  const toggleEventLogExpanded = useCallback((id: string): void => {
    setExpandedEventLogIds((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  }, []);

  useEffect(() => {
    const handleResize = (): void => {
      setLayoutMode(detectLayoutMode(window.innerWidth));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleMockAudioChunk = (): void => {
      if (!isVoiceInputActive) {
        return;
      }
      setAudioUpstreamChunkCount((count) => count + 1);
    };

    window.addEventListener("mock-audio-chunk", handleMockAudioChunk);
    return () => window.removeEventListener("mock-audio-chunk", handleMockAudioChunk);
  }, [isVoiceInputActive]);

  useEffect(() => {
    return () => {
      const stream = cameraStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (connectionState !== "connecting" && connectionState !== "reconnecting") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dispatchConnectionEvent({ type: "CONNECTED" });
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [connectionState]);

  useEffect(() => {
    const prev = previousConnectionState.current;
    if (prev !== connectionState) {
      if (prev === "connecting" && connectionState === "connected") {
        setSystemNotices((items) => [...items, "接続開始"]);
        appendEventLog("notification", "接続済み", { phase: "initial" });
      }
      if (prev === "reconnecting" && connectionState === "connected") {
        setSystemNotices((items) => [...items, "再接続に成功"]);
        appendEventLog("notification", "再接続に成功", { phase: "recover" });
      }
      previousConnectionState.current = connectionState;
    }
  }, [appendEventLog, connectionState]);

  useEffect(() => {
    if (!reconnectScheduled) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      dispatchConnectionEvent({ type: "RECONNECT_REQUESTED" });
      setSystemNotices((items) => [...items, "再接続を試行中"]);
      appendEventLog("notification", "再接続試行", { scheduled: true });
      setReconnectScheduled(false);
    }, 1000);
    return () => window.clearTimeout(timeoutId);
  }, [appendEventLog, reconnectScheduled]);

  useEffect(() => {
    const conversationLog = conversationLogRef.current;
    if (!conversationLog) {
      return;
    }
    conversationLog.scrollTop = conversationLog.scrollHeight;
  }, [conversationMessages]);

  useEffect(() => {
    const handleMockStreamEvent = (event: Event): void => {
      const customEvent = event as CustomEvent<MockStreamEvent>;
      const streamEvent = customEvent.detail;

      if (!streamEvent) {
        return;
      }

      if (streamEvent.kind === "text") {
        const nextText = streamEvent.text.trim();
        if (!nextText) {
          return;
        }

        if (streamEvent.role === "agent" && activeAgentMessageIdRef.current && streamEvent.partial) {
          const activeId = activeAgentMessageIdRef.current;
          setConversationMessages((items) =>
            items.map((item) =>
              item.id === activeId
                ? {
                    ...item,
                    content: `${item.content}${nextText}`,
                    status: "partial"
                  }
                : item
            )
          );
          appendEventLog("conversation", "エージェント応答更新", { partial: true });
          return;
        }

        const newMessageId = createMessageId();
        setConversationMessages((items) => [
          ...items,
          {
            id: newMessageId,
            role: streamEvent.role,
            content: nextText,
            status: streamEvent.partial ? "partial" : "complete"
          }
        ]);

        if (streamEvent.role === "agent") {
          activeAgentMessageIdRef.current = streamEvent.partial ? newMessageId : null;
        }
        appendEventLog("conversation", "会話イベント受信", {
          role: streamEvent.role,
          partial: streamEvent.partial
        });
        return;
      }

      if (streamEvent.kind === "audioOutput") {
        setAudioDownstreamChunkCount((count) => count + 1);
        setAudioPlaybackState("playing");
        appendEventLog("conversation", "音声出力受信", { chunkSize: streamEvent.chunkSize }, "audio");
        return;
      }

      if (streamEvent.kind === "turnComplete") {
        const activeId = activeAgentMessageIdRef.current;
        if (!activeId) {
          return;
        }
        setConversationMessages((items) =>
          items.map((item) => (item.id === activeId ? { ...item, status: "complete" } : item))
        );
        activeAgentMessageIdRef.current = null;
        appendEventLog("conversation", "ターン完了", { kind: "turnComplete" });
        return;
      }

      if (streamEvent.kind === "interrupted") {
        const activeId = activeAgentMessageIdRef.current;
        if (activeId) {
          setConversationMessages((items) =>
            items.map((item) => (item.id === activeId ? { ...item, status: "interrupted" } : item))
          );
          activeAgentMessageIdRef.current = null;
        }
        setAudioPlaybackState((prev) => (prev === "playing" ? "interrupted" : prev));
        appendEventLog("notification", "中断イベント", { kind: "interrupted" });
      }
    };

    window.addEventListener("mock-stream-event", handleMockStreamEvent as EventListener);
    return () => window.removeEventListener("mock-stream-event", handleMockStreamEvent as EventListener);
  }, [appendEventLog]);

  const handleConnectStart = (): void => {
    dispatchConnectionEvent({ type: "CONNECT_REQUESTED" });
    appendEventLog("notification", "接続開始要求", { source: "ui" });
  };

  const handleDisconnect = (): void => {
    dispatchConnectionEvent({ type: "DISCONNECTED" });
    setReconnectScheduled(true);
    setSystemNotices((items) => [...items, "切断"]);
    appendEventLog("notification", "切断", { reconnectScheduled: true });
  };

  const handleTextSend = (): void => {
    const trimmedValue = textInputValue.trim();
    if (!trimmedValue) {
      return;
    }

    setConversationMessages((items) => [
      ...items,
      {
        id: createMessageId(),
        role: "user",
        content: trimmedValue,
        status: "complete"
      }
    ]);
    appendEventLog("conversation", "テキスト送信", { text: trimmedValue });
    setTextInputValue("");
  };

  const handleTextSendSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    handleTextSend();
  };

  const handleVoiceInputToggle = (): void => {
    setIsVoiceInputActive((active) => !active);
  };

  const handleCameraClose = (): void => {
    const stream = cameraStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraModalOpen(false);
    setCameraActive(false);
  };

  const handleCameraOpen = async (): Promise<void> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("カメラ未対応");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraStreamRef.current = stream;
      setIsCameraModalOpen(true);
      setCameraActive(true);
      appendEventLog("notification", "カメラプレビュー開始", { status: "opened" });
    } catch (error) {
      setIsCameraModalOpen(false);
      setCameraActive(false);
      const message = error instanceof Error ? error.message : "unknown";
      setSystemNotices((items) => [...items, `カメラ利用に失敗: ${message}`]);
      appendEventLog("notification", "カメラ利用失敗", { message });
    }
  };

  const handleCameraSend = (): void => {
    setConversationMessages((items) => [
      ...items,
      {
        id: createMessageId(),
        role: "user",
        content: "[画像を送信しました]",
        status: "complete"
      }
    ]);
    setImageUpstreamCount((count) => count + 1);
    appendEventLog("conversation", "画像送信", { placeholder: true });
    handleCameraClose();
  };

  const handleAudioEventVisibilityToggle = (): void => {
    setShowAudioEventLogs((current) => !current);
  };

  const handleEventLogsClear = (): void => {
    setEventLogs([]);
    setExpandedEventLogIds([]);
  };

  const renderAudioMetrics = (): JSX.Element => (
    <>
      <p className="mt-2 text-sm text-slate-600">
        上流音声チャンク: <span data-testid="audio-upstream-chunk-count">{audioUpstreamChunkCount}</span>
      </p>
      <p className="mt-1 text-sm text-slate-600">
        下流音声チャンク: <span data-testid="audio-downstream-chunk-count">{audioDownstreamChunkCount}</span>
      </p>
      <p className="mt-1 text-sm text-slate-600">
        音声再生状態:{" "}
        <span data-testid="audio-playback-state">
          {audioPlaybackState === "idle" && "待機中"}
          {audioPlaybackState === "playing" && "再生中"}
          {audioPlaybackState === "interrupted" && "中断"}
        </span>
      </p>
      <p className="mt-1 text-sm text-slate-600">
        画像上流送信数: <span data-testid="image-upstream-count">{imageUpstreamCount}</span>
      </p>
    </>
  );

  const renderEventLogs = (): JSX.Element => {
    const visibleLogs = showAudioEventLogs ? eventLogs : eventLogs.filter((log) => log.kind !== "audio");
    return (
      <>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={showAudioEventLogs} onChange={handleAudioEventVisibilityToggle} />
            音声イベントを表示
          </label>
          <button type="button" className="rounded bg-slate-200 px-2 py-1 text-xs" onClick={handleEventLogsClear}>
            ログをクリア
          </button>
        </div>
        <ul data-testid="event-log-list" className="mt-3 space-y-2">
          {visibleLogs.map((log) => {
        const expanded = expandedEventLogIds.includes(log.id);
        const categoryLabel = log.kind === "audio" ? "audio" : log.category;
        const itemClassName =
          log.kind === "audio"
            ? "text-sky-700"
            : log.category === "notification"
              ? "text-amber-700"
              : "text-slate-700";
        return (
          <li key={log.id} data-testid="event-log-item" className="rounded border border-slate-200 bg-white p-2 text-xs">
            <p data-testid={`event-log-item-${categoryLabel}`} className={itemClassName}>
              [{categoryLabel}] {log.summary}
            </p>
            <p className="mt-1 text-slate-500">{log.timestamp}</p>
            <button
              type="button"
              className="mt-1 rounded bg-slate-200 px-2 py-1"
              onClick={() => toggleEventLogExpanded(log.id)}
            >
              {expanded ? "詳細を閉じる" : "詳細を開く"}
            </button>
            {expanded && (
              <pre data-testid="event-log-detail" className="mt-2 overflow-x-auto rounded bg-slate-100 p-2 text-[11px]">
                {log.detail}
              </pre>
            )}
          </li>
        );
          })}
        </ul>
      </>
    );
  };

  const renderConnectionSection = (className: string): JSX.Element => (
    <section aria-label="connection" role="region" className={className}>
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">接続状態</p>
        <span data-testid="connection-state" className="rounded bg-slate-100 px-2 py-1 text-sm">
          {getConnectionStateLabel(connectionState)}
        </span>
      </div>
      {connectionState === "disconnected" && reconnectScheduled && (
        <p className="mt-2 text-sm text-amber-700">再接続予定</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {(connectionState === "disconnected" || connectionState === "error") && (
          <button
            type="button"
            className="rounded bg-slate-900 px-3 py-2 text-white"
            onClick={handleConnectStart}
          >
            接続開始
          </button>
        )}
        {connectionState === "connected" && (
          <button
            type="button"
            className="rounded bg-slate-700 px-3 py-2 text-white"
            onClick={handleDisconnect}
          >
            切断
          </button>
        )}
      </div>
    </section>
  );

  const renderConversationSection = (className: string): JSX.Element => (
    <section aria-label="conversation" role="region" className={className}>
      <p className="font-medium">Conversation</p>
      <ul
        ref={conversationLogRef}
        data-testid="conversation-log"
        className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded border border-slate-100 bg-white p-3"
      >
        {conversationMessages.length === 0 && (
          <li className="text-sm text-slate-500">メッセージはまだありません</li>
        )}
        {conversationMessages.map((message) => (
          <li
            key={message.id}
            data-testid={`conversation-message-${message.role}`}
            className="rounded bg-slate-100 px-3 py-2 text-sm"
          >
            <p>{message.content}</p>
            <p className="mt-1 text-xs text-slate-500">{message.status}</p>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900" data-layout={layoutMode}>
      <header className="border-b border-slate-200 p-4">
        <h1 className="text-xl font-semibold">Realtime Voice Agent</h1>
        <p data-testid="layout-mode" className="text-sm text-slate-600">
          {layoutMode}
        </p>
      </header>

      {layoutMode === "desktop" && (
        <div className="grid grid-cols-[260px_1fr_280px] gap-4 p-4">
          {renderConnectionSection("rounded-md border border-slate-200 p-4")}
          {renderConversationSection("rounded-md border border-slate-200 p-4")}
          <section aria-label="event-console" role="region" className="rounded-md border border-slate-200 p-4">
            <p>Event console area</p>
            {renderAudioMetrics()}
            {renderEventLogs()}
          </section>
        </div>
      )}

      {layoutMode === "tablet" && (
        <div className="grid grid-cols-1 gap-4 p-4">
          {renderConnectionSection("rounded-md border border-slate-200 p-4")}
          {renderConversationSection("rounded-md border border-slate-200 p-4")}
          <section aria-label="event-console" role="region" className="rounded-md border border-slate-200 p-4">
            <p>Event console area (compact)</p>
            {renderAudioMetrics()}
            {renderEventLogs()}
          </section>
        </div>
      )}

      {layoutMode === "mobile" && (
        <div className="flex flex-col gap-3 p-3">
          {renderConnectionSection("rounded-md border border-slate-200 p-3")}
          {renderConversationSection("rounded-md border border-slate-200 p-3")}
          <section aria-label="event-console" role="region" className="rounded-md border border-slate-200 p-3">
            <p>Event console area</p>
            {renderAudioMetrics()}
            {renderEventLogs()}
          </section>
        </div>
      )}

      <section aria-label="input-controls" role="region" className="sticky bottom-0 border-t border-slate-200 bg-white p-4">
        <form className="flex flex-wrap items-center gap-2" onSubmit={handleTextSendSubmit}>
          <label htmlFor="text-input" className="sr-only">
            テキスト入力
          </label>
          <input
            id="text-input"
            type="text"
            value={textInputValue}
            onChange={(event) => setTextInputValue(event.target.value)}
            className="min-w-[200px] flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
            placeholder="メッセージを入力"
          />
          <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-white">
            送信
          </button>
          <button
            type="button"
            className="rounded bg-slate-700 px-3 py-2 text-white"
            onClick={handleVoiceInputToggle}
          >
            {isVoiceInputActive ? "音声停止" : "音声開始"}
          </button>
          <button type="button" className="rounded bg-slate-500 px-3 py-2 text-white" onClick={handleCameraOpen}>
            画像送信
          </button>
        </form>
        {isVoiceInputActive && (
          <p data-testid="voice-input-state" className="mt-2 text-sm text-emerald-700">
            音声入力中
          </p>
        )}
        <p data-testid="camera-state" className="mt-1 text-sm text-slate-600">
          {cameraActive ? "利用中" : "未使用"}
        </p>
      </section>
      {isCameraModalOpen && (
        <section
          role="dialog"
          aria-label="camera-preview"
          className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/40 p-4"
        >
          <div className="w-full max-w-md rounded-md bg-white p-4">
            <p className="font-medium">Camera Preview</p>
            <p className="mt-2 text-sm text-slate-600">プレビュー準備完了</p>
            <div className="mt-4 flex gap-2">
              <button type="button" className="rounded bg-slate-900 px-3 py-2 text-white" onClick={handleCameraSend}>
                画像を送信
              </button>
              <button type="button" className="rounded bg-slate-600 px-3 py-2 text-white" onClick={handleCameraClose}>
                キャンセル
              </button>
            </div>
          </div>
        </section>
      )}
      <section aria-label="system-notices" role="region" className="border-t border-slate-200 bg-slate-100 p-3">
        <p className="text-sm font-medium">システム通知</p>
        <ul data-testid="system-notices" className="mt-1 list-disc pl-5 text-sm text-slate-700">
          {systemNotices.map((notice, index) => (
            <li key={`${notice}-${index}`}>{notice}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
