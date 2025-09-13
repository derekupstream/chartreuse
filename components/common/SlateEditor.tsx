import React, { useMemo, useRef, useCallback } from 'react';
import { createEditor, Editor, Transforms, Text, Element as SlateElement, Node } from 'slate';
import { Slate, Editable, withReact, useSlate } from 'slate-react';
import { Button, Divider, Tooltip } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  FontSizeOutlined
} from '@ant-design/icons';

type CustomElement = { type: string; children: any[] };

const initialValue: any = [{ type: 'paragraph', children: [{ text: '' }] }];

const LIST_TYPES = ['numbered-list', 'bulleted-list'];

const Toolbar = () => {
  return (
    <>
      <div style={{ marginBottom: 8, display: 'flex', gap: 4 }}>
        <MarkButton format='bold' icon={<BoldOutlined />} />
        <MarkButton format='italic' icon={<ItalicOutlined />} />
        <MarkButton format='underline' icon={<UnderlineOutlined />} />
        <BlockButton format='heading-one' icon={<FontSizeOutlined />} tooltip='Heading 1' />
        <BlockButton format='heading-two' icon={<FontSizeOutlined style={{ fontSize: 16 }} />} tooltip='Heading 2' />
        <BlockButton format='bulleted-list' icon={<UnorderedListOutlined />} />
        <BlockButton format='numbered-list' icon={<OrderedListOutlined />} />
      </div>
      <Divider style={{ margin: '8px 0' }} />
    </>
  );
};

const MarkButton = ({ format, icon }: { format: string; icon: React.ReactNode }) => {
  const editor = useSlate();
  return (
    <Tooltip title={format.charAt(0).toUpperCase() + format.slice(1)}>
      <Button
        type={isMarkActive(editor, format) ? 'primary' : 'default'}
        onMouseDown={event => {
          event.preventDefault();
          toggleMark(editor, format);
        }}
        icon={icon}
        size='small'
      />
    </Tooltip>
  );
};

const BlockButton = ({ format, icon, tooltip }: { format: string; icon: React.ReactNode; tooltip?: string }) => {
  const editor = useSlate();
  return (
    <Tooltip title={tooltip || format.charAt(0).toUpperCase() + format.slice(1)}>
      <Button
        type={isBlockActive(editor, format) ? 'primary' : 'default'}
        onMouseDown={event => {
          event.preventDefault();
          toggleBlock(editor, format);
        }}
        icon={icon}
        size='small'
      />
    </Tooltip>
  );
};

const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? (marks as any)[format] === true : false;
};

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isBlockActive = (editor: Editor, format: string) => {
  const [match] = Array.from(
    Editor.nodes(editor, {
      match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && (n as CustomElement).type === format
    })
  );
  return !!match;
};

const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(editor, format);
  const isList = LIST_TYPES.includes(format);

  Transforms.unwrapNodes(editor, {
    match: n => SlateElement.isElement(n) && LIST_TYPES.includes((n as CustomElement).type),
    split: true
  });

  let newType;
  if (isActive) {
    newType = 'paragraph';
  } else if (isList) {
    newType = 'list-item';
  } else {
    newType = format;
  }

  Transforms.setNodes(editor, { type: newType } as Partial<CustomElement>);

  if (!isActive && isList) {
    const block: CustomElement = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const renderElement = (props: any) => {
  const { element, attributes, children } = props;
  if (!SlateElement.isElement(element)) return <p {...attributes}>{children}</p>;
  const el = element as CustomElement;
  switch (el.type) {
    case 'heading-one':
      return <h1 {...attributes}>{children}</h1>;
    case 'heading-two':
      return <h2 {...attributes}>{children}</h2>;
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>;
    case 'numbered-list':
      return <ol {...attributes}>{children}</ol>;
    case 'list-item':
      return <li {...attributes}>{children}</li>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

const renderLeaf = (props: any) => {
  let { attributes, children, leaf } = props;
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (leaf.italic) {
    children = <em>{children}</em>;
  }
  if (leaf.underline) {
    children = <u>{children}</u>;
  }
  return <span {...attributes}>{children}</span>;
};

export const SlateEditor = ({
  value,
  onChange,
  readOnly = false
}: {
  value: any;
  onChange?: (v: any) => void;
  readOnly?: boolean;
}) => {
  const editor = useMemo(() => withReact(createEditor()), []);

  // Create a debounced version of onChange
  const debouncedOnChange = useRef<((v: any) => void) | null>(null);

  if (!debouncedOnChange.current && onChange) {
    debouncedOnChange.current = debounce(onChange, 300);
  }

  // Handler to use in Slate
  const handleChange = useCallback(
    (v: any) => {
      if (readOnly) return;
      if (debouncedOnChange.current) {
        debouncedOnChange.current(v);
      }
    },
    [readOnly]
  );

  return (
    <div>
      <Slate editor={editor} initialValue={value || initialValue} onChange={handleChange}>
        {!readOnly && <Toolbar />}
        <Editable
          readOnly={readOnly}
          placeholder='Enter recommendations...'
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          spellCheck
          autoFocus
          style={{ padding: '0 6px', minHeight: 120 }}
        />
      </Slate>
    </div>
  );
};

// Debounce function
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
