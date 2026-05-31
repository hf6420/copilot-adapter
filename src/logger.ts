import vscode from 'vscode';

const _ch = vscode.window.createOutputChannel('Copilot Adapter', { log: true });

function format(args: unknown[]): string {
  return args
    .map((a) => {
      if (typeof a === 'string') return a;
      if (a instanceof Error) return a.stack ?? a.message;
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    })
    .join(' ');
}

export const channel = {
  info: (...args: unknown[]) => _ch.info(format(args)),
  warn: (...args: unknown[]) => _ch.warn(format(args)),
  error: (...args: unknown[]) => _ch.error(format(args)),
  debug: (...args: unknown[]) => _ch.debug(format(args)),
  show: () => _ch.show(),
};
