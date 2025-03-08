import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Maven Language Mode is now active');

    // Maven XML要素の補完プロバイダーを登録
    const provider = vscode.languages.registerCompletionItemProvider('maven', {
        provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
            const completionItems: vscode.CompletionItem[] = [];

            // 主要なMaven要素の補完
            const mavenElements = [
                'project', 'dependencies', 'dependency', 'groupId', 'artifactId',
                'version', 'packaging', 'scope', 'parent', 'properties',
                'build', 'plugins', 'plugin', 'executions', 'execution',
                'goals', 'goal', 'configuration', 'phase', 'modules', 'module'
            ];

            mavenElements.forEach(element => {
                const item = new vscode.CompletionItem(element);
                item.kind = vscode.CompletionItemKind.Property;
                item.insertText = new vscode.SnippetString(`${element}>\${1:}\</${element}>`);
                completionItems.push(item);
            });

            return completionItems;
        }
    }, '<');

    context.subscriptions.push(provider);
}

export function deactivate() { } 