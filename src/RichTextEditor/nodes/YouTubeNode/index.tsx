import {
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type ElementFormatType,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type Spread,
} from 'lexical';
import {
  DecoratorBlockNode,
  SerializedDecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode';

import YouTubeComponent from './YouTubeComponent';

export type SerializedYouTubeNode = Spread<
  { videoID: string },
  SerializedDecoratorBlockNode
>;

function $convertYoutubeElement(
  domNode: HTMLElement
): null | DOMConversionOutput {
  const videoID = domNode.getAttribute('data-lexical-youtube');
  if (videoID) {
    const node = $createYouTubeNode(videoID);
    return { node };
  }
  return null;
}

export class YouTubeNode extends DecoratorBlockNode {
  __id: string;
  __width?: number;

  static getType(): string {
    return 'youtube';
  }

  static clone(node: YouTubeNode): YouTubeNode {
    return new YouTubeNode(node.__id, node.__format, node.__key);
  }

  static importJSON(serializedNode: SerializedYouTubeNode): YouTubeNode {
    const node = $createYouTubeNode(serializedNode.videoID);
    node.setFormat(serializedNode.format);
    return node;
  }

  exportJSON(): SerializedYouTubeNode {
    return {
      ...super.exportJSON(),
      type: 'youtube',
      version: 1,
      videoID: this.__id,
    };
  }

  constructor(
    id: string,
    format?: ElementFormatType,
    key?: NodeKey,
    width?: number
  ) {
    super(format, key);
    this.__id = id;
    this.__width = width;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('iframe');
    element.setAttribute('data-lexical-youtube', this.__id);

    let width = '100%';
    if (this.__width) {
      width = `${this.__width}px`;
    }
    element.setAttribute(
      'style',
      `width: ${width}; height: auto; aspect-ratio: 16/9;`
    );
    element.setAttribute(
      'src',
      `https://www.youtube-nocookie.com/embed/${this.__id}`
    );
    element.setAttribute('frameborder', '0');
    element.setAttribute(
      'allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
    );
    element.setAttribute('allowfullscreen', 'true');
    element.setAttribute('title', 'YouTube video');
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      iframe: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute('data-lexical-youtube')) return null;

        return {
          conversion: $convertYoutubeElement,
          priority: 1,
        };
      },
    };
  }

  setWidth(width: number): void {
    const writable = this.getWritable();
    writable.__width = width;
  }

  updateDOM(): false {
    return false;
  }

  getId(): string {
    return this.__id;
  }

  getTextContent(
    _includeInert?: boolean | undefined,
    _includeDirectionless?: false | undefined
  ): string {
    return `https://www.youtube.com/watch?v=${this.__id}`;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };
    return (
      <YouTubeComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        videoID={this.__id}
      />
    );
  }
}

export function $createYouTubeNode(videoID: string): YouTubeNode {
  return new YouTubeNode(videoID);
}

export function $isYouTubeNode(
  node: YouTubeNode | LexicalNode | null | undefined
): node is YouTubeNode {
  return node instanceof YouTubeNode;
}
