'use client';

import { Image } from 'antd';
import type { IContent } from '@/lib/models/Feed';

interface Props {
  content: IContent;
  alt: string;
}

const CELL = 156;

function columnCount(total: number): number {
  if (total <= 1) return 1;
  if (total === 4) return 2;
  return 3;
}

export default function FeedImages({ content, alt }: Props) {
  const images = content.images?.length ? content.images : content.cover ? [content.cover] : [];
  if (!images.length) return null;

  const cols = columnCount(images.length);
  const single = images.length === 1;

  return (
    <div
      style={{
        marginTop: 10,
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${single ? 320 : CELL}px)`,
        gap: 4,
      }}
    >
      <Image.PreviewGroup>
        {images.map((src, index) => (
          <Image
            key={src}
            src={src}
            alt={single ? alt : `${alt} 图 ${index + 1}`}
            width={single ? 320 : CELL}
            height={single ? undefined : CELL}
            style={{ objectFit: 'cover', background: '#f5f5f5' }}
            styles={{
              root: { borderRadius: 6, overflow: 'hidden' },
              cover: { borderRadius: 6 },
            }}
          />
        ))}
      </Image.PreviewGroup>
    </div>
  );
}
