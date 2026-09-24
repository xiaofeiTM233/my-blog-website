// app/editor/page.tsx
import type { Metadata } from 'next';
import EditorWorkbench from '@/components/editor/EditorWorkbench';

export const metadata: Metadata = {
  title: '写动态',
  description: 'Markdown 编辑器',
};

export default function EditorPage() {
  return <EditorWorkbench />;
}
