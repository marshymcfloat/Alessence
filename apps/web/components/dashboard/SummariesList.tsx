"use client";

import { useState, useEffect, useRef } from "react";
import {
  getAllSummaries,
  deleteSummary,
  getSummaryById,
} from "@/lib/actions/summaryActions";
import { Summary, SummaryStatusEnum } from "@repo/db";
import ReactMarkdown from "react-markdown";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { saveAs } from "file-saver";
import {
  Item,
  ItemGroup,
  ItemHeader,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemContent,
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Trash2,
  LoaderCircle,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";

type SummaryWithSubject = Summary & {
  subject: { id: number; title: string } | null;
  sourceFiles: { id: number; name: string }[];
};

export default function SummariesList() {
  const [summaries, setSummaries] = useState<SummaryWithSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSummary, setSelectedSummary] =
    useState<SummaryWithSubject | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSummaries();
  }, []);

  const loadSummaries = async () => {
    setLoading(true);
    const result = await getAllSummaries();
    if (result.success && result.data) {
      setSummaries(result.data.summaries as SummaryWithSubject[]);
    } else {
      toast.error(result.error || "Failed to load summaries");
    }
    setLoading(false);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this summary?")) {
      return;
    }

    setDeletingId(id);
    const result = await deleteSummary(id);
    setDeletingId(null);

    if (result.success) {
      toast.success("Summary deleted successfully");
      loadSummaries();
    } else {
      toast.error(result.error || "Failed to delete summary");
    }
  };

  const handleSummaryClick = async (summary: SummaryWithSubject) => {
    if (summary.status !== SummaryStatusEnum.READY) {
      toast.info("This summary is still being generated. Please wait.");
      return;
    }

    const result = await getSummaryById(summary.id);
    if (result.success && result.data) {
      setSelectedSummary(result.data.summary as SummaryWithSubject);
      setIsDialogOpen(true);
    } else {
      toast.error(result.error || "Failed to load summary");
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedSummary) {
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const markdownContent = selectedSummary.content || "";

      if (!markdownContent || !markdownContent.trim()) {
        toast.error("Summary content is empty. Cannot generate document.");
        setIsGeneratingPdf(false);
        return;
      }

      // Helper function to parse text with inline formatting (bold, italic, code)
      const parseInlineFormatting = (text: string): TextRun[] => {
        const runs: TextRun[] = [];

        // Process code blocks first (they have highest priority)
        const codeRegex = /`([^`]+)`/g;
        const parts: Array<{
          text: string;
          isCode: boolean;
          start: number;
          end: number;
        }> = [];
        let match;

        // Find all code blocks
        while ((match = codeRegex.exec(text)) !== null) {
          parts.push({
            text: match[1]!,
            isCode: true,
            start: match.index!,
            end: match.index! + match[0]!.length,
          });
        }

        // Process the text, handling code blocks and regular formatting
        let lastIndex = 0;

        parts.forEach((codePart) => {
          // Add text before code block
          if (codePart.start > lastIndex) {
            const beforeText = text.substring(lastIndex, codePart.start);
            runs.push(...parseBoldItalic(beforeText));
          }

          // Add code block
          runs.push(new TextRun({ text: codePart.text, font: "Courier New" }));
          lastIndex = codePart.end;
        });

        // Add remaining text after last code block
        if (lastIndex < text.length) {
          const remainingText = text.substring(lastIndex);
          runs.push(...parseBoldItalic(remainingText));
        }

        return runs;
      };

      // Helper to parse bold and italic (without code)
      const parseBoldItalic = (text: string): TextRun[] => {
        const runs: TextRun[] = [];

        // Process bold first (**text**)
        const boldRegex = /\*\*([^*]+)\*\*/g;
        const parts: Array<{
          text: string;
          bold: boolean;
          start: number;
          end: number;
        }> = [];
        let match;

        while ((match = boldRegex.exec(text)) !== null) {
          parts.push({
            text: match[1]!,
            bold: true,
            start: match.index!,
            end: match.index! + match[0]!.length,
          });
        }

        // If no bold, check for italic
        if (parts.length === 0) {
          const italicRegex = /\*([^*]+)\*/g;
          while ((match = italicRegex.exec(text)) !== null) {
            parts.push({
              text: match[1]!,
              bold: false,
              start: match.index!,
              end: match.index! + match[0]!.length,
            });
          }
        }

        // Build runs
        let lastIndex = 0;
        parts.forEach((part) => {
          // Add text before formatted part
          if (part.start > lastIndex) {
            const beforeText = text.substring(lastIndex, part.start);
            if (beforeText) {
              runs.push(new TextRun({ text: beforeText }));
            }
          }

          // Add formatted text
          runs.push(
            new TextRun({
              text: part.text,
              bold: part.bold,
              italics: !part.bold,
            })
          );
          lastIndex = part.end;
        });

        // Add remaining text
        if (lastIndex < text.length) {
          const remainingText = text.substring(lastIndex);
          if (remainingText) {
            runs.push(new TextRun({ text: remainingText }));
          }
        }

        // If no formatting found, return plain text
        if (runs.length === 0) {
          runs.push(new TextRun({ text }));
        }

        return runs;
      };

      // Helper function to parse markdown and convert to Word document elements
      const parseMarkdownToWord = (markdown: string): Paragraph[] => {
        const paragraphs: Paragraph[] = [];
        let inCodeBlock = false;
        let codeBlockLines: string[] = [];
        let currentParagraph: string[] = [];

        // Normalize line endings and split
        const allLines = markdown
          .replace(/\r\n/g, "\n")
          .replace(/\r/g, "\n")
          .split("\n");

        // Remove duplicate consecutive lines at the source level
        const lines: string[] = [];
        for (let i = 0; i < allLines.length; i++) {
          const line = allLines[i]!;
          const prevLine = allLines[i - 1];

          // Skip if this line is identical to the previous one (after trimming)
          if (i > 0 && line.trim() === prevLine?.trim() && line.trim() !== "") {
            continue;
          }

          lines.push(line);
        }

        const flushParagraph = () => {
          if (currentParagraph.length > 0) {
            const text = currentParagraph.join(" ").trim();
            if (text) {
              paragraphs.push(
                new Paragraph({
                  children: parseInlineFormatting(text),
                  // No manual spacing here, let styles handle it
                  alignment: AlignmentType.JUSTIFIED,
                })
              );
            }
            currentParagraph = [];
          }
        };

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]!;
          const trimmedLine = line.trim();

          // Handle code blocks
          if (trimmedLine.startsWith("```")) {
            flushParagraph();
            if (inCodeBlock) {
              // End of code block
              if (codeBlockLines.length > 0) {
                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: codeBlockLines.join("\n"),
                        font: "Courier New",
                      }),
                    ],
                    spacing: { before: 200, after: 200 },
                    shading: { fill: "F3F4F6" },
                  })
                );
              }
              codeBlockLines = [];
              inCodeBlock = false;
            } else {
              // Start of code block
              inCodeBlock = true;
            }
            continue;
          }

          if (inCodeBlock) {
            codeBlockLines.push(line);
            continue;
          }

          // Empty line - flush current paragraph
          if (!trimmedLine) {
            flushParagraph();
            continue;
          }

          // Headings - flush paragraph first
          if (trimmedLine.startsWith("# ")) {
            flushParagraph();
            const headingText = trimmedLine.substring(2).trim();
            if (headingText) {
              paragraphs.push(
                new Paragraph({
                  children: parseInlineFormatting(headingText),
                  heading: HeadingLevel.HEADING_1,
                })
              );
            }
          } else if (trimmedLine.startsWith("## ")) {
            flushParagraph();
            const headingText = trimmedLine.substring(3).trim();
            if (headingText) {
              paragraphs.push(
                new Paragraph({
                  children: parseInlineFormatting(headingText),
                  heading: HeadingLevel.HEADING_2,
                })
              );
            }
          } else if (trimmedLine.startsWith("### ")) {
            flushParagraph();
            const headingText = trimmedLine.substring(4).trim();
            if (headingText) {
              paragraphs.push(
                new Paragraph({
                  children: parseInlineFormatting(headingText),
                  heading: HeadingLevel.HEADING_3,
                })
              );
            }
          } else if (trimmedLine.startsWith("#### ")) {
            flushParagraph();
            const headingText = trimmedLine.substring(5).trim();
            if (headingText) {
              paragraphs.push(
                new Paragraph({
                  children: parseInlineFormatting(headingText),
                  heading: HeadingLevel.HEADING_4,
                })
              );
            }
          } else if (trimmedLine.startsWith("> ")) {
            // Blockquote - flush paragraph first
            flushParagraph();
            const quoteText = trimmedLine.substring(2).trim();
            if (quoteText) {
              paragraphs.push(
                new Paragraph({
                  children: parseInlineFormatting(quoteText),
                  spacing: { before: 200, after: 200 },
                  indent: { left: 400 },
                  border: {
                    left: {
                      color: "000000",
                      size: 4,
                      style: "single",
                    },
                  },
                })
              );
            }
          } else if (
            trimmedLine.startsWith("- ") ||
            trimmedLine.startsWith("* ")
          ) {
            // Bullet points - flush paragraph first
            flushParagraph();
            const text = trimmedLine.substring(2).trim();
            if (text) {
              paragraphs.push(
                new Paragraph({
                  children: parseInlineFormatting(text),
                  bullet: { level: 0 },
                  // Standard Word lists handle their own spacing well, but we can nudge it
                  spacing: { after: 100 },
                })
              );
            }
          } else if (/^\d+\.\s/.test(trimmedLine)) {
            // Numbered list - flush paragraph first
            flushParagraph();
            const text = trimmedLine.replace(/^\d+\.\s/, "").trim();
            if (text) {
              paragraphs.push(
                new Paragraph({
                  children: parseInlineFormatting(text),
                  numbering: { reference: "default-numbering", level: 0 },
                  spacing: { after: 100 },
                })
              );
            }
          } else {
            // Regular paragraph text - accumulate lines
            currentParagraph.push(trimmedLine);
          }
        }

        // Flush any remaining paragraph
        flushParagraph();

        // Handle any remaining code block
        if (inCodeBlock && codeBlockLines.length > 0) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: codeBlockLines.join("\n"),
                  font: "Courier New",
                }),
              ],
              spacing: { before: 200, after: 200 },
              shading: { fill: "F3F4F6" },
            })
          );
        }

        // Remove duplicate consecutive paragraphs
        if (paragraphs.length === 0) {
          return paragraphs;
        }

        const deduplicated: Paragraph[] = [paragraphs[0]!]; // Always include first paragraph

        // Helper to extract text from a Paragraph object safely
        const getParagraphText = (para: any): string => {
          try {
            if (para.children && Array.isArray(para.children)) {
              return para.children
                .map((child: any) => {
                  if (child && typeof child === "object" && "text" in child) {
                    return child.text || "";
                  }
                  return "";
                })
                .join("");
            } else if (para.text) {
              return para.text;
            }
          } catch {
            return "";
          }
          return "";
        };

        let lastText = getParagraphText(paragraphs[0]);

        for (let i = 1; i < paragraphs.length; i++) {
          const current = paragraphs[i]!;
          const currentText = getParagraphText(current);
          const trimmedText = currentText.trim();

          // Only skip if this paragraph is EXACTLY identical to the previous one
          if (
            trimmedText &&
            trimmedText === lastText &&
            trimmedText.length > 10
          ) {
            continue;
          }

          // Always include the paragraph
          deduplicated.push(current);
          lastText = trimmedText;
        }

        return deduplicated;
      };

      // Create document sections
      const children: Paragraph[] = [];

      // Title
      children.push(
        new Paragraph({
          text:
            selectedSummary.title || selectedSummary.description || "Summary",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        })
      );

      // Metadata
      if (selectedSummary.subject) {
        children.push(
          new Paragraph({
            text: `Subject: ${selectedSummary.subject.title}`,
            spacing: { after: 100 },
            alignment: AlignmentType.CENTER,
            // Override style for metadata if needed, or leave as Normal
          })
        );
      }

      if (
        selectedSummary.sourceFiles &&
        selectedSummary.sourceFiles.length > 0
      ) {
        const sourcesText = `Source${selectedSummary.sourceFiles.length > 1 ? "s" : ""}: ${selectedSummary.sourceFiles.map((f) => f.name).join(", ")}`;
        children.push(
          new Paragraph({
            text: sourcesText,
            spacing: { after: 300 },
            alignment: AlignmentType.CENTER,
          })
        );
      }

      // Separator
      children.push(new Paragraph({ text: "", spacing: { after: 200 } }));

      // Content
      const contentParagraphs = parseMarkdownToWord(markdownContent);

      if (contentParagraphs.length === 0) {
        // Fallback: if parsing fails, add content as plain text paragraphs
        const lines = markdownContent
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        lines.forEach((line) => {
          children.push(
            new Paragraph({
              children: parseInlineFormatting(line),
              alignment: AlignmentType.JUSTIFIED,
            })
          );
        });
      } else {
        children.push(...contentParagraphs);
      }

      // Create document with explicit styles
      const doc = new Document({
        styles: {
          paragraphStyles: [
            {
              id: "Normal",
              name: "Normal",
              run: {
                font: "Arial",
                size: 22, // 11pt
                color: "000000",
              },
              paragraph: {
                spacing: {
                  line: 276, // 1.15 lines
                  after: 200, // 10pt after
                },
              },
            },
            {
              id: "Heading1",
              name: "Heading 1",
              basedOn: "Normal",
              next: "Normal",
              quickFormat: true,
              run: {
                font: "Arial",
                size: 32, // 16pt
                bold: true,
                color: "000000",
              },
              paragraph: {
                spacing: {
                  before: 240,
                  after: 120,
                },
              },
            },
            {
              id: "Heading2",
              name: "Heading 2",
              basedOn: "Normal",
              next: "Normal",
              quickFormat: true,
              run: {
                font: "Arial",
                size: 28, // 14pt
                bold: true,
                color: "000000",
              },
              paragraph: {
                spacing: {
                  before: 240,
                  after: 120,
                },
              },
            },
            {
              id: "Heading3",
              name: "Heading 3",
              basedOn: "Normal",
              next: "Normal",
              quickFormat: true,
              run: {
                font: "Arial",
                size: 24, // 12pt
                bold: true,
                color: "000000",
              },
              paragraph: {
                spacing: {
                  before: 200,
                  after: 100,
                },
              },
            },
          ],
        },
        sections: [
          {
            properties: {},
            children: children,
          },
        ],
      });

      // Generate and download
      const blob = await Packer.toBlob(doc);
      const fileName = `${(selectedSummary.title || "summary").replace(/[^a-z0-9]/gi, "_").toLowerCase()}.docx`;
      saveAs(blob, fileName);
      toast.success("Word document downloaded successfully!");
    } catch (error) {
      console.error("Error generating Word document:", error);
      toast.error("Failed to generate Word document. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const getStatusBadge = (status: SummaryStatusEnum) => {
    switch (status) {
      case SummaryStatusEnum.READY:
        return (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 className="size-3" />
            Ready
          </span>
        );
      case SummaryStatusEnum.GENERATING:
        return (
          <span className="flex items-center gap-1 text-xs text-yellow-600">
            <Clock className="size-3" />
            Generating
          </span>
        );
      case SummaryStatusEnum.FAILED:
        return (
          <span className="flex items-center gap-1 text-xs text-red-600">
            <XCircle className="size-3" />
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="rounded-lg mx-auto border border-gray-200 dark:border-gray-800 w-full flex-1 !p-12 bg-white dark:bg-slate-900/50">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText className="!w-12 !h-12 text-gray-400 dark:text-gray-500" />
            </EmptyMedia>
            <EmptyTitle className="!text-lg">No summaries yet</EmptyTitle>
            <EmptyDescription className="!text-sm">
              Create your first summary to get started with document summaries.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="rounded-lg mx-auto border border-gray-200 dark:border-gray-800 w-full !p-6 bg-white dark:bg-slate-900/50">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {summaries.map((summary) => (
          <Item
            key={summary.id}
            variant="outline"
            className={`!cursor-pointer !transition-all !duration-200 !rounded-lg !p-4 !border-2 ${
              summary.status === SummaryStatusEnum.READY
                ? "!hover:border-primary !hover:shadow-md !border-gray-200 dark:!border-gray-700"
                : "!opacity-60 !border-gray-200 dark:!border-gray-700"
            } !bg-white dark:!bg-slate-800/50`}
            onClick={() => handleSummaryClick(summary)}
          >
            <ItemHeader className="!space-y-3">
              <ItemContent className="!space-y-2">
                <ItemTitle className="!flex !items-start !justify-between !gap-3 !text-base !font-semibold">
                  <span className="flex-1 line-clamp-2">
                    {summary.title || summary.description}
                  </span>
                  {getStatusBadge(summary.status)}
                </ItemTitle>
                <ItemDescription className="text-sm! text-gray-600! dark:text-gray-400!">
                  {summary.subject && (
                    <>
                      <span className="font-medium">
                        {summary.subject.title}
                      </span>
                      {summary.sourceFiles &&
                        summary.sourceFiles.length > 0 && (
                          <span className="mx-2">•</span>
                        )}
                    </>
                  )}
                  {summary.sourceFiles && summary.sourceFiles.length > 0 ? (
                    <span>
                      {summary.sourceFiles.length} source
                      {summary.sourceFiles.length > 1 ? "s" : ""}
                    </span>
                  ) : (
                    !summary.subject && <span>No source files</span>
                  )}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleDelete(summary.id, e)}
                  disabled={deletingId === summary.id}
                  className="h-8! w-8! text-destructive! hover:text-destructive! hover:bg-destructive/10!"
                >
                  {deletingId === summary.id ? (
                    <LoaderCircle className="size-4! animate-spin!" />
                  ) : (
                    <Trash2 className="size-4!" />
                  )}
                </Button>
              </ItemActions>
            </ItemHeader>
          </Item>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[8.5in]! w-[90vw]! max-h-[95vh]! overflow-y-auto! p-8! md:p-12!">
          <DialogHeader className="mb-6!">
            <DialogTitle className="text-2xl! md:text-3xl! mb-2! font-bold!">
              {selectedSummary?.title || selectedSummary?.description}
            </DialogTitle>
            <DialogDescription className="text-sm! md:text-base! mt-2!">
              {selectedSummary?.subject && (
                <>
                  Subject:{" "}
                  <span className="font-medium">
                    {selectedSummary.subject.title}
                  </span>
                  {selectedSummary?.sourceFiles &&
                    selectedSummary.sourceFiles.length > 0 && (
                      <span className="mx-2">•</span>
                    )}
                </>
              )}
              {selectedSummary?.sourceFiles &&
                selectedSummary.sourceFiles.length > 0 && (
                  <>
                    <span className="font-medium">
                      {selectedSummary.sourceFiles.length} source
                      {selectedSummary.sourceFiles.length > 1 ? "s" : ""}
                    </span>
                  </>
                )}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6!" ref={contentRef}>
            <div
              className="prose prose-slate dark:prose-invert max-w-none 
              prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-gray-100 
              prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:mb-5 prose-p:leading-8 prose-p:text-base
              prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-strong:font-semibold
              prose-ul:list-disc prose-ul:my-5 prose-ul:pl-6 prose-ul:space-y-2
              prose-ol:list-decimal prose-ol:my-5 prose-ol:pl-6 prose-ol:space-y-2
              prose-li:my-2 prose-li:leading-7 prose-li:text-base
              prose-h1:text-3xl prose-h1:mt-10 prose-h1:mb-7 prose-h1:font-bold prose-h1:leading-tight
              prose-h2:text-2xl prose-h2:mt-9 prose-h2:mb-6 prose-h2:font-semibold prose-h2:leading-tight
              prose-h3:text-xl prose-h3:mt-7 prose-h3:mb-5 prose-h3:font-semibold prose-h3:leading-tight
              prose-h4:text-lg prose-h4:mt-6 prose-h4:mb-4 prose-h4:font-semibold prose-h4:leading-tight
              prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-blockquote:pl-5 prose-blockquote:italic prose-blockquote:my-6 prose-blockquote:text-gray-600 dark:prose-blockquote:text-gray-400
              prose-code:text-sm prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono
              prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:p-5 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:my-6
              prose-hr:my-10 prose-hr:border-gray-300 dark:prose-hr:border-gray-600
              prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:underline hover:prose-a:text-blue-800 dark:hover:prose-a:text-blue-300"
            >
              <ReactMarkdown>{selectedSummary?.content || ""}</ReactMarkdown>
            </div>
          </div>

          <div
            className="fixed -left-[9999px] -top-[9999px] opacity-0 pointer-events-none"
            ref={pdfContentRef}
            style={{
              backgroundColor: "#ffffff",
              color: "#374151",
              width: "8.5in",
              padding: "2rem",
              all: "initial",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            <style>{`
              .pdf-prose {
                all: initial;
                display: block;
                max-width: 100%;
                color: #374151 !important;
                font-family: system-ui, -apple-system, sans-serif !important;
                background-color: #ffffff !important;
              }
              .pdf-prose * {
                all: revert;
                color: inherit;
              }
              .pdf-prose h1 {
                font-size: 1.875rem !important;
                font-weight: 700 !important;
                margin-top: 2.5rem !important;
                margin-bottom: 1.75rem !important;
                line-height: 1.2 !important;
                color: #111827 !important;
                background-color: transparent !important;
              }
              .pdf-prose h2 {
                font-size: 1.5rem !important;
                font-weight: 600 !important;
                margin-top: 2.25rem !important;
                margin-bottom: 1.5rem !important;
                line-height: 1.3 !important;
                color: #111827 !important;
                background-color: transparent !important;
              }
              .pdf-prose h3 {
                font-size: 1.25rem !important;
                font-weight: 600 !important;
                margin-top: 1.75rem !important;
                margin-bottom: 1.25rem !important;
                line-height: 1.4 !important;
                color: #111827 !important;
                background-color: transparent !important;
              }
              .pdf-prose h4 {
                font-size: 1.125rem !important;
                font-weight: 600 !important;
                margin-top: 1.5rem !important;
                margin-bottom: 1rem !important;
                line-height: 1.4 !important;
                color: #111827 !important;
                background-color: transparent !important;
              }
              .pdf-prose p {
                color: #374151 !important;
                margin-bottom: 1.25rem !important;
                line-height: 2 !important;
                font-size: 1rem !important;
                background-color: transparent !important;
              }
              .pdf-prose strong {
                color: #111827 !important;
                font-weight: 600 !important;
                background-color: transparent !important;
              }
              .pdf-prose ul {
                list-style-type: disc !important;
                margin: 1.25rem 0 !important;
                padding-left: 1.5rem !important;
                background-color: transparent !important;
              }
              .pdf-prose ul li {
                margin: 0.5rem 0 !important;
                line-height: 1.75 !important;
                font-size: 1rem !important;
                color: #374151 !important;
                background-color: transparent !important;
              }
              .pdf-prose ol {
                list-style-type: decimal !important;
                margin: 1.25rem 0 !important;
                padding-left: 1.5rem !important;
                background-color: transparent !important;
              }
              .pdf-prose ol li {
                margin: 0.5rem 0 !important;
                line-height: 1.75 !important;
                font-size: 1rem !important;
                color: #374151 !important;
                background-color: transparent !important;
              }
              .pdf-prose blockquote {
                border-left: 4px solid #d1d5db !important;
                padding-left: 1.25rem !important;
                font-style: italic !important;
                margin: 1.5rem 0 !important;
                color: #4b5563 !important;
                background-color: transparent !important;
              }
              .pdf-prose code {
                font-size: 0.875rem !important;
                background-color: #f3f4f6 !important;
                padding: 0.125rem 0.375rem !important;
                border-radius: 0.25rem !important;
                font-family: monospace !important;
                color: #1f2937 !important;
              }
              .pdf-prose pre {
                background-color: #f3f4f6 !important;
                padding: 1.25rem !important;
                border-radius: 0.5rem !important;
                overflow-x: auto !important;
                margin: 1.5rem 0 !important;
              }
              .pdf-prose pre code {
                background-color: transparent !important;
                padding: 0 !important;
              }
              .pdf-prose hr {
                margin: 2.5rem 0 !important;
                border-color: #d1d5db !important;
                border-style: solid !important;
                border-width: 1px 0 0 0 !important;
                background-color: transparent !important;
              }
              .pdf-prose a {
                color: #2563eb !important;
                text-decoration: underline !important;
                background-color: transparent !important;
              }
            `}</style>
            <div className="pdf-prose">
              <ReactMarkdown>{selectedSummary?.content || ""}</ReactMarkdown>
            </div>
          </div>

          <div className="flex justify-between items-center !mt-8 !pt-6 !border-t">
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf || !selectedSummary?.content}
              className="!h-11 !px-6"
            >
              {isGeneratingPdf ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Generating Document...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download as Word
                </>
              )}
            </Button>
            <Button
              onClick={() => setIsDialogOpen(false)}
              className="!h-11 !px-6 !font-semibold"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
