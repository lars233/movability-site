import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { useEffect } from "react";

interface TiptapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

type ToolbarBtn = {
  label: string;
  action: (editor: ReturnType<typeof useEditor>) => void;
  isActive?: (editor: ReturnType<typeof useEditor>) => boolean;
};

const TOOLBAR: ToolbarBtn[] = [
  {
    label: "B",
    action: (e) => e?.chain().focus().toggleBold().run(),
    isActive: (e) => e?.isActive("bold") ?? false,
  },
  {
    label: "I",
    action: (e) => e?.chain().focus().toggleItalic().run(),
    isActive: (e) => e?.isActive("italic") ?? false,
  },
  {
    label: "S",
    action: (e) => e?.chain().focus().toggleStrike().run(),
    isActive: (e) => e?.isActive("strike") ?? false,
  },
  {
    label: "H1",
    action: (e) => e?.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: (e) => e?.isActive("heading", { level: 1 }) ?? false,
  },
  {
    label: "H2",
    action: (e) => e?.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (e) => e?.isActive("heading", { level: 2 }) ?? false,
  },
  {
    label: "H3",
    action: (e) => e?.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: (e) => e?.isActive("heading", { level: 3 }) ?? false,
  },
  {
    label: "•—",
    action: (e) => e?.chain().focus().toggleBulletList().run(),
    isActive: (e) => e?.isActive("bulletList") ?? false,
  },
  {
    label: "1.",
    action: (e) => e?.chain().focus().toggleOrderedList().run(),
    isActive: (e) => e?.isActive("orderedList") ?? false,
  },
  {
    label: "❝",
    action: (e) => e?.chain().focus().toggleBlockquote().run(),
    isActive: (e) => e?.isActive("blockquote") ?? false,
  },
  {
    label: "</>",
    action: (e) => e?.chain().focus().toggleCodeBlock().run(),
    isActive: (e) => e?.isActive("codeBlock") ?? false,
  },
];

export default function TiptapEditor({
  value,
  onChange,
  placeholder = "Start writing…",
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-600 underline cursor-pointer" },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "focus:outline-none min-h-[360px] px-4 py-3 text-gray-800 leading-relaxed",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <style>{`
        .tiptap h1 { font-size: 1.75rem; font-weight: 700; margin: 1rem 0 0.5rem; line-height: 1.2; }
        .tiptap h2 { font-size: 1.35rem; font-weight: 600; margin: 0.875rem 0 0.4rem; }
        .tiptap h3 { font-size: 1.1rem; font-weight: 600; margin: 0.75rem 0 0.35rem; }
        .tiptap p { margin-bottom: 0.75rem; }
        .tiptap ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .tiptap ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .tiptap li { margin-bottom: 0.25rem; }
        .tiptap blockquote { border-left: 3px solid #d1d5db; padding-left: 1rem; color: #6b7280; margin: 0.75rem 0; }
        .tiptap pre { background: #f3f4f6; border-radius: 0.375rem; padding: 0.75rem 1rem; font-size: 0.875rem; margin: 0.75rem 0; overflow-x: auto; }
        .tiptap code { background: #f3f4f6; border-radius: 0.25rem; padding: 0.1rem 0.3rem; font-size: 0.85em; }
        .tiptap pre code { background: none; padding: 0; }
        .tiptap .is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
      `}</style>

      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50">
        {TOOLBAR.map((btn) => (
          <button
            key={btn.label}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              btn.action(editor);
            }}
            className={`px-2 py-1 text-sm rounded font-mono transition-colors ${
              btn.isActive?.(editor)
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            {btn.label}
          </button>
        ))}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().undo().run();
          }}
          className="px-2 py-1 text-sm rounded font-mono bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 ml-auto"
        >
          ↩
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().redo().run();
          }}
          className="px-2 py-1 text-sm rounded font-mono bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
        >
          ↪
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
