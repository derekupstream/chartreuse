import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { Button, Tooltip, message } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  PictureOutlined,
  MinusOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useCallback, useRef } from 'react';

const EditorWrapper = styled.div<{ editable: boolean }>`
  border: ${p => (p.editable ? '1px solid #d9d9d9' : 'none')};
  border-radius: 6px;
  overflow: hidden;
  background: white;

  .ProseMirror {
    min-height: ${p => (p.editable ? '400px' : '0')};
    padding: ${p => (p.editable ? '16px' : '0')};
    outline: none;
    font-size: 14px;
    line-height: 1.7;
    color: rgba(0, 0, 0, 0.85);

    p {
      margin: 0 0 12px;
    }
    p:last-child {
      margin-bottom: 0;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      margin: 24px 0 12px;
    }
    h2 {
      font-size: 20px;
      font-weight: 600;
      margin: 20px 0 10px;
    }
    h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 16px 0 8px;
    }
    ul,
    ol {
      padding-left: 24px;
      margin: 0 0 12px;
    }
    li {
      margin-bottom: 4px;
    }
    blockquote {
      border-left: 3px solid #d9d9d9;
      margin: 12px 0;
      padding: 4px 16px;
      color: rgba(0, 0, 0, 0.45);
    }
    pre {
      background: #f5f5f5;
      border-radius: 4px;
      padding: 12px 16px;
      font-family: 'SFMono-Regular', Consolas, monospace;
      font-size: 13px;
      overflow-x: auto;
      margin: 0 0 12px;
    }
    code {
      background: #f5f5f5;
      border-radius: 3px;
      padding: 2px 5px;
      font-family: 'SFMono-Regular', Consolas, monospace;
      font-size: 12px;
    }
    img {
      max-width: 100%;
      border-radius: 4px;
      display: block;
      margin: 12px 0;
    }
    hr {
      border: none;
      border-top: 1px solid #f0f0f0;
      margin: 20px 0;
    }
    a {
      color: #1890ff;
      text-decoration: underline;
    }
  }

  .ProseMirror p.is-editor-empty:first-child::before {
    color: rgba(0, 0, 0, 0.25);
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
`;

const Toolbar = styled.div`
  border-bottom: 1px solid #f0f0f0;
  padding: 6px 8px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  background: #fafafa;
`;

const Divider = styled.div`
  width: 1px;
  height: 20px;
  background: #e8e8e8;
  margin: 0 4px;
`;

const HeadingBtn = styled.button<{ active?: boolean }>`
  border: none;
  background: ${p => (p.active ? '#e6f4ff' : 'transparent')};
  border-radius: 4px;
  padding: 2px 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: ${p => (p.active ? '#1890ff' : 'rgba(0,0,0,0.65)')};
  height: 28px;
  line-height: 1;
  &:hover {
    background: #f0f0f0;
  }
`;

type Props = {
  content: any;
  onChange?: (json: any) => void;
  editable?: boolean;
  placeholder?: string;
};

export default function TipTapEditor({
  content,
  onChange,
  editable = true,
  placeholder = 'Write your methodology here...'
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ allowBase64: false }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] })
    ],
    content: content || null,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    }
  });

  const handleImageFile = useCallback(
    async (file: File) => {
      if (!editor) return;
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const res = await fetch('/api/admin/methodology/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: file.name, fileData: base64, mimeType: file.type })
          });
          if (!res.ok) throw new Error('Upload failed');
          const { url } = await res.json();
          editor.chain().focus().setImage({ src: url }).run();
        } catch {
          message.error('Image upload failed');
        }
      };
      reader.readAsDataURL(file);
    },
    [editor]
  );

  const handleLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href ?? '';
    const url = window.prompt('Enter URL:', prev);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  const tb = (label: string, action: () => void, active: boolean, icon: React.ReactNode) => (
    <Tooltip title={label} mouseEnterDelay={0.5}>
      <Button
        size='small'
        type={active ? 'primary' : 'text'}
        icon={icon}
        onClick={action}
        style={{ width: 28, height: 28, padding: 0 }}
      />
    </Tooltip>
  );

  return (
    <EditorWrapper editable={editable}>
      {editable && (
        <Toolbar>
          {/* Text formatting */}
          {tb('Bold', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), <BoldOutlined />)}
          {tb(
            'Italic',
            () => editor.chain().focus().toggleItalic().run(),
            editor.isActive('italic'),
            <ItalicOutlined />
          )}
          {tb(
            'Underline',
            () => editor.chain().focus().toggleUnderline().run(),
            editor.isActive('underline'),
            <UnderlineOutlined />
          )}
          {tb(
            'Strike',
            () => editor.chain().focus().toggleStrike().run(),
            editor.isActive('strike'),
            <StrikethroughOutlined />
          )}

          <Divider />

          {/* Headings */}
          <HeadingBtn
            active={editor.isActive('heading', { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            H1
          </HeadingBtn>
          <HeadingBtn
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </HeadingBtn>
          <HeadingBtn
            active={editor.isActive('heading', { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            H3
          </HeadingBtn>

          <Divider />

          {/* Lists */}
          {tb(
            'Bullet list',
            () => editor.chain().focus().toggleBulletList().run(),
            editor.isActive('bulletList'),
            <UnorderedListOutlined />
          )}
          {tb(
            'Numbered list',
            () => editor.chain().focus().toggleOrderedList().run(),
            editor.isActive('orderedList'),
            <OrderedListOutlined />
          )}

          <Divider />

          {/* Alignment */}
          {tb(
            'Align left',
            () => editor.chain().focus().setTextAlign('left').run(),
            editor.isActive({ textAlign: 'left' }),
            <AlignLeftOutlined />
          )}
          {tb(
            'Align center',
            () => editor.chain().focus().setTextAlign('center').run(),
            editor.isActive({ textAlign: 'center' }),
            <AlignCenterOutlined />
          )}
          {tb(
            'Align right',
            () => editor.chain().focus().setTextAlign('right').run(),
            editor.isActive({ textAlign: 'right' }),
            <AlignRightOutlined />
          )}

          <Divider />

          {/* Insert */}
          {tb('Insert link', handleLink, editor.isActive('link'), <LinkOutlined />)}
          {tb('Insert image', () => fileInputRef.current?.click(), false, <PictureOutlined />)}
          {tb('Horizontal rule', () => editor.chain().focus().setHorizontalRule().run(), false, <MinusOutlined />)}

          <input
            ref={fileInputRef}
            type='file'
            accept='image/*'
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleImageFile(file);
              e.target.value = '';
            }}
          />
        </Toolbar>
      )}
      <EditorContent editor={editor} />
    </EditorWrapper>
  );
}
