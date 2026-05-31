import vscode from 'vscode';
import { ALL_PROVIDERS } from '../providers';
import { Adapter } from '../bridge/adapter';

export async function mountProviders(context: vscode.ExtensionContext): Promise<Adapter[]> {
  const adapters: Adapter[] = [];
  const notifyAll = () => adapters.forEach((a) => a.notifyChange());

  for (const provider of ALL_PROVIDERS) {
    const adapter = new Adapter(context, provider.id, notifyAll);
    const vendor = `copilot-adapter-${provider.id}`;
    const registration = vscode.lm.registerLanguageModelChatProvider(vendor, adapter);
    context.subscriptions.push(registration);
    adapters.push(adapter);
  }

  await Promise.all(adapters.map((a) => a.refreshVisionProxy()));

  adapters.forEach((a) => a.notifyChange());

  return adapters;
}
