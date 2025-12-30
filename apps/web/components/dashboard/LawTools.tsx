"use client";

import { useState } from "react";
import { generateCaseDigest, generateCodalFlashcards } from "@/lib/actions/lawActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BookOpen, FileText, Download, Copy, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function LawTools() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Philippine Law Engine</h2>
          <p className="text-muted-foreground">Specialized tools for law students and reviewees</p>
        </div>
      </div>

      <Tabs defaultValue="digest">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="digest">Case Digest Generator</TabsTrigger>
          <TabsTrigger value="flashcards">Codal Flashcards</TabsTrigger>
        </TabsList>
        
        <TabsContent value="digest">
          <CaseDigestGenerator />
        </TabsContent>
        
        <TabsContent value="flashcards">
          <CodalFlashcardsGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CaseDigestGenerator() {
  const [caseText, setCaseText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [digest, setDigest] = useState<any | null>(null);

  const handleGenerate = async () => {
    if (!caseText || caseText.length < 50) {
      toast.error("Please enter the full text of the case");
      return;
    }

    setIsLoading(true);
    setDigest(null);

    const result = await generateCaseDigest(caseText);

    setIsLoading(false);

    if (result.success && result.data) {
      setDigest(result.data);
      toast.success("Case digest generated successfully!");
    } else {
      toast.error(result.error || "Failed to generate digest");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Input Case Text</CardTitle>
          <CardDescription>Paste the full text of the jurisprudence here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            placeholder="Paste full case text here..." 
            className="min-h-[400px] font-mono text-xs"
            value={caseText}
            onChange={(e) => setCaseText(e.target.value)}
          />
          <Button 
            className="w-full" 
            onClick={handleGenerate}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Digest...
              </>
            ) : (
              "Generate Digest"
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <AnimatePresence>
          {digest && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <Card>
                <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{digest.title}</h3>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mt-1">{digest.citation}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(digest, null, 2));
                      toast.success("Copied to clipboard");
                    }}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Facts</h4>
                    <p className="text-sm leading-relaxed">{digest.facts}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Issues</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {digest.issues.map((issue: string, i: number) => (
                        <li key={i} className="text-sm font-medium">{issue}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Ruling</h4>
                    <p className="text-sm font-bold">{digest.ruling}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Ratio Decidendi</h4>
                    <p className="text-sm leading-relaxed">{digest.ratio}</p>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400 mb-2">Doctrine</h4>
                    <p className="text-sm italic font-medium">{digest.doctrine}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!digest && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl text-muted-foreground">
            <FileText className="w-12 h-12 mb-4 opacity-20" />
            <p>Generated digest will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Separate component for the Flip Card to manage individual state
function FlipFlashcard({ card }: { card: { front: string; back: string; category: string } }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="relative h-[300px] w-full cursor-pointer perspective-1000 group"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="w-full h-full relative preserve-3d transition-all"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front Face */}
        <Card className="absolute inset-0 backface-hidden w-full h-full flex flex-col justify-between border-2 hover:border-purple-300 dark:hover:border-purple-700 transition-colors bg-white dark:bg-slate-950">
          <div className="absolute top-4 right-4 z-10">
            <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider bg-purple-50 dark:bg-purple-900/30 border border-purple-100 dark:border-purple-800 rounded-full px-2 py-1">
              {card.category}
            </span>
          </div>
          <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Question
            </h4>
            <p className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-snug">
              {card.front}
            </p>
          </CardContent>
          <div className="p-4 text-center border-t bg-slate-50 dark:bg-slate-900/50">
            <span className="text-xs text-muted-foreground flex items-center justify-center gap-2">
              <RotateCcw className="w-3 h-3" /> Click to flip
            </span>
          </div>
        </Card>

        {/* Back Face */}
        <Card 
          className="absolute inset-0 backface-hidden w-full h-full flex flex-col border-2 border-purple-200 dark:border-purple-800 bg-purple-50/10 dark:bg-slate-900"
          style={{ transform: "rotateY(180deg)" }}
        >
          <CardContent className="flex flex-col h-full p-8 overflow-y-auto">
             <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-4 text-center shrink-0">
              Answer
            </h4>
            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed grow flex flex-col justify-center">
              <ReactMarkdown>{card.back}</ReactMarkdown>
            </div>
          </CardContent>
          <div className="p-4 text-center border-t bg-purple-100/20 dark:bg-purple-900/20 shrink-0">
             <span className="text-xs text-purple-600/70 dark:text-purple-400/70 font-medium">
               Click to flip back
            </span>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

function CodalFlashcardsGenerator() {
  const [articleText, setArticleText] = useState("");
  const [lawName, setLawName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<any[]>([]);

  const handleGenerate = async () => {
    if (!articleText || articleText.length < 20) {
      toast.error("Please enter the legal provision text");
      return;
    }

    setIsLoading(true);
    setFlashcards([]);

    const result = await generateCodalFlashcards(articleText, lawName || undefined);

    setIsLoading(false);

    if (result.success && result.data?.flashcards) {
      setFlashcards(result.data.flashcards);
      toast.success(`Generated ${result.data.flashcards.length} flashcards!`);
    } else {
      toast.error(result.error || "Failed to generate flashcards");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Input Legal Provision</CardTitle>
          <CardDescription>Paste an Article from the Civil Code, RPC, or any law.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Law Name (Optional)</Label>
            <input 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="e.g., Civil Code of the Philippines"
              value={lawName}
              onChange={(e) => setLawName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Provision Text</Label>
            <Textarea 
              placeholder="Paste Article text here..." 
              className="min-h-[300px]"
              value={articleText}
              onChange={(e) => setArticleText(e.target.value)}
            />
          </div>
          <Button 
            className="w-full" 
            onClick={handleGenerate}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Flashcards...
              </>
            ) : (
              "Generate Flashcards"
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div className="grid gap-6">
          <AnimatePresence>
            {flashcards.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <FlipFlashcard card={card} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {flashcards.length === 0 && !isLoading && (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl text-muted-foreground bg-slate-50/50 dark:bg-slate-900/50">
            <Copy className="w-12 h-12 mb-4 opacity-20" />
            <p>Generated flashcards will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}
