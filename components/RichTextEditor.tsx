'use client';
import dynamic from 'next/dynamic';
import { useMemo } from 'react';

// ReactQuill depends on window, so load dynamically on client
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function RichTextEditor({ value, onChange }: Props) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
    }),
    []
  );
  return (
    <div className="rounded-xl border" style={{background:'rgba(255,255,255,0.06)', borderColor:'var(--card-border)'}}>
      <div className="quill-robux">
        <ReactQuill theme="snow" value={value} onChange={onChange} modules={modules} />
      </div>
    </div>
  );
}
