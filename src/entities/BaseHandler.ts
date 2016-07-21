export interface BaseHandler {
  getHandlerName(): string,
  validateTask(parameters: any): string | null
}
