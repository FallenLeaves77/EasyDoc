import { 
  IContentBlock, 
  IStructureNode, 
  ITableData, 
  IFigureData, 
  ContentBlockType, 
  StructureNodeType, 
  FigureType,
  ApiResponse 
} from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AnalysisResult {
  contentBlocks: IContentBlock[];
  structureNodes: IStructureNode[];
  tables: ITableData[];
  figures: IFigureData[];
}

export class ContentAnalysisService {
  
  /**
   * Analyze content from EasyDoc parse result
   */
  async analyzeContent(parseResult: any): Promise<ApiResponse<AnalysisResult>> {
    try {
      console.log('🔍 Starting content analysis...');
      
      const contentBlocks = this.extractContentBlocks(parseResult);
      const structureNodes = this.extractStructureNodes(parseResult, contentBlocks);
      const tables = this.extractTables(parseResult);
      const figures = this.extractFigures(parseResult);

      console.log(`✅ Content analysis completed:
        - Content Blocks: ${contentBlocks.length}
        - Structure Nodes: ${structureNodes.length}
        - Tables: ${tables.length}
        - Figures: ${figures.length}`);

      return {
        success: true,
        data: {
          contentBlocks,
          structureNodes,
          tables,
          figures,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: uuidv4(),
          version: '1.0.0',
        },
      };
    } catch (error: any) {
      console.error('❌ Error analyzing content:', error);
      return {
        success: false,
        error: {
          code: 'CONTENT_ANALYSIS_ERROR',
          message: error.message || 'Failed to analyze content',
          details: error,
        },
      };
    }
  }

  /**
   * Extract content blocks from parse result
   */
  private extractContentBlocks(parseResult: any): IContentBlock[] {
    const blocks: IContentBlock[] = [];
    
    try {
      // Handle different parse result structures
      const content = parseResult.content || parseResult.text || parseResult;
      
      if (typeof content === 'string') {
        // Simple text content - split into paragraphs
        const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
        
        paragraphs.forEach((paragraph, index) => {
          blocks.push({
            id: uuidv4(),
            type: this.classifyContentType(paragraph),
            content: paragraph.trim(),
            position: {
              page: 1,
              x: 0,
              y: index * 50,
              width: 100,
              height: 40,
            },
            metadata: {
              confidence: 0.8,
              language: 'en',
              semanticTags: this.extractSemanticTags(paragraph),
              wordCount: paragraph.split(/\s+/).length,
            },
          });
        });
      } else if (Array.isArray(content)) {
        // Array of content items
        content.forEach((item, index) => {
          if (typeof item === 'string') {
            blocks.push({
              id: uuidv4(),
              type: this.classifyContentType(item),
              content: item.trim(),
              position: {
                page: 1,
                x: 0,
                y: index * 50,
                width: 100,
                height: 40,
              },
              metadata: {
                confidence: 0.8,
                language: 'en',
                semanticTags: this.extractSemanticTags(item),
                wordCount: item.split(/\s+/).length,
              },
            });
          } else if (item && typeof item === 'object') {
            // Structured content item
            blocks.push({
              id: uuidv4(),
              type: item.type || this.classifyContentType(item.text || item.content || ''),
              content: item.text || item.content || JSON.stringify(item),
              position: {
                page: item.page || 1,
                x: item.x || 0,
                y: item.y || index * 50,
                width: item.width || 100,
                height: item.height || 40,
              },
              metadata: {
                confidence: item.confidence || 0.8,
                language: item.language || 'en',
                semanticTags: this.extractSemanticTags(item.text || item.content || ''),
                wordCount: (item.text || item.content || '').split(/\s+/).length,
              },
            });
          }
        });
      } else if (content && typeof content === 'object') {
        // Object with structured content
        if (content.pages && Array.isArray(content.pages)) {
          content.pages.forEach((page: any, pageIndex: number) => {
            if (page.blocks && Array.isArray(page.blocks)) {
              page.blocks.forEach((block: any, blockIndex: number) => {
                blocks.push({
                  id: uuidv4(),
                  type: block.type || this.classifyContentType(block.text || ''),
                  content: block.text || block.content || '',
                  position: {
                    page: pageIndex + 1,
                    x: block.x || 0,
                    y: block.y || blockIndex * 50,
                    width: block.width || 100,
                    height: block.height || 40,
                  },
                  metadata: {
                    confidence: block.confidence || 0.8,
                    language: block.language || 'en',
                    semanticTags: this.extractSemanticTags(block.text || ''),
                    wordCount: (block.text || '').split(/\s+/).length,
                  },
                });
              });
            }
          });
        }
      }
    } catch (error) {
      console.error('❌ Error extracting content blocks:', error);
    }

    return blocks;
  }

