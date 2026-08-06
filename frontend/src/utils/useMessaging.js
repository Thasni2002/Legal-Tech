"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE_URL } from "@/utils/api";
import { getAuthHeaders, getLoggedInUser } from "@/utils/auth";

export function useMessaging() {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const wsRef = useRef(null);

  const user = getLoggedInUser();

  // Fetch all visible conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/messaging/conversations`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      // Quiet fallback during server restart or offline state
    } finally {
      setLoadingConvs(false);
    }
  }, [user]);

  // Fetch unread count globally
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE_URL}/messaging/unread-count`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unread_count || 0);
      }
    } catch (err) {
      // quiet fallback
    }
  }, [user]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return;
    setLoadingMsgs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/messaging/conversations/${convId}/messages`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => {
          if (prev.length === data.length && prev.length > 0) {
            const lastPrev = prev[prev.length - 1];
            const lastData = data[data.length - 1];
            if (
              lastPrev.id === lastData.id &&
              lastPrev.content === lastData.content &&
              lastPrev.is_edited === lastData.is_edited
            ) {
              return prev;
            }
          }
          return data;
        });
        // Refresh conversations & unread count after marking read
        fetchUnreadCount();
        setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, unread_count: 0 } : c)));
      }
    } catch (err) {
      console.warn("Messaging: Error fetching messages —", err?.message || err);
    } finally {
      setLoadingMsgs(false);
    }
  }, [fetchUnreadCount]);

  const wsDisabledRef = useRef(false);

  // WebSocket Connection Lifecycle
  useEffect(() => {
    if (!activeConvId || !user || wsDisabledRef.current) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = API_BASE_URL.replace(/^https?:\/\//, "");
    const wsUrl = `${wsProtocol}//${host}/ws/messaging/${activeConvId}?token=${encodeURIComponent(token)}`;

    let wsConnected = false;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      wsConnected = true;
      ws.send(JSON.stringify({ event: "mark_read" }));
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { event: evtType, data } = payload;

        if (evtType === "new_message") {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.id)) return prev;
            return [...prev, data];
          });
          setConversations((prev) =>
            prev.map((c) =>
              c.id === data.conversation_id
                ? {
                    ...c,
                    last_message: data.content || `[${data.message_type.toUpperCase()}]`,
                    last_message_at: data.created_at
                  }
                : c
            )
          );
          fetchUnreadCount();
        } else if (evtType === "edit_message") {
          setMessages((prev) => prev.map((m) => (m.id === data.id ? { ...m, ...data } : m)));
        } else if (evtType === "delete_message") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === data.id ? { ...m, is_deleted: true, content: "This message was deleted", file_url: null } : m
            )
          );
        } else if (evtType === "typing") {
          if (data.user_id !== user.id) {
            setTypingUsers((prev) => ({
              ...prev,
              [data.user_id]: data.is_typing ? data.username : null
            }));
            if (data.is_typing) {
              setTimeout(() => {
                setTypingUsers((prev) => ({ ...prev, [data.user_id]: null }));
              }, 3000);
            }
          }
        }
      } catch (err) {
        console.error("WS message parse error:", err);
      }
    };

    ws.onerror = () => {
      if (!wsConnected) {
        wsDisabledRef.current = true; // Stop WS attempts if server doesn't support WebSockets
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [activeConvId, user, fetchUnreadCount]);

  // Initial load & periodic unread/active message check
  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchConversations();
      fetchUnreadCount();
      if (activeConvId) {
        fetchMessages(activeConvId);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchConversations, fetchUnreadCount, fetchMessages, activeConvId]);

  // Handle active conversation change
  const selectConversation = (id) => {
    setActiveConvId(id);
    if (id) {
      fetchMessages(id);
    } else {
      setMessages([]);
    }
  };

  // Send message API with Instant Optimistic UI Update
  const sendMessage = async ({ content, message_type = "text", file_url, file_name, file_size, case_no, case_title }) => {
    if (!activeConvId) return;

    const tempId = `temp_${Date.now()}`;
    const senderName = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.username || "You";
    
    const optimisticMsg = {
      id: tempId,
      conversation_id: activeConvId,
      sender_id: user?.id,
      sender_name: senderName,
      sender_role: user?.role,
      content,
      message_type,
      file_url,
      file_name,
      file_size,
      case_no,
      case_title,
      is_edited: false,
      is_deleted: false,
      created_at: new Date().toISOString(),
      is_read: true
    };

    // 1. Immediately show message in chat bubble (0ms lag)
    setMessages((prev) => [...prev, optimisticMsg]);
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? {
              ...c,
              last_message: content || `[${message_type.toUpperCase()}]`,
              last_message_at: optimisticMsg.created_at
            }
          : c
      )
    );

    // 2. Send payload to backend
    try {
      const res = await fetch(`${API_BASE_URL}/messaging/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content, message_type, file_url, file_name, file_size, case_no, case_title })
      });
      if (res.ok) {
        const actualMsg = await res.json();
        // Replace temp ID with actual server ID
        setMessages((prev) => prev.map((m) => (m.id === tempId ? actualMsg : m)));
      } else {
        // Rollback if failed
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    } catch (err) {
      console.error("Send message error:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  // Edit message API
  const editMessage = async (messageId, newContent) => {
    try {
      const res = await fetch(`${API_BASE_URL}/messaging/messages/${messageId}`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: newContent })
      });
      if (res.ok) {
        const updated = await res.json();
        setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
      }
    } catch (err) {
      console.error("Edit message error:", err);
    }
  };

  // Delete message API
  const deleteMessage = async (messageId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/messaging/messages/${messageId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, is_deleted: true, content: "This message was deleted", file_url: null } : m
          )
        );
      }
    } catch (err) {
      console.error("Delete message error:", err);
    }
  };

  // Send typing status
  const sendTypingSignal = (isTyping = true) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event: "typing", is_typing: isTyping }));
    }
  };

  // Toggle Pin
  const togglePin = async (convId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/messaging/conversations/${convId}/pin`, {
        method: "PUT",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        fetchConversations();
      }
    } catch (err) {
      console.error("Pin toggle error:", err);
    }
  };

  // Assign Junior Advocate
  const assignJunior = async (convId, juniorId, juniorName) => {
    try {
      const res = await fetch(`${API_BASE_URL}/messaging/conversations/${convId}/assign`, {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ assigned_junior_id: juniorId, assigned_junior_name: juniorName })
      });
      if (res.ok) {
        fetchConversations();
      }
    } catch (err) {
      console.error("Assign junior error:", err);
    }
  };

  return {
    conversations,
    activeConvId,
    activeConversation: conversations.find((c) => c.id === activeConvId),
    messages,
    unreadCount,
    loadingConvs,
    loadingMsgs,
    typingUserNames: Object.values(typingUsers).filter(Boolean),
    selectConversation,
    sendMessage,
    editMessage,
    deleteMessage,
    sendTypingSignal,
    togglePin,
    assignJunior,
    refreshConversations: fetchConversations
  };
}
