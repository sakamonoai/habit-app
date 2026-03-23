export async function register() {
  // サーバーサイドでのSupabase Realtime WebSocketエラーを防止
  // Vercelサーバーレス環境ではWebSocket接続が制限されており、
  // "The operation is insecure" エラーが発生するため、
  // WebSocketコンストラクタをラップして安全にフォールバックさせる
  if (typeof globalThis !== 'undefined' && typeof globalThis.WebSocket !== 'undefined') {
    const OriginalWebSocket = globalThis.WebSocket
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.WebSocket = function SafeWebSocket(this: any, ...args: any[]) {
      try {
        return new OriginalWebSocket(args[0] as string | URL, args[1] as string | string[] | undefined)
      } catch {
        // Supabase Realtimeのconnect()がWebSocketを作成しようとした時の
        // "The operation is insecure" エラーを握りつぶす
        return {
          close: () => {},
          send: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          readyState: 3, // CLOSED
          onopen: null,
          onclose: null,
          onerror: null,
          onmessage: null,
        }
      }
    } as unknown as typeof WebSocket
    // 元のWebSocketのプロパティをコピー
    Object.setPrototypeOf(globalThis.WebSocket, OriginalWebSocket)
    Object.defineProperty(globalThis.WebSocket, 'CONNECTING', { value: 0 })
    Object.defineProperty(globalThis.WebSocket, 'OPEN', { value: 1 })
    Object.defineProperty(globalThis.WebSocket, 'CLOSING', { value: 2 })
    Object.defineProperty(globalThis.WebSocket, 'CLOSED', { value: 3 })
  }
}
