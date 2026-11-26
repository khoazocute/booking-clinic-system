import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { getWebSocketUrl } from "../services/apiClient";

/**
 * Subscribes to support events ({ type, ticketId, status, message }) pushed to this user.
 * Pass enabled=false to stay disconnected. Callers also poll, so a dropped socket only delays updates.
 */
export function useSupportSocket(onEvent, enabled = true) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!enabled || !token) return undefined;

    const client = new Client({
      brokerURL: getWebSocketUrl(),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe("/user/queue/support", (frame) => {
          try {
            handlerRef.current?.(JSON.parse(frame.body));
          } catch {
            // ignore malformed events
          }
        });
      },
    });
    client.activate();
    return () => {
      client.deactivate();
    };
  }, [enabled]);
}
