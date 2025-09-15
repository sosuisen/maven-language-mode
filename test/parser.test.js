"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parser_1 = require("../src/parser");
describe('XML Parser', () => {
    describe('parseXml', () => {
        test('should parse simple XML element', () => {
            const xml = '<project><groupId>com.example</groupId></project>';
            const result = (0, parser_1.parseXml)(xml);
            expect(result.type).toBe('element');
            expect(result.children).toHaveLength(1);
            const project = result.children[0];
            expect(project.type).toBe('element');
            expect(project.name).toBe('project');
            expect(project.children).toHaveLength(1);
            const groupId = project.children[0];
            expect(groupId.type).toBe('element');
            expect(groupId.name).toBe('groupId');
            expect(groupId.children).toHaveLength(1);
            expect(groupId.children[0].type).toBe('text');
            expect(groupId.children[0].content).toBe('com.example');
        });
        test('should parse XML declaration', () => {
            const xml = '<?xml version="1.0" encoding="UTF-8"?><project></project>';
            const result = (0, parser_1.parseXml)(xml);
            expect(result.children).toHaveLength(2);
            const declaration = result.children[0];
            expect(declaration.type).toBe('declaration');
            expect(declaration.name).toBe('xml');
            expect(declaration.rawTagContent).toBe('<?xml version="1.0" encoding="UTF-8"?>');
        });
        test('should parse self-closing tags', () => {
            const xml = '<project><dependency/></project>';
            const result = (0, parser_1.parseXml)(xml);
            const project = result.children[0];
            const dependency = project.children[0];
            expect(dependency.type).toBe('element');
            expect(dependency.name).toBe('dependency');
            expect(dependency.children).toHaveLength(0);
        });
        test('should parse XML comments', () => {
            const xml = '<project><!-- This is a comment --><groupId>test</groupId></project>';
            const result = (0, parser_1.parseXml)(xml);
            const project = result.children[0];
            expect(project.children).toHaveLength(2);
            const comment = project.children[0];
            expect(comment.type).toBe('comment');
            expect(comment.content).toBe(' This is a comment ');
            const groupId = project.children[1];
            expect(groupId.type).toBe('element');
            expect(groupId.name).toBe('groupId');
        });
        test('should parse attributes', () => {
            const xml = '<project xmlns="http://maven.apache.org/POM/4.0.0" version="1.0"><groupId>test</groupId></project>';
            const result = (0, parser_1.parseXml)(xml);
            const project = result.children[0];
            expect(project.attributes).toBeDefined();
            expect(project.attributes?.get('xmlns')).toBe('http://maven.apache.org/POM/4.0.0');
            expect(project.attributes?.get('version')).toBe('1.0');
        });
        test('should handle nested elements', () => {
            const xml = '<project><dependencies><dependency><groupId>junit</groupId></dependency></dependencies></project>';
            const result = (0, parser_1.parseXml)(xml);
            const project = result.children[0];
            const dependencies = project.children[0];
            const dependency = dependencies.children[0];
            const groupId = dependency.children[0];
            expect(project.name).toBe('project');
            expect(dependencies.name).toBe('dependencies');
            expect(dependency.name).toBe('dependency');
            expect(groupId.name).toBe('groupId');
            expect(groupId.children[0].content).toBe('junit');
        });
        test('should handle mixed content and elements', () => {
            const xml = '<project>some text<groupId>test</groupId>more text</project>';
            const result = (0, parser_1.parseXml)(xml);
            const project = result.children[0];
            expect(project.children).toHaveLength(3);
            expect(project.children[0].type).toBe('text');
            expect(project.children[0].content).toBe('some text');
            expect(project.children[1].type).toBe('element');
            expect(project.children[1].name).toBe('groupId');
            expect(project.children[2].type).toBe('text');
            expect(project.children[2].content).toBe('more text');
        });
        test('should handle empty elements with different syntax', () => {
            const xml = '<project><dependency></dependency><plugin/></project>';
            const result = (0, parser_1.parseXml)(xml);
            const project = result.children[0];
            expect(project.children).toHaveLength(2);
            const dependency = project.children[0];
            expect(dependency.name).toBe('dependency');
            expect(dependency.children).toHaveLength(0);
            const plugin = project.children[1];
            expect(plugin.name).toBe('plugin');
            expect(plugin.children).toHaveLength(0);
        });
    });
    describe('parseAttributes', () => {
        test('should parse single attribute', () => {
            const input = 'project xmlns="http://maven.apache.org/POM/4.0.0"';
            const result = (0, parser_1.parseAttributes)(input);
            expect(result?.get('xmlns')).toBe('http://maven.apache.org/POM/4.0.0');
        });
        test('should parse multiple attributes', () => {
            const input = 'project xmlns="http://maven.apache.org/POM/4.0.0" version="1.0" type="jar"';
            const result = (0, parser_1.parseAttributes)(input);
            expect(result?.get('xmlns')).toBe('http://maven.apache.org/POM/4.0.0');
            expect(result?.get('version')).toBe('1.0');
            expect(result?.get('type')).toBe('jar');
        });
        test('should handle attributes with single quotes', () => {
            const input = "project xmlns='http://maven.apache.org/POM/4.0.0' version='1.0'";
            const result = (0, parser_1.parseAttributes)(input);
            expect(result?.get('xmlns')).toBe('http://maven.apache.org/POM/4.0.0');
            expect(result?.get('version')).toBe('1.0');
        });
        test('should return undefined for tag name only', () => {
            const input = 'project';
            const result = (0, parser_1.parseAttributes)(input);
            expect(result).toBeUndefined();
        });
        test('should handle empty attribute values', () => {
            const input = 'project xmlns="" version="1.0"';
            const result = (0, parser_1.parseAttributes)(input);
            expect(result?.get('xmlns')).toBe('');
            expect(result?.get('version')).toBe('1.0');
        });
    });
});
//# sourceMappingURL=parser.test.js.map