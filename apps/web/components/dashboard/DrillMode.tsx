"use client";

import { useState } from "react";
import { generateMathDrill, generateAuditDrill, MathProblem, AuditProblem } from "@/lib/actions/drillActions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Calculator, CheckCircle2, XCircle, Lightbulb, FileSearch } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DrillMode() {
  const [mode, setMode] = useState<"math" | "audit">("math");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>("MEDIUM");
  const [context, setContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [mathProblem, setMathProblem] = useState<MathProblem | null>(null);
  const [auditProblem, setAuditProblem] = useState<AuditProblem | null>(null);
  
  const [userAnswer, setUserAnswer] = useState("");
  const [showSolution, setShowSolution] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleGenerate = async () => {
    if (!topic) {
      toast.error("Please enter a topic");
      return;
    }

    setIsLoading(true);
    setMathProblem(null);
    setAuditProblem(null);
    setShowSolution(false);
    setIsCorrect(null);
    setUserAnswer("");

    if (mode === "math") {
      const result = await generateMathDrill({
        topic,
        difficulty,
        context: context || undefined,
      });

      if (result.success && result.data) {
        setMathProblem(result.data);
      } else {
        toast.error(result.error || "Failed to generate problem");
      }
    } else {
      const result = await generateAuditDrill({
        topic,
        difficulty,
        context: context || undefined,
      });

      if (result.success && result.data) {
        setAuditProblem(result.data);
      } else {
        toast.error(result.error || "Failed to generate problem");
      }
    }

    setIsLoading(false);
  };

  const checkAnswer = () => {
    if (!userAnswer) return;
    
    // Simple check: remove non-numeric chars (except decimal) and compare
    const normalize = (val: string) => val.replace(/[^\d.-]/g, '');
    const userVal = parseFloat(normalize(userAnswer));
    
    let correctVal = NaN;
    if (mathProblem) correctVal = parseFloat(normalize(mathProblem.answer));
    if (auditProblem) correctVal = parseFloat(normalize(auditProblem.finalAnswer));

    if (!isNaN(userVal) && !isNaN(correctVal) && Math.abs(userVal - correctVal) < 0.01) {
      setIsCorrect(true);
      setShowSolution(true);
      toast.success("Correct! Great job.");
    } else {
      setIsCorrect(false);
      toast.error("Incorrect. Try again or reveal the solution.");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calculator className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Accounting Drills</h2>
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "math" | "audit")} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="math">Variable Math</TabsTrigger>
            <TabsTrigger value="audit">Step-by-Step Audit</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Topic</Label>
            <Input 
              placeholder={mode === "math" ? "e.g., Corporate Income Tax" : "e.g., Audit of Cash"}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label>Context (Optional)</Label>
            <Textarea 
              placeholder="Paste relevant laws, rates, or notes here..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>
        </div>

        <Button 
          className="w-full mt-6" 
          onClick={handleGenerate} 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Problem...
            </>
          ) : (
            "Generate Problem"
          )}
        </Button>
      </Card>

      <AnimatePresence>
        {(mathProblem || auditProblem) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Problem Scenario</h3>
                <div className="p-4 bg-muted/50 rounded-lg whitespace-pre-wrap font-medium">
                  {mathProblem?.problem || auditProblem?.problem}
                </div>
                
                {auditProblem && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Given Information:</Label>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {auditProblem.given.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Label>Your Answer</Label>
                <div className="flex gap-4">
                  <Input 
                    placeholder="Enter numerical answer..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    className={isCorrect === true ? "border-green-500" : isCorrect === false ? "border-red-500" : ""}
                  />
                  <Button onClick={checkAnswer}>Submit</Button>
                </div>
              </div>

              {showSolution ? (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-4 pt-4 border-t"
                >
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <h4 className="font-semibold">Solution</h4>
                  </div>
                  
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg space-y-4">
                    <div className="flex justify-between items-center border-b border-green-200 dark:border-green-800 pb-2">
                      <span className="font-semibold">Correct Answer:</span>
                      <span className="text-xl font-bold">
                        {mathProblem?.answer || auditProblem?.finalAnswer}
                      </span>
                    </div>
                    
                    {mathProblem && (
                      <>
                        <div className="space-y-2">
                          <h5 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" /> Explanation
                          </h5>
                          <p className="text-sm">{mathProblem.explanation}</p>
                        </div>
                        <div className="space-y-2">
                          <h5 className="font-medium text-sm text-muted-foreground">Step-by-Step Computation</h5>
                          <div className="whitespace-pre-wrap text-sm font-mono bg-white dark:bg-black/20 p-3 rounded border">
                            {mathProblem.solution}
                          </div>
                        </div>
                      </>
                    )}

                    {auditProblem && (
                      <>
                        <div className="space-y-2">
                          <h5 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                            <FileSearch className="w-4 h-4" /> Audit Trace
                          </h5>
                          <div className="space-y-3">
                            {auditProblem.steps.map((step) => (
                              <div key={step.step} className="text-sm bg-white dark:bg-black/20 p-3 rounded border">
                                <div className="font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                                  Step {step.step}: {step.description}
                                </div>
                                <div className="font-mono text-xs">{step.computation}</div>
                                <div className="text-right font-bold mt-1">= {step.result}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h5 className="font-medium text-sm text-muted-foreground">Audit Notes</h5>
                          <p className="text-sm italic text-muted-foreground">{auditProblem.auditNote}</p>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="pt-2">
                  <Button variant="ghost" onClick={() => setShowSolution(true)} className="text-muted-foreground w-full">
                    Give up? Show Solution
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