  /**
   * Extract hierarchical structure from content blocks
   */
  private extractStructureNodes(parseResult: any, contentBlocks: IContentBlock[]): IStructureNode[] {
    const nodes: IStructureNode[] = [];
    
    try {
      // Create document root node
      const rootNode: IStructureNode = {
        id: uuidv4(),
        type: StructureNodeType.DOCUMENT,
        title: 'Document',
        level: 0,
        position: { page: 1, order: 0 },
        childIds: [],
        contentBlockIds: [],
        metadata: {
          wordCount: contentBlocks.reduce((sum, block) => sum + block.metadata.wordCount, 0),
          importance: 1.0,
          keywords: [],
        },
      };
      nodes.push(rootNode);

      // Extract headings and create hierarchy
      const headingBlocks = contentBlocks.filter(block => 
        block.type === ContentBlockType.TITLE || block.type === ContentBlockType.HEADING
      );

      let currentLevel = 1;
      let parentStack: IStructureNode[] = [rootNode];

      headingBlocks.forEach((block, index) => {
        const level = this.determineHeadingLevel(block.content);
        
        // Adjust parent stack based on level
        while (parentStack.length > level) {
          parentStack.pop();
        }

        const parent = parentStack[parentStack.length - 1];
        const node: IStructureNode = {
          id: uuidv4(),
          type: level === 1 ? StructureNodeType.CHAPTER : 
                level === 2 ? StructureNodeType.SECTION : StructureNodeType.SUBSECTION,
          title: block.content.substring(0, 100),
          level,
          position: { page: block.position.page, order: index },
          parentId: parent.id,
          childIds: [],
          contentBlockIds: [block.id],
          metadata: {
            wordCount: block.metadata.wordCount,
            importance: Math.max(0.1, 1.0 - (level - 1) * 0.2),
            keywords: block.metadata.semanticTags || [],
          },
        };

        parent.childIds.push(node.id);
        nodes.push(node);
        parentStack.push(node);
      });

      // Assign remaining content blocks to appropriate structure nodes
      const nonHeadingBlocks = contentBlocks.filter(block => 
        block.type !== ContentBlockType.TITLE && block.type !== ContentBlockType.HEADING
      );

      nonHeadingBlocks.forEach(block => {
        // Find the most appropriate parent node based on position
        const appropriateNode = this.findAppropriateParentNode(block, nodes);
        if (appropriateNode) {
          appropriateNode.contentBlockIds.push(block.id);
          appropriateNode.metadata.wordCount += block.metadata.wordCount;
        }
      });

    } catch (error) {
      console.error('❌ Error extracting structure nodes:', error);
    }

    return nodes;
  }

  /**
   * Extract tables from parse result
   */
  private extractTables(parseResult: any): ITableData[] {
    const tables: ITableData[] = [];
    
    try {
      // Look for table data in various formats
      const content = parseResult.content || parseResult.tables || parseResult;
      
      if (content && content.tables && Array.isArray(content.tables)) {
        content.tables.forEach((table: any, index: number) => {
          tables.push(this.processTableData(table, index));
        });
      }
      
      // Look for table-like structures in text
      if (typeof content === 'string') {
        const tableMatches = this.extractTablesFromText(content);
        tableMatches.forEach((table, index) => {
          tables.push(table);
        });
      }
    } catch (error) {
      console.error('❌ Error extracting tables:', error);
    }

    return tables;
  }

  /**
   * Extract figures from parse result
   */
  private extractFigures(parseResult: any): IFigureData[] {
    const figures: IFigureData[] = [];
    
    try {
      const content = parseResult.content || parseResult.figures || parseResult;
      
      if (content && content.figures && Array.isArray(content.figures)) {
        content.figures.forEach((figure: any, index: number) => {
          figures.push({
            id: uuidv4(),
            type: this.classifyFigureType(figure),
            position: {
              page: figure.page || 1,
              x: figure.x || 0,
              y: figure.y || index * 100,
              width: figure.width || 200,
              height: figure.height || 150,
            },
            content: {
              imageUrl: figure.url || figure.src,
              description: figure.description || figure.alt || 'Figure',
              caption: figure.caption,
              altText: figure.alt,
            },
            metadata: {
              confidence: figure.confidence || 0.8,
              extractedText: figure.text,
              colors: figure.colors || [],
              objects: figure.objects || [],
            },
          });
        });
      }
    } catch (error) {
      console.error('❌ Error extracting figures:', error);
    }

    return figures;
  }

