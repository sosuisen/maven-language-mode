export interface XmlNode {
    type: 'element' | 'text' | 'declaration' | 'comment';
    name?: string;
    attributes?: Map<string, string>;
    children: XmlNode[];
    content?: string;
    rawTagContent?: string;
}

export function parseXml(xml: string): XmlNode {
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

                const declName = rawContent.substring(2, rawContent.indexOf(' ')).trim();
                const decl: XmlNode = {
                    type: 'declaration',
                    name: declName,
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
                const isSelfClosing = current.trim().endsWith('/') || xml[i - 1] === '/';
                const tagContent = isSelfClosing ? current.replace(/\s*\/$/, '') : current;
                // Empty element
                if (isSelfClosing) {
                    const node: XmlNode = {
                        type: 'element',
                        name: tagContent.split(/\s+/)[0],
                        attributes: parseAttributes(tagContent),
                        children: [],
                        rawTagContent: rawContent
                    };
                    stack[stack.length - 1].children.push(node);
                } else {
                    // Element
                    const node: XmlNode = {
                        type: 'element',
                        name: current.split(/\s+/)[0],
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

export function parseAttributes(tagContent: string): Map<string, string> {
    const attrs = new Map<string, string>();
    const parts = tagContent.split(/\s+/);
    if (parts.length <= 1) return attrs;

    let currentAttr = '';
    let currentValue = '';
    let inValue = false;
    let quote = '';
    let collectingAttrName = false;
    let waitingForValue = false;

    for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;

        if (!inValue) {
            if (waitingForValue) {
                if (part.startsWith('"') || part.startsWith("'")) {
                    if (part.endsWith(part[0])) {
                        attrs.set(currentAttr, part.slice(1, -1));
                        currentAttr = '';
                        waitingForValue = false;
                    } else {
                        quote = part[0];
                        currentValue = part.substring(1);
                        inValue = true;
                        waitingForValue = false;
                    }
                }
            } else if (collectingAttrName) {
                if (part.includes('=')) {
                    const [attrNameEnd, ...valueParts] = part.split('=');
                    currentAttr = (currentAttr + ' ' + attrNameEnd).trim();
                    collectingAttrName = false;
                    const valueStart = valueParts.join('=');

                    if (!valueStart) {
                        waitingForValue = true;
                    } else if ((valueStart.startsWith('"') || valueStart.startsWith("'")) &&
                        (valueStart.endsWith('"') || valueStart.endsWith("'"))) {
                        attrs.set(currentAttr, valueStart.slice(1, -1));
                        currentAttr = '';
                    } else if (valueStart.startsWith('"') || valueStart.startsWith("'")) {
                        quote = valueStart[0];
                        currentValue = valueStart.substring(1);
                        inValue = true;
                    }
                } else {
                    currentAttr = (currentAttr + ' ' + part).trim();
                }
            } else if (part.includes('=')) {
                const [attrName, ...valueParts] = part.split('=');
                currentAttr = attrName.trim();
                const valueStart = valueParts.join('=');

                if (!valueStart) {
                    waitingForValue = true;
                } else if ((valueStart.startsWith('"') || valueStart.startsWith("'")) &&
                    (valueStart.endsWith('"') || valueStart.endsWith("'"))) {
                    attrs.set(currentAttr, valueStart.slice(1, -1));
                    currentAttr = '';
                } else if (valueStart.startsWith('"') || valueStart.startsWith("'")) {
                    quote = valueStart[0];
                    currentValue = valueStart.substring(1);
                    inValue = true;
                }
            } else {
                currentAttr = part;
                collectingAttrName = true;
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