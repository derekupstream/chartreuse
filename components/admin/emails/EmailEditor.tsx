/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BgColorsOutlined,
  BoldOutlined,
  CodeOutlined,
  ItalicOutlined,
  LinkOutlined,
  OrderedListOutlined,
  PictureOutlined,
  StrikethroughOutlined,
  UnorderedListOutlined,
  UnderlineOutlined
} from '@ant-design/icons';
import { Button, Dropdown, Tooltip, Select, message } from 'antd';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;

  .ProseMirror {
    min-height: 360px;
    padding: 20px;
    outline: none;
    font-size: 15px;
    line-height: 1.6;
    color: #222;

    p {
      margin: 0 0 12px;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin: 20px 0 10px;
    }
    h2 {
      font-size: 20px;
      font-weight: 700;
      margin: 18px 0 10px;
    }
    h3 {
      font-size: 17px;
      font-weight: 700;
      margin: 16px 0 8px;
    }
    ul,
    ol {
      padding-left: 24px;
      margin: 0 0 12px;
    }
    blockquote {
      border-left: 3px solid #ddd;
      margin: 12px 0;
      padding: 6px 14px;
      color: #555;
    }
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 12px 0;
      border-radius: 4px;
    }
    a {
      color: #2bbe50;
      text-decoration: underline;
    }
    .mergetag {
      display: inline-block;
      background: #f3f1eb;
      color: #5b6e3d;
      border-radius: 3px;
      padding: 0 5px;
      font-family: 'SFMono-Regular', Consolas, monospace;
      font-size: 13px;
    }
  }
`;

const Toolbar = styled.div`
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  padding: 6px 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
`;

const Divider = styled.div`
  width: 1px;
  height: 22px;
  background: #e8e8e8;
  margin: 0 4px;
