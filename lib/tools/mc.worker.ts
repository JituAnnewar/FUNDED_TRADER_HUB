/// <reference lib="webworker" />
import { simulateChallenge, type McInput } from "./monte-carlo";

self.onmessage = (e: MessageEvent<McInput>) => {
  const result = simulateChallenge(e.data);
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(result);
};
