import vscode from 'vscode';
import { channel } from '../logger';
import type { Adapter } from '../bridge/adapter';

const CONFIGURE_KEY_PATH = 'configure-api-key';
const SHOW_LOGS_PATH = 'show-logs';

export function registerUriHandler(
  context: vscode.ExtensionContext,
  adapter: Adapter,
): vscode.Disposable {
  const handler: vscode.UriHandler = {
    async handleUri(uri: vscode.Uri) {
      channel.debug(`URI received: ${uri.toString()}`);
      switch (uri.path.replace(/^\//, '')) {
        case CONFIGURE_KEY_PATH:
          await adapter.configureApiKey(uri.query || undefined);
          break;
        case SHOW_LOGS_PATH:
          channel.show();
          break;
        default:
          channel.warn(`Unknown URI path: ${uri.path}`);
      }
    },
  };

  return vscode.window.registerUriHandler(handler);
}