`;

type Props = {
  html: string;
  onChange: (html: string) => void;
  variables: string[];
};

const FONT_OPTIONS = [
  { label: 'System', value: '' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times', value: 'Times New Roman, serif' },
  { label: 'Courier', value: 'Courier New, monospace' }
];

const COLOR_SWATCHES = ['#222222', '#2bbe50', '#1677ff', '#fa8c16', '#d4380d', '#9254de', '#13c2c2', '#888888'];

export function EmailEditor({ html, onChange, variables }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isApplyingExternal = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ allowBase64: false, inline: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      FontFamily.configure({ types: ['textStyle'] })
    ],
    content: html || '<p></p>',
    onUpdate: ({ editor }) => {
      if (isApplyingExternal.current) return;
      onChange(editor.getHTML());
    }
  });

  // Sync external content updates (e.g. after Save then re-fetch)
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() === html) return;
    isApplyingExternal.current = true;
    editor.commands.setContent(html || '<p></p>', { emitUpdate: false } as any);
    isApplyingExternal.current = false;
  }, [editor, html]);

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
          (editor.chain().focus() as any).setImage({ src: url }).run();
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
    if (url === '') (editor.chain().focus() as any).unsetLink().run();
    else (editor.chain().focus() as any).setLink({ href: url }).run();
  }, [editor]);

  const insertVariable = useCallback(
    (varName: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(`{{${varName}}}`).run();
    },
    [editor]
  );

  if (!editor) return null;

  const tb = (label: string, icon: React.ReactNode, action: () => void, active: boolean) => (
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
    <Wrapper>
      <Toolbar>
        {tb(
          'Bold',
          <BoldOutlined />,
          () => (editor.chain().focus() as any).toggleBold().run(),
          editor.isActive('bold')
        )}
        {tb(
          'Italic',
          <ItalicOutlined />,
          () => (editor.chain().focus() as any).toggleItalic().run(),
          editor.isActive('italic')
        )}
        {tb(
          'Underline',
          <UnderlineOutlined />,
          () => (editor.chain().focus() as any).toggleUnderline().run(),
          editor.isActive('underline')
        )}
        {tb(
          'Strike',
          <StrikethroughOutlined />,
          () => (editor.chain().focus() as any).toggleStrike().run(),
          editor.isActive('strike')
        )}
        {tb(
          'Code',
          <CodeOutlined />,
          () => (editor.chain().focus() as any).toggleCode().run(),
          editor.isActive('code')
        )}

        <Divider />

        <Button
          size='small'
          type={editor.isActive('heading', { level: 1 }) ? 'primary' : 'text'}
          onClick={() => (editor.chain().focus() as any).toggleHeading({ level: 1 }).run()}
          style={{ height: 28 }}
        >
          H1
        </Button>
        <Button
          size='small'
          type={editor.isActive('heading', { level: 2 }) ? 'primary' : 'text'}
          onClick={() => (editor.chain().focus() as any).toggleHeading({ level: 2 }).run()}
          style={{ height: 28 }}
        >
          H2
        </Button>
        <Button
          size='small'
          type={editor.isActive('heading', { level: 3 }) ? 'primary' : 'text'}
          onClick={() => (editor.chain().focus() as any).toggleHeading({ level: 3 }).run()}
          style={{ height: 28 }}
        >
          H3
        </Button>

        <Divider />

        {tb(
          'Bullet list',
          <UnorderedListOutlined />,
          () => (editor.chain().focus() as any).toggleBulletList().run(),
          editor.isActive('bulletList')
        )}
        {tb(
          'Numbered list',
          <OrderedListOutlined />,
          () => (editor.chain().focus() as any).toggleOrderedList().run(),
          editor.isActive('orderedList')
        )}

        <Divider />

        {tb(
          'Align left',
          <AlignLeftOutlined />,
          () => (editor.chain().focus() as any).setTextAlign('left').run(),
          editor.isActive({ textAlign: 'left' })
        )}
        {tb(
          'Align center',
          <AlignCenterOutlined />,
          () => (editor.chain().focus() as any).setTextAlign('center').run(),
          editor.isActive({ textAlign: 'center' })
        )}
        {tb(
          'Align right',
          <AlignRightOutlined />,
          () => (editor.chain().focus() as any).setTextAlign('right').run(),
          editor.isActive({ textAlign: 'right' })
        )}

        <Divider />

        <Dropdown
          menu={{
            items: COLOR_SWATCHES.map(c => ({
              key: c,
              label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-block', width: 14, height: 14, background: c, borderRadius: 2 }} />
                  {c}
                </div>
              ),
              onClick: () => (editor.chain().focus() as any).setColor(c).run()
            }))
          }}
        >
          <Tooltip title='Text color' mouseEnterDelay={0.5}>
            <Button
              size='small'
              type='text'
              icon={<BgColorsOutlined />}
              style={{ width: 28, height: 28, padding: 0 }}
            />
          </Tooltip>
        </Dropdown>

        <Select
          size='small'
          style={{ width: 110 }}
          placeholder='Font'
          value={editor.getAttributes('textStyle').fontFamily || ''}
          onChange={value => {
            if (!value) (editor.chain().focus() as any).unsetFontFamily().run();
            else (editor.chain().focus() as any).setFontFamily(value).run();
          }}
          options={FONT_OPTIONS}
        />

        <Divider />

        {tb('Insert link', <LinkOutlined />, handleLink, editor.isActive('link'))}
        {tb('Insert image', <PictureOutlined />, () => fileInputRef.current?.click(), false)}

        {variables.length > 0 && (
          <>
            <Divider />
            <Dropdown
              menu={{
                items: variables.map(v => ({
                  key: v,
                  label: <code style={{ fontSize: 12 }}>{`{{${v}}}`}</code>,
                  onClick: () => insertVariable(v)
                }))
              }}
            >
              <Button size='small' type='text' style={{ height: 28 }}>
                Insert variable ▾
              </Button>
            </Dropdown>
          </>
        )}

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
      <EditorContent editor={editor} />
    </Wrapper>
  );
}
