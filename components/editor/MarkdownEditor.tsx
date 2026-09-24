'use client';

import type { ToolbarNames } from 'md-editor-rt';
import { MdEditor } from 'md-editor-rt';
import 'md-editor-rt/lib/style.css';
import './mdEditorSetup';

interface Props {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  editorId?: string;
  height?: number;
  onFocus?: () => void;
}

const TOOLBARS: ToolbarNames[] = [
  'bold',
  'italic',
  'strikeThrough',
  'title',
  'quote',
  'unorderedList',
  'orderedList',
  'task',
  'codeRow',
  'code',
  'link',
  'image',
  'table',
  'revoke',
  'next',
  'preview',
];

export default function MarkdownEditor({
  value = '',
  onChange,
  placeholder,
  editorId = 'feed',
  height = 420,
  onFocus,
}: Props) {
  return (
    <div onFocusCapture={onFocus}>
      <MdEditor
        modelValue={value}
        onChange={(text) => onChange?.(text)}
        toolbars={TOOLBARS}
        placeholder={placeholder}
        editorId={editorId}
        preview={false}
        scrollAuto
        style={{ height }}
      />
    </div>
  );
}
