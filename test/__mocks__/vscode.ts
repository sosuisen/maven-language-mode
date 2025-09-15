// Mock VS Code API for testing

export const languages = {
    registerCompletionItemProvider: jest.fn(),
    registerDocumentFormattingEditProvider: jest.fn()
};

export const TextEdit = {
    replace: jest.fn()
};

export const Range = jest.fn();

export const CompletionItem = jest.fn();

export const CompletionItemKind = {
    Property: 'property'
};

export const SnippetString = jest.fn();