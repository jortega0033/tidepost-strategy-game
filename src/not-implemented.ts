// Shared stub: a feature that a ticket has not built yet fails with this message.
export function notImplemented(ticket: number): never {
  throw new Error(`not implemented yet: see #${ticket}`);
}
