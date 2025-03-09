import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Maven Language Mode is now active');

    const completionProvider = vscode.languages.registerCompletionItemProvider('maven', {
        provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
            const completionItems: vscode.CompletionItem[] = [];

            const mavenElements = [
                'project', 'dependencyManagement', 'dependencies', 'dependency', 'groupId', 'artifactId',
                'version', 'description', 'packaging', 'scope', 'parent', 'properties',
                'build', 'pluginManagement', 'plugins', 'plugin', 'executions', 'execution',
                'goals', 'goal', 'configuration', 'phase', 'modules', 'module',
                'profiles', 'profile', 'licenses', 'license', 'developers', 'developer',
                'scm', 'url'
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

interface XmlNode {
    type: 'element' | 'text' | 'declaration' | 'comment';
    name?: string;
    attributes?: Map<string, string>;
    children: XmlNode[];
    content?: string;
    rawTagContent?: string;
}

function parseXml(xml: string): XmlNode {
    const root: XmlNode = { type: 'element', children: [] };
    const stack: XmlNode[] = [root];
    let current = '';
    let inTag = false;
    let inDeclaration = false;
    let inComment = false;
    let tagStart = 0;

    for (let i = 0; i < xml.length; i++) {
        const char = xml[i];

        // Comment block
        if (char === '<' && xml.substring(i, i + 4) === '<!--') {
            inComment = true;
            current = '';
            i += 3;
            continue;
        }

        if (inComment && char === '-' && xml.substring(i, i + 3) === '-->') {
            stack[stack.length - 1].children.push({
                type: 'comment',
                content: current,
                children: []
            });
            inComment = false;
            current = '';
            i += 2;
            continue;
        }

        if (inComment) {
            current += char;
            continue;
        }

        // Tag
        if (char === '<') {
            // Start XML Declaration
            if (xml.substring(i, i + 2) === '<?') {
                inDeclaration = true;
                inTag = true;
                tagStart = i;
                i++;
                continue;
            }
            // End tag
            if (xml.substring(i, i + 2) === '</') {
                if (current) {
                    stack[stack.length - 1].children.push({
                        type: 'text',
                        content: current,
                        children: []
                    });
                }
                current = '';
                stack.pop();
                while (i < xml.length && xml[i] !== '>') i++;
                continue;
            }
            // Start tag
            inTag = true;
            tagStart = i;
            if (current) {
                stack[stack.length - 1].children.push({
                    type: 'text',
                    content: current,
                    children: []
                });
            }
            current = '';
            continue;
        }

        if (char === '>') {
            // End XML Declaration
            if (inDeclaration && xml[i - 1] === '?') {
                const rawContent = xml.substring(tagStart, i + 1);
                const decl: XmlNode = {
                    type: 'declaration',
                    name: 'xml',
                    attributes: parseAttributes(current),
                    children: [],
                    rawTagContent: rawContent
                };
                stack[stack.length - 1].children.push(decl);
                inDeclaration = false;
                inTag = false;
                current = '';
                continue;
            }

            if (inTag) {
                const rawContent = xml.substring(tagStart, i + 1);
                // Empty element
                if (xml[i - 1] === '/') {
                    const node: XmlNode = {
                        type: 'element',
                        name: current.split(' ')[0],
                        attributes: parseAttributes(current),
                        children: [],
                        rawTagContent: rawContent
                    };
                    stack[stack.length - 1].children.push(node);
                } else {
                    // Element
                    const node: XmlNode = {
                        type: 'element',
                        name: current.split(' ')[0],
                        attributes: parseAttributes(current),
                        children: [],
                        rawTagContent: rawContent
                    };
                    stack[stack.length - 1].children.push(node);
                    stack.push(node);
                }
                inTag = false;
                current = '';
                continue;
            }
        }

        current += char;
    }

    return root;
}

function parseAttributes(tagContent: string): Map<string, string> {
    const attrs = new Map<string, string>();
    const parts = tagContent.trim().split(/\s+/);
    if (parts.length <= 1) return attrs;

    let currentAttr = '';
    let currentValue = '';
    let inValue = false;
    let quote = '';

    for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        if (!inValue) {
            const eqIndex = part.indexOf('=');
            if (eqIndex === -1) {
                currentAttr = part;
                continue;
            }
            currentAttr = part.substring(0, eqIndex);
            const valueStart = part.substring(eqIndex + 1);
            if (valueStart.startsWith('"') || valueStart.startsWith("'")) {
                quote = valueStart[0];
                currentValue = valueStart.substring(1);
                if (valueStart.endsWith(quote)) {
                    attrs.set(currentAttr, currentValue.substring(0, currentValue.length - 1));
                    currentAttr = '';
                    currentValue = '';
                    quote = '';
                } else {
                    inValue = true;
                }
            }
        } else {
            if (part.endsWith(quote)) {
                currentValue += ' ' + part.substring(0, part.length - 1);
                attrs.set(currentAttr, currentValue);
                currentAttr = '';
                currentValue = '';
                inValue = false;
                quote = '';
            } else {
                currentValue += ' ' + part;
            }
        }
    }

    return attrs;
}

function formatXml(xml: string): string {
    const root = parseXml(xml);
    return formatNode(root, 0).trim() + '\n';
}

function formatNode(node: XmlNode, depth: number): string {
    const indent = '  '.repeat(depth);  // 2 spaces
    let result = '';

    for (const child of node.children) {
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
                result += '>';
            }

            if (child.children.length === 0) {
                result = result.slice(0, -1) + '/>\n';
            } else if (child.children.length === 1 && child.children[0].type === 'text') {
                result += child.children[0].content + '</' + child.name + '>\n';
            } else {
                result += '\n';
                result += formatNode(child, depth + 1);
                result += indent + '</' + child.name + '>\n';
            }
        } else if (child.type === 'text') {
            if (child.content && child.content.trim()) {
                result += indent + child.content.trim() + '\n';
            }
        }
    }

    return result;
}

export function deactivate() { } 