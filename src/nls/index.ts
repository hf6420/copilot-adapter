import vscode from 'vscode';
import { zh } from './zh';
import { en } from './en';

export function t(key: string, ...args: unknown[]): string {
  const dict = vscode.env.language === 'zh-cn' ? zh : en;
  const raw = dict[key] ?? key;
  if (args.length === 0) return raw;

  return raw.replace(/\{(\d+)\}/g, (_, i) => String(args[Number(i)] ?? ''));
}