  // Helper methods
  private classifyContentType(content: string): ContentBlockType {
    const trimmed = content.trim();
    
    if (trimmed.match(/^#{1,6}\s/)) return ContentBlockType.HEADING;
    if (trimmed.length < 100 && trimmed.match(/^[A-Z][^.!?]*$/)) return ContentBlockType.TITLE;
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.match(/^\d+\./)) return ContentBlockType.LIST;
    if (trimmed.startsWith('>')) return ContentBlockType.QUOTE;
    if (trimmed.includes('```') || trimmed.includes('`')) return ContentBlockType.CODE;
    
    return ContentBlockType.PARAGRAPH;
  }

  private extractSemanticTags(content: string): string[] {
    const tags: string[] = [];
    
    // Extract potential keywords (simple implementation)
    const words = content.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const wordFreq: { [key: string]: number } = {};
    
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // Get top 5 most frequent words as tags
    const sortedWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
    
    return sortedWords;
  }

  private determineHeadingLevel(content: string): number {
    const hashMatch = content.match(/^(#{1,6})\s/);
    if (hashMatch) return hashMatch[1].length;
    
    if (content.length < 50 && content.toUpperCase() === content) return 1;
    if (content.length < 80) return 2;
    
    return 3;
  }

  private findAppropriateParentNode(block: IContentBlock, nodes: IStructureNode[]): IStructureNode | null {
    // Find the node with the closest position on the same or previous page
    const candidateNodes = nodes.filter(node => 
      node.position.page <= block.position.page && 
      node.type !== StructureNodeType.DOCUMENT
    );
    
    if (candidateNodes.length === 0) {
      return nodes.find(node => node.type === StructureNodeType.DOCUMENT) || null;
    }
    
    // Return the last node before this block's position
    return candidateNodes[candidateNodes.length - 1];
  }

  private processTableData(table: any, index: number): ITableData {
    return {
      id: uuidv4(),
      position: {
        page: table.page || 1,
        x: table.x || 0,
        y: table.y || index * 100,
        width: table.width || 300,
        height: table.height || 200,
      },
      structure: {
        rows: table.rows?.length || 0,
        columns: table.columns?.length || 0,
        hasHeader: table.hasHeader || false,
        hasFooter: table.hasFooter || false,
      },
      data: table.data || [],
      metadata: {
        title: table.title,
        caption: table.caption,
        confidence: table.confidence || 0.8,
        dataTypes: table.dataTypes || ['text'],
      },
    };
  }

  private extractTablesFromText(content: string): ITableData[] {
    // Simple table extraction from text (basic implementation)
    const tables: ITableData[] = [];
    const lines = content.split('\n');
    
    // Look for lines that might be table rows (contain multiple | or \t)
    const tableLines: string[] = [];
    let inTable = false;
    
    lines.forEach(line => {
      const hasMultipleSeparators = (line.match(/\|/g) || []).length > 1 || 
                                   (line.match(/\t/g) || []).length > 1;
      
      if (hasMultipleSeparators) {
        if (!inTable) {
          inTable = true;
          tableLines.length = 0;
        }
        tableLines.push(line);
      } else if (inTable && tableLines.length > 1) {
        // End of table, process it
        tables.push(this.processTextTable(tableLines));
        inTable = false;
      }
    });
    
    return tables;
  }

  private processTextTable(lines: string[]): ITableData {
    const separator = lines[0].includes('|') ? '|' : '\t';
    const rows = lines.map(line => 
      line.split(separator).map(cell => ({
        value: cell.trim(),
        type: 'text' as const,
      }))
    );
    
    return {
      id: uuidv4(),
      position: { page: 1, x: 0, y: 0, width: 300, height: 200 },
      structure: {
        rows: rows.length,
        columns: rows[0]?.length || 0,
        hasHeader: true,
        hasFooter: false,
      },
      data: rows,
      metadata: {
        confidence: 0.7,
        dataTypes: ['text'],
      },
    };
  }

  private classifyFigureType(figure: any): FigureType {
    const description = (figure.description || figure.alt || '').toLowerCase();
    
    if (description.includes('chart') || description.includes('graph')) return FigureType.CHART;
    if (description.includes('diagram')) return FigureType.DIAGRAM;
    if (description.includes('photo')) return FigureType.PHOTO;
    if (description.includes('illustration')) return FigureType.ILLUSTRATION;
    
    return FigureType.IMAGE;
  }
}
