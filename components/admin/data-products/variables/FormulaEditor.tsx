/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Dropdown, Tag, Typography } from 'antd';
import { Node, mergeAttributes } from '@tiptap/core';
import { EditorContent, ReactNodeViewRenderer, NodeViewWrapper, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';

import { VARIABLE_COLORS, VARIABLE_KIND_LABEL } from 'lib/dataProducts/variables';
import type { FormulaToken, Variable } from 'lib/dataProducts/variables';

const { Text } = Typography;

type Props = {
  value: FormulaToken[];
  onChange: (tokens: FormulaToken[]) => void;
  variables: Variable[]; // available to insert (everything except the variable being edited)
  placeholder?: string;
};

const VAR_NODE_NAME = 'variableMention';
const DRAG_MIME = 'application/x-variable-id';

/**
 * Custom inline node for a variable reference. Atomic + selectable so backspace
 * deletes the whole pill in one keystroke. Stores id + name as attrs.
 */
const VariableMention = Node.create({
  name: VAR_NODE_NAME,
  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      id: { default: null },
      name: { default: '' },
      kind: { default: 'user_input' }
    };
  },

  parseHTML() {
    return [{ tag: `span[data-variable-mention]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-variable-mention': 'true',
        class: 'variable-pill'
      }),
      `{{${HTMLAttributes.name}}}`
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VariablePillView as any);
  }
});

function VariablePillView({ node }: { node: any }) {
  const kind = (node.attrs.kind as keyof typeof VARIABLE_COLORS) || 'user_input';
  const colors = VARIABLE_COLORS[kind];
  return (
    <NodeViewWrapper as='span' style={{ display: 'inline-block' }}>
      <span
        contentEditable={false}
        style={{
          display: 'inline-block',
          background: colors.bg,
          color: '#262626',
          border: `1px solid ${colors.border}`,
          borderLeft: `4px solid ${colors.border}`,
          borderRadius: 4,
          padding: '0 6px',
          margin: '0 2px',
          fontSize: 13,
          fontFamily: 'inherit',
          lineHeight: '20px',
          cursor: 'default',
          whiteSpace: 'nowrap'
        }}
        title={`${VARIABLE_KIND_LABEL[kind]}: ${node.attrs.name}`}
      >
        {node.attrs.name}
      </span>
    </NodeViewWrapper>
  );
}

export function FormulaEditor({ value, onChange, variables, placeholder }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // formula is a single-line expression — disable blocks
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false
      }),
      VariableMention
    ],
    content: tokensToTipTapDoc(value, variables),
    onUpdate: ({ editor }) => {
      const tokens = tipTapDocToTokens(editor.getJSON());
      onChange(tokens);
    }
  });

  // Reset content if the incoming value diverges (e.g. modal reused for a
  // different variable). Skip reset if the editor's current content already
  // matches what we'd render — avoids a flicker every keystroke.
  useEffect(() => {
    if (!editor) return;
    const currentTokens = tipTapDocToTokens(editor.getJSON());
    if (tokensEqual(currentTokens, value)) return;
    (editor.commands as any).setContent(tokensToTipTapDoc(value, variables), { emitUpdate: false });
  }, [editor, value, variables]);

  const insertVariable = (v: Variable) => {
    if (!editor) return;
    (editor.chain().focus() as any)
      .insertContent({
        type: VAR_NODE_NAME,
        attrs: { id: v.id, name: v.name, kind: v.kind }
      })
      .insertContent(' ')
      .run();
  };

  // Drag-from-sidebar → drop a pill at the insertion point
  const handleDrop = (e: React.DragEvent) => {
    const id = e.dataTransfer.getData(DRAG_MIME);
    if (!id || !editor) return;
    const v = variables.find(x => x.id === id);
    if (!v) return;
    e.preventDefault();
    // Tiptap drop coordinates → document position
    const coords = { left: e.clientX, top: e.clientY };
    const pos = editor.view.posAtCoords(coords);
    if (pos) {
      (editor.chain().focus(pos.pos) as any)
        .insertContent({
          type: VAR_NODE_NAME,
          attrs: { id: v.id, name: v.name, kind: v.kind }
        })
        .insertContent(' ')
        .run();
    } else {
      insertVariable(v);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(DRAG_MIME)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  if (!editor) return null;

  return (
    <div>
      <div
        style={{
          minHeight: 64,
          border: '1px solid #d9d9d9',
          borderRadius: 4,
          padding: '8px 10px',
          background: '#fff',
          fontSize: 14,
          fontFamily: 'monospace',
          cursor: 'text'
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <EditorContent editor={editor} />
        {value.length === 0 && placeholder && (
          <Text type='secondary' style={{ fontSize: 13, pointerEvents: 'none' }}>
            {placeholder}
          </Text>
        )}
      </div>

      {/* Toolbar with insert-variable dropdown + quick-insert operator chips */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Dropdown
          menu={{
            items:
              variables.length === 0
                ? [{ key: '_empty', label: <Text type='secondary'>No other variables yet</Text>, disabled: true }]
                : variables.map(v => ({
                    key: v.id,
                    label: (
                      <span>
                        <Tag color={VARIABLE_COLORS[v.kind].border} style={{ marginRight: 6 }}>
                          {VARIABLE_KIND_LABEL[v.kind]}
                        </Tag>
                        {v.name}
                      </span>
                    ),
                    onClick: () => insertVariable(v)
                  }))
          }}
        >
          <Button size='small'>+ Insert variable</Button>
        </Dropdown>
        {['+', '-', '*', '/', '(', ')'].map(op => (
          <Button
            key={op}
            size='small'
            onClick={() => (editor.chain().focus() as any).insertContent(` ${op} `).run()}
            style={{ fontFamily: 'monospace', minWidth: 28 }}
          >
            {op}
          </Button>
        ))}
        <Text type='secondary' style={{ fontSize: 11, marginLeft: 'auto' }}>
          Tip: drag pills from the sidebar, or type Excel functions like <code>IF(…)</code>, <code>SUM(…)</code>.
        </Text>
      </div>
    </div>
  );
}

// ── Serialization ─────────────────────────────────────────────────────────────

function tokensToTipTapDoc(tokens: FormulaToken[], variables: Variable[]) {
  const children: any[] = [];
  for (const t of tokens) {
    if (t.type === 'text') {
      if (t.value) children.push({ type: 'text', text: t.value });
    } else {
      const v = variables.find(x => x.id === t.id);
      children.push({
        type: VAR_NODE_NAME,
        attrs: { id: t.id, name: v?.name ?? t.name, kind: v?.kind ?? 'user_input' }
      });
    }
  }
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: children.length ? children : undefined }]
  };
}

function tipTapDocToTokens(doc: any): FormulaToken[] {
  const tokens: FormulaToken[] = [];
  function walk(node: any) {
    if (!node) return;
    if (node.type === 'text') {
      tokens.push({ type: 'text', value: node.text ?? '' });
      return;
    }
    if (node.type === VAR_NODE_NAME) {
      tokens.push({ type: 'var', id: node.attrs?.id, name: node.attrs?.name ?? '' });
      return;
    }
    if (Array.isArray(node.content)) node.content.forEach(walk);
  }
  walk(doc);
  // Merge adjacent text tokens for tidier evaluation
  const merged: FormulaToken[] = [];
  for (const t of tokens) {
    const last = merged[merged.length - 1];
    if (t.type === 'text' && last && last.type === 'text') {
      last.value += t.value;
    } else {
      merged.push(t);
    }
  }
  return merged;
}

function tokensEqual(a: FormulaToken[], b: FormulaToken[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].type !== b[i].type) return false;
    if (a[i].type === 'text' && (a[i] as any).value !== (b[i] as any).value) return false;
    if (a[i].type === 'var' && (a[i] as any).id !== (b[i] as any).id) return false;
  }
  return true;
}
