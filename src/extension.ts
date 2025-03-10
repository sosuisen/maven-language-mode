import * as vscode from 'vscode';
import { parseXml, XmlNode } from './parser';

export function activate(context: vscode.ExtensionContext) {
    console.log('Maven Language Mode is now active');

    const completionProvider = vscode.languages.registerCompletionItemProvider('maven', {
        provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
            const completionItems: vscode.CompletionItem[] = [];

            const mavenElements = [
                'project', 'modelVersion', 'properties',
                'extensions', 'dependencyManagement', 'dependencies', 'pluginManagement', 'plugins', 'profiles', 'modules', 'repositories', 'pluginRepositories', 'resources', 'testResources', 'licenses', 'developers', 'contributors', 'notifiers', 'mailingLists',
                'property', 'extension', 'dependency', 'plugin', 'profile', 'module', 'repository', 'pluginRepository', 'resource', 'testResource', 'license', 'developer', 'contributor', 'notifier', 'mailingList',
                'executions', 'execution', 'goals', 'goal', 'phase',
                'groupId', 'artifactId', 'version',
                'packaging', 'parent',
                'build', 'reporting',
                'name', 'description', 'url', 'inceptionYear', 'licenses', 'organization', 'developers', 'contributors',
                'issueManagement', 'ciManagement', 'scm', 'prerequisites', 'distributionManagement',
                'configuration', 'activation',
            ];

            mavenElements.forEach(element => {
                const item = new vscode.CompletionItem(element);
                item.kind = vscode.CompletionItemKind.Property;
                // last > is not needed because < and > is in "autoClosingPairs"
                item.insertText = new vscode.SnippetString(`${element}>\${1:}\</${element}`);
                completionItems.push(item);
            });

            return completionItems;
        }
    }, '<');

    const formatProvider = vscode.languages.registerDocumentFormattingEditProvider('maven', {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            const text = document.getText();
            const formatted = formatXml(text);
            const range = new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            );
            return [vscode.TextEdit.replace(range, formatted)];
        }
    });

    context.subscriptions.push(completionProvider, formatProvider);
}

function formatNode(node: XmlNode, depth: number, parentName?: string): string {
    const indent = '  '.repeat(depth);  // 2 spaces
    let result = '';

    const groupTags = ['dependencies', 'properties', 'build', 'plugins',
        'extensions', 'profiles', 'modules', 'pluginManagement', 'dependencyManagement',
        'repositories', 'pluginRepositories', 'resources', 'testResources',
        'licenses', 'developers', 'contributors', 'notifiers', 'mailingLists'];

    function isLastElementChild(index: number): boolean {
        for (let i = index + 1; i < node.children.length; i++) {
            if (node.children[i].type === 'element') {
                return false;
            }
        }
        return true;
    }

    function shouldAddNewline(tagName: string, isLast: boolean, parentTagName?: string): boolean {
        if (tagName === 'properties') {
            return parentTagName === 'project';
        }
        return groupTags.includes(tagName) && !isLast;
    }

    for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        const isLastElement = isLastElementChild(i);

        if (child.type === 'declaration') {
            result += child.rawTagContent + '\n';
        } else if (child.type === 'comment') {
            if (child.content) {
                result += indent + '<!--' + child.content + '-->\n';
            } else {
                result += indent + '<!--  -->\n';
            }
        } else if (child.type === 'element') {
            if (child.rawTagContent && child.rawTagContent.includes('\n')) {
                const openTag = child.rawTagContent.substring(0, child.rawTagContent.length - 1);
                result += indent + openTag.split('\n').join('\n' + indent) + '>';
            } else {
                result += indent + '<' + child.name;
                if (child.attributes) {
                    child.attributes.forEach((value, key) => {
                        result += ` ${key}="${value}"`;
                    });
                }
                if (child.children.length === 0) {
                    result += '/>';
                } else {
                    result += '>';
                }
            }

            if (child.children.length === 0) {
                result += '\n';
            } else if (child.children.length === 1 && child.children[0].type === 'text') {
                result += child.children[0].content + '</' + child.name + '>\n';
            } else {
                result += '\n';
                result += formatNode(child, depth + 1, child.name);
                result += indent + '</' + child.name + '>\n';
                if (shouldAddNewline(child.name || '', isLastElement, parentName)) {
                    result += '\n';
                }
            }
        } else if (child.type === 'text') {
            if (child.content && child.content.trim()) {
                result += indent + child.content.trim() + '\n';
            }
        }
    }

    return result;
}

function formatXml(xml: string): string {
    const root = parseXml(xml);
    return formatNode(root, 0).trim() + '\n';
}

export function deactivate() { } 