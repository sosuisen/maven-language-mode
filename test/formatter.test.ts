import { formatXml, formatNode } from '../src/extension';

describe('XML Formatter', () => {
    describe('formatXml', () => {
        test('should format simple Maven POM structure', () => {
            const input = `<?xml version="1.0" encoding="UTF-8"?><project><modelVersion>4.0.0</modelVersion><groupId>com.example</groupId></project>`;
            
            const expected = `<?xml version="1.0" encoding="UTF-8"?>
<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
</project>
`;
            
            const result = formatXml(input);
            expect(result).toBe(expected);
        });

        test('should handle empty self-closing tags', () => {
            const input = `<project><dependency/><plugin/></project>`;
            
            const expected = `<project>
  <dependency/>
  <plugin/>
</project>
`;
            
            const result = formatXml(input);
            expect(result).toBe(expected);
        });

        test('should format nested dependencies properly', () => {
            const input = `<project><dependencies><dependency><groupId>junit</groupId><artifactId>junit</artifactId><version>4.13.2</version></dependency></dependencies></project>`;
            
            const expected = `<project>
  <dependencies>
    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>4.13.2</version>
    </dependency>
  </dependencies>
</project>
`;
            
            const result = formatXml(input);
            expect(result).toBe(expected);
        });

        test('should add extra newlines after group tags', () => {
            const input = `<project><dependencies><dependency><groupId>test</groupId></dependency></dependencies><build><plugins></plugins></build></project>`;
            
            const expected = `<project>
  <dependencies>
    <dependency>
      <groupId>test</groupId>
    </dependency>
  </dependencies>

  <build>
    <plugins/>
  </build>
</project>
`;
            
            const result = formatXml(input);
            expect(result).toBe(expected);
        });

        test('should handle XML comments', () => {
            const input = `<project><!-- This is a comment --><groupId>com.example</groupId></project>`;
            
            const expected = `<project>
  <!-- This is a comment -->
  <groupId>com.example</groupId>
</project>
`;
            
            const result = formatXml(input);
            expect(result).toBe(expected);
        });

        test('should handle attributes correctly', () => {
            const input = `<project xmlns="http://maven.apache.org/POM/4.0.0"><groupId>test</groupId></project>`;
            
            const expected = `<project xmlns="http://maven.apache.org/POM/4.0.0">
  <groupId>test</groupId>
</project>
`;
            
            const result = formatXml(input);
            expect(result).toBe(expected);
        });

        test('should handle properties with special newline behavior', () => {
            const input = `<project><properties><maven.compiler.source>11</maven.compiler.source></properties><dependencies></dependencies></project>`;
            
            const expected = `<project>
  <properties>
    <maven.compiler.source>11</maven.compiler.source>
  </properties>

  <dependencies/>
</project>
`;
            
            const result = formatXml(input);
            expect(result).toBe(expected);
        });

        test('should preserve XML declaration', () => {
            const input = `<?xml version="1.0" encoding="UTF-8"?><project><groupId>test</groupId></project>`;
            
            const expected = `<?xml version="1.0" encoding="UTF-8"?>
<project>
  <groupId>test</groupId>
</project>
`;
            
            const result = formatXml(input);
            expect(result).toBe(expected);
        });

        test('should handle complex Maven POM structure', () => {
            const input = `<?xml version="1.0" encoding="UTF-8"?><project xmlns="http://maven.apache.org/POM/4.0.0"><modelVersion>4.0.0</modelVersion><groupId>com.example</groupId><artifactId>my-app</artifactId><version>1.0.0</version><properties><maven.compiler.source>11</maven.compiler.source><maven.compiler.target>11</maven.compiler.target></properties><dependencies><dependency><groupId>junit</groupId><artifactId>junit</artifactId><version>4.13.2</version><scope>test</scope></dependency></dependencies><build><plugins><plugin><groupId>org.apache.maven.plugins</groupId><artifactId>maven-compiler-plugin</artifactId><version>3.8.1</version></plugin></plugins></build></project>`;
            
            const expected = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>my-app</artifactId>
  <version>1.0.0</version>
  <properties>
    <maven.compiler.source>11</maven.compiler.source>
    <maven.compiler.target>11</maven.compiler.target>
  </properties>

  <dependencies>
    <dependency>
      <groupId>junit</groupId>
      <artifactId>junit</artifactId>
      <version>4.13.2</version>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>3.8.1</version>
      </plugin>
    </plugins>
  </build>
</project>
`;
            
            const result = formatXml(input);
            expect(result).toBe(expected);
        });
    });
});