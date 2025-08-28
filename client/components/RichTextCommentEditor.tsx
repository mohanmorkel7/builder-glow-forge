import React, { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bold,
  Italic,
  Strikethrough,
  Link as LinkIcon,
  Upload,
  X,
  FileText,
  Send,
  AtSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextCommentEditorProps {
  onSubmit: (
    content: string,
    attachments: File[],
    isInternal: boolean,
    mentions: string[],
  ) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export default function RichTextCommentEditor({
  onSubmit,
  isLoading = false,
  placeholder = "Type your comment here... Use @username to mention someone or @TKT-#### to reference another ticket",
}: RichTextCommentEditorProps) {
  const [isInternal, setIsInternal] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [mentions, setMentions] = useState<string[]>([]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 hover:text-blue-800 underline",
        },
      }),
      Mention.configure({
        HTMLAttributes: {
          class:
            "bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-sm font-medium",
        },
        suggestion: {
          items: ({ query }) => {
            // Mock suggestions - in real app, this would fetch from API
            const users = ["admin", "sales", "product", "support"];
            const tickets = ["TKT-0001", "TKT-0002", "TKT-0003"];

            const allSuggestions = [
              ...users.map((user) => ({ id: user, label: `@${user}` })),
              ...tickets.map((ticket) => ({ id: ticket, label: `@${ticket}` })),
            ];

            return allSuggestions
              .filter((item) =>
                item.label.toLowerCase().includes(query.toLowerCase()),
              )
              .slice(0, 5);
          },
        },
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[100px] p-3",
      },
    },
    onUpdate: ({ editor }) => {
      // Extract mentions from content
      const content = editor.getHTML();
      const mentionMatches = content.match(/@[\w-]+/g) || [];
      setMentions(mentionMatches.map((mention) => mention.substring(1)));
    },
  });

  const handleSubmit = () => {
    if (!editor) return;

    const content = editor.getHTML();
    if (!content.trim() || content === "<p></p>") return;

    onSubmit(content, attachments, isInternal, mentions);

    // Reset form
    editor.commands.clearContent();
    setAttachments([]);
    setMentions([]);
    setIsInternal(false);
  };

  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleStrike = () => editor?.chain().focus().toggleStrike().run();

  const setLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  if (!editor) return null;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b pb-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleBold}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("bold") && "bg-gray-200",
            )}
          >
            <Bold className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleItalic}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("italic") && "bg-gray-200",
            )}
          >
            <Italic className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleStrike}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("strike") && "bg-gray-200",
            )}
          >
            <Strikethrough className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={setLink}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("link") && "bg-gray-200",
            )}
          >
            <LinkIcon className="w-4 h-4" />
          </Button>

          <div className="h-4 w-px bg-gray-300" />

          <label htmlFor="comment-attachment" className="cursor-pointer">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              asChild
            >
              <span>
                <Upload className="w-4 h-4" />
              </span>
            </Button>
            <input
              id="comment-attachment"
              type="file"
              multiple
              className="sr-only"
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
            />
          </label>

          <div className="flex-1" />

          <div className="text-xs text-gray-500">
            <AtSign className="w-3 h-3 inline mr-1" />
            Type @ to mention
          </div>
        </div>

        {/* Editor */}
        <div className="border rounded-md min-h-[120px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
          <EditorContent
            editor={editor}
            className="min-h-[120px]"
            placeholder={placeholder}
          />
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">
              Attachments ({attachments.length}):
            </div>
            <div className="grid grid-cols-1 gap-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAttachment(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mentions Preview */}
        {mentions.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Mentions:</div>
            <div className="flex flex-wrap gap-1">
              {mentions.map((mention, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  @{mention}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">Internal comment</span>
          </label>

          <Button
            onClick={handleSubmit}
            disabled={isLoading || !editor.getText().trim()}
          >
            <Send className="w-4 h-4 mr-2" />
            {isLoading ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
