import apiConfig from "@/config/api.config"
import { store } from "../../../store"
import type { CreateMessagePayload, Message } from "../../../types/message.types"
import { receiveMessage } from "../slices/chatSlice"

export class ChatWebSocketService {
  private socket: WebSocket | null = null
  private connected = false

  connect(listingId: string, receiverId: string, token: string) {
    // Prevent duplicate connections
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return
    }

    // If using mock API, don't create a real WebSocket
    if (apiConfig.useMockApi) {
      console.log("Using mock WebSocket - no real connection will be made")
      this.connected = true
      return
    }

    try {
      const url = new URL(apiConfig.apiBaseUrl)
      url.protocol = url.protocol.replace("https", "wss").replace("http", "ws")
      url.pathname = `/v1/listings/${listingId}/chat/${receiverId}`
      url.searchParams.set("token", token)

      console.log("Connecting to WebSocket:", url.toString())

      this.socket = new WebSocket(url)

      this.socket.onopen = () => {
        this.connected = true
        console.log("Chat WS open")
      }

      this.socket.onmessage = (e) => {
        const raw: Partial<Message> = JSON.parse(e.data)
        const msg: Message = {
          id: raw.id ?? crypto.randomUUID(),
          content: raw.content || "",
          listing_id: raw.listing_id || "",
          sender_id: raw.sender_id || "",
          receiver_id: raw.receiver_id || "",
          is_read: raw.is_read ?? false,
          sent_at: raw.sent_at ?? new Date().toISOString(),
          updated_at: raw.updated_at ?? raw.sent_at ?? new Date().toISOString(),
        }
        store.dispatch(receiveMessage(msg))
      }

      this.socket.onerror = (err) => {
        // Only log if already connected (ignore connect-time errors)
        if (this.connected) {
          console.error("Chat WS error", err)
        }
      }

      this.socket.onclose = (e) => {
        console.warn("Chat WS closed", e.reason)
        this.connected = false
      }
    } catch (error) {
      console.error("Error creating WebSocket:", error)
    }
  }

  send(msg: CreateMessagePayload) {
    // If using mock API, simulate message receipt
    if (apiConfig.useMockApi) {
      setTimeout(() => {
        const mockMessage: Message = {
          id: crypto.randomUUID(),
          content: msg.content,
          listing_id: msg.listing_id,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          is_read: false,
          sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        store.dispatch(receiveMessage(mockMessage))
      }, apiConfig.mockApiDelay)
      return
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(msg))
    } else {
      console.warn("Chat WS not open; cannot send message")
    }
  }

  disconnect() {
    if (this.socket) {
      try {
        if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
          this.socket.close()
        }
      } catch {
        // swallow close errors
      }
      this.socket = null
      this.connected = false
    }
  }
}

export const chatWebSocketService = new ChatWebSocketService()
