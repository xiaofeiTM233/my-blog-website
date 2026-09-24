'use client';

import { MdPreview } from 'md-editor-rt';
import 'md-editor-rt/lib/preview.css';
import './mdEditorSetup';

interface Props {
  source: string;
  editorId?: string;
}

export default function Markdown({ source, editorId = 'feed' }: Props) {
  return <MdPreview className="feed-md" modelValue={source} editorId={editorId} />;
}
