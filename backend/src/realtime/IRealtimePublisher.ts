export interface IRealtimePublisher {
  emitToUser(userId: string, event: string, payload: unknown): void;
}