from typing import Dict, List
from fastapi import WebSocket
import json

class ConnectionManager:
    def __init__(self):
        # conversation_id -> list of WebSockets
        self.active_conversations: Dict[int, List[WebSocket]] = {}
        # user_id -> list of WebSockets (for user-level global unread notifications)
        self.user_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, conversation_id: int, user_id: int):
        await websocket.accept()
        
        # Register conversation connection
        if conversation_id not in self.active_conversations:
            self.active_conversations[conversation_id] = []
        self.active_conversations[conversation_id].append(websocket)
        
        # Register user connection
        if user_id not in self.user_connections:
            self.user_connections[user_id] = []
        self.user_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, conversation_id: int, user_id: int):
        if conversation_id in self.active_conversations:
            if websocket in self.active_conversations[conversation_id]:
                self.active_conversations[conversation_id].remove(websocket)
            if not self.active_conversations[conversation_id]:
                del self.active_conversations[conversation_id]

        if user_id in self.user_connections:
            if websocket in self.user_connections[user_id]:
                self.user_connections[user_id].remove(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

    async def broadcast_to_conversation(self, conversation_id: int, message: dict):
        if conversation_id in self.active_conversations:
            dead_sockets = []
            for ws in self.active_conversations[conversation_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead_sockets.append(ws)
            for ws in dead_sockets:
                self.active_conversations[conversation_id].remove(ws)

    async def broadcast_to_user(self, user_id: int, data: dict):
        if user_id in self.user_connections:
            dead_sockets = []
            for ws in self.user_connections[user_id]:
                try:
                    await ws.send_json(data)
                except Exception:
                    dead_sockets.append(ws)
            for ws in dead_sockets:
                self.user_connections[user_id].remove(ws)

manager = ConnectionManager()
