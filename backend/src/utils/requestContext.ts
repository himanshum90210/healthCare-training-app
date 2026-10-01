import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
  requestId: string;
  ip: string | null;
  userAgent: string | null;
}

const storage = new AsyncLocalStorage<RequestContext>();

export const runWithRequestContext = <T>(context: RequestContext, fn: () => T): T => storage.run(context, fn);
export const getRequestContext = (): RequestContext | undefined => storage.getStore();