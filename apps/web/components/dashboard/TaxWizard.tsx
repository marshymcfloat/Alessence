"use client";

import { useState } from "react";
import { INCOME_TAX_TABLE_2023, CORP_TAX_RATES } from "@/lib/data/taxTables";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { generateTaxAdvice, type TaxAdvice } from "@/lib/actions/taxActions";
import { createNoteAction } from "@/lib/actions/noteActions";
import {
  Loader2,
  Send,
  AlertTriangle,
  BookOpen,
  User,
  Scale,
  Calculator,
  Sparkles,
  PlusCircle,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Textarea } from "@/components/ui/textarea";

export default function TaxWizard() {
  // Calculator State
  const [income, setIncome] = useState<string>("");
  const [taxType, setTaxType] = useState<"individual" | "corporate">(
    "individual"
  );
  const [corpType, setCorpType] = useState<"regular" | "msme">("regular");
  const [result, setResult] = useState<{
    tax: number;
    rate: number;
    base: number;
    excess_of: number;
  } | null>(null);

  // Consultant State
  const [expertQuery, setExpertQuery] = useState("");
  const [expertResult, setExpertResult] = useState<TaxAdvice | null>(null);
  const [isExpertLoading, setIsExpertLoading] = useState(false);

  const calculateTax = () => {
    const amount = parseFloat(income.replace(/,/g, ""));
    if (isNaN(amount)) {
      setResult(null);
      return;
    }

    if (taxType === "individual") {
      // TRAIN Law 2023+ Logic
      // Find the first bracket where amount <= limit
      const targetBracketIndex = INCOME_TAX_TABLE_2023.findIndex(
        (b) => amount <= b.limit
      );

      if (targetBracketIndex === -1) {
        setResult(null);
        return;
      }

      const activeBracket = INCOME_TAX_TABLE_2023[targetBracketIndex];
      const prevBracket =
        targetBracketIndex > 0
          ? INCOME_TAX_TABLE_2023[targetBracketIndex - 1]
          : { limit: 0 };

      if (!activeBracket || !prevBracket) {
        setResult(null);
        return;
      }

      const excess = amount - prevBracket.limit;
      const tax = activeBracket.distinct + excess * activeBracket.rate;

      setResult({
        tax,
        rate: activeBracket.rate,
        base: activeBracket.distinct,
        excess_of: prevBracket.limit,
      });
    } else {
      // Corporate Tax (CREATE)
      const rate =
        corpType === "msme"
          ? CORP_TAX_RATES.CREATE.domestic.msme
          : CORP_TAX_RATES.CREATE.domestic.regular;
      setResult({
        tax: amount * rate,
        rate: rate,
        base: 0,
        excess_of: 0,
      });
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleConsultantInquiry = async () => {
    if (!expertQuery.trim()) return;

    setIsExpertLoading(true);
    setExpertResult(null);

    try {
      const response = await generateTaxAdvice(expertQuery);
      if (response.success && response.data) {
        setExpertResult(response.data);
      } else {
        toast.error(response.error || "Failed to get advice");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsExpertLoading(false);
    }
  };

  const handleSaveToNotes = async () => {
    if (!expertResult) return;

    setIsSaving(true);
    try {
      const content = `**Tax Advice Query:** ${expertQuery}\n\n**Answer:**\n${expertResult.answer}\n\n**Citations:**\n${expertResult.citations.join("\n- ")}`;

      const response = await createNoteAction({
        title: `Tax Advice: ${expertQuery.substring(0, 50)}${expertQuery.length > 50 ? "..." : ""}`,
        content: content,
        isMarkdown: true,
      });

      if (response.success) {
        toast.success("Saved to notes successfully");
      } else {
        toast.error(response.error || "Failed to save note");
      }
    } catch (error) {
      toast.error("Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6 mb-20">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-700 rounded-xl shadow-lg">
          <Calculator className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Tax Wizard
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Philippine Tax Consultant Suite
          </p>
        </div>
      </div>

      <Tabs defaultValue="calculator" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 p-1 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl">
          <TabsTrigger
            value="calculator"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
          >
            Calculator
          </TabsTrigger>
          <TabsTrigger
            value="references"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
          >
            Reference Tables
          </TabsTrigger>
          <TabsTrigger
            value="consultant"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm flex items-center gap-2"
          >
            <Scale className="w-4 h-4" />
            Ask an Expert
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="calculator"
          className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-500"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-emerald-100 dark:border-emerald-900/30 shadow-md">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-transparent dark:from-emerald-950/30">
                <CardTitle className="text-emerald-800 dark:text-emerald-400">
                  Computation
                </CardTitle>
                <CardDescription>
                  Compute tax due based on TRAIN & CREATE Laws
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Taxpayer Type</Label>
                    <Select
                      value={taxType}
                      onValueChange={(v: "individual" | "corporate") =>
                        setTaxType(v)
                      }
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">
                          Individual Citizen / Resident Alien
                        </SelectItem>
                        <SelectItem value="corporate">
                          Domestic Corporation
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {taxType === "corporate" && (
                    <div className="space-y-2 animate-in fade-in">
                      <Label>Corporate Classification (CREATE Law)</Label>
                      <Select
                        value={corpType}
                        onValueChange={(v: "regular" | "msme") =>
                          setCorpType(v)
                        }
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regular">
                            Regular (Asset &gt; 100M / Taxable Inc &gt; 5M)
                          </SelectItem>
                          <SelectItem value="msme">
                            MSME (Asset ≤ 100M & Taxable Inc ≤ 5M)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Net Taxable Income (Annual)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">
                        ₱
                      </span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="pl-7 h-11"
                        value={income}
                        onChange={(e) => setIncome(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={calculateTax}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-lg shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.01]"
                  >
                    Calculate Tax Due
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 dark:bg-slate-900 border-l-4 border-l-emerald-500 flex flex-col justify-center">
              <CardHeader>
                <CardTitle className="text-emerald-700 dark:text-emerald-400">
                  Tax Due Estimation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result ? (
                  <div className="space-y-4 animate-in zoom-in-95 duration-300">
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
                        Total Tax Due
                      </p>
                      <div className="text-4xl font-mono font-bold text-emerald-700 dark:text-emerald-300">
                        ₱
                        {result.tax.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>

                    <div className="text-sm space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Applicable Rate:
                        </span>
                        <span className="font-medium">
                          {(result.rate * 100).toFixed(0)}%
                        </span>
                      </div>
                      {taxType === "individual" && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Base Tax:
                            </span>
                            <span>₱{result.base.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              On Excess Of:
                            </span>
                            <span>₱{result.excess_of.toLocaleString()}</span>
                          </div>
                        </>
                      )}
                      {taxType === "corporate" && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Basis:</span>
                          <span>
                            CREATE Law (
                            {corpType === "msme" ? "MSME" : "Regular"})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground opacity-50">
                    <Calculator className="w-12 h-12 mb-2" />
                    <p>Enter income details to calculate</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent
          value="references"
          className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500"
        >
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Graduated Income Tax Table</CardTitle>
              <CardDescription>
                Effective January 1, 2023 (TRAIN Law)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                    <tr>
                      <th className="px-6 py-3">Annual Income Range</th>
                      <th className="px-6 py-3 text-right">Basic Tax</th>
                      <th className="px-6 py-3 text-right">Rate on Excess</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {INCOME_TAX_TABLE_2023.map((bracket, i) => {
                      const prevLimit =
                        i === 0 ? 0 : INCOME_TAX_TABLE_2023[i - 1]?.limit || 0;
                      const range =
                        i === INCOME_TAX_TABLE_2023.length - 1
                          ? `Over ₱${prevLimit.toLocaleString()}`
                          : `${i === 0 ? "Not over" : "Over ₱" + prevLimit.toLocaleString() + " to"} ₱${bracket.limit.toLocaleString()}`;

                      return (
                        <tr
                          key={i}
                          className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium">{range}</td>
                          <td className="px-6 py-4 text-right">
                            ₱{bracket.distinct.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {(bracket.rate * 100).toFixed(0)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8">
            <h3 className="font-semibold text-lg mb-4">Other Standard Rates</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border shadow-sm">
                <div className="text-xs text-muted-foreground uppercase font-bold">
                  VAT Rate
                </div>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  12%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Threshold: ₱3,000,000
                </div>
              </div>
              <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border shadow-sm">
                <div className="text-xs text-muted-foreground uppercase font-bold">
                  Corp. Standard
                </div>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  25%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  RCIT (CREATE Law)
                </div>
              </div>
              <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border shadow-sm">
                <div className="text-xs text-muted-foreground uppercase font-bold">
                  Corp. MSME
                </div>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  20%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Assets ≤ 100M
                </div>
              </div>
              <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border shadow-sm">
                <div className="text-xs text-muted-foreground uppercase font-bold">
                  EWT Range
                </div>
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  1-15%
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Professional Fees, Rentals, etc.
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="consultant"
          className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-500"
        >
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Input Side */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="h-full shadow-md flex flex-col border-emerald-100 dark:border-emerald-900/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                    <User className="w-5 h-5" />
                    Ask the Topnotcher
                  </CardTitle>
                  <CardDescription>
                    Get instant, citation-backed answers on PH Taxation Law.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                  <Textarea
                    placeholder="E.g., What is the estate tax rate under the TRAIN Law? Or help me compute the tax for..."
                    className="flex-1 min-h-[200px] resize-none text-base p-4 bg-gray-50 dark:bg-gray-900 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                    value={expertQuery}
                    onChange={(e) => setExpertQuery(e.target.value)}
                  />
                  <Button
                    onClick={handleConsultantInquiry}
                    disabled={isExpertLoading || !expertQuery.trim()}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    {isExpertLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing Statutes...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Get Legal Opinion
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Output Side */}
            <div className="lg:col-span-3">
              <Card className="h-full shadow-md bg-stone-50 dark:bg-stone-900/50 border-stone-200 dark:border-stone-800">
                {!expertResult ? (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center text-gray-400 dark:text-gray-600 min-h-[400px]">
                    <Scale className="w-16 h-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">
                      Ready for your inquiry
                    </p>
                    <p className="text-sm max-w-xs mt-2 opacity-70">
                      Our AI expert references the NIRC, TRAIN, CREATE, and EOPT
                      laws to provide precise tax advice.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col h-full animate-in fade-in duration-500">
                    <CardHeader className="border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900/50 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-md">
                            <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
                            Legal Opinion
                          </CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1.5"
                            onClick={handleSaveToNotes}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                            Save to Notes
                          </Button>
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-full border border-purple-100 dark:border-purple-800/30">
                            <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                              AI Generated
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[600px]">
                      {/* The Answer */}
                      <div className="prose prose-emerald dark:prose-invert max-w-none text-sm leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {expertResult.answer}
                        </ReactMarkdown>
                      </div>

                      {/* Citations */}
                      {expertResult.citations.length > 0 && (
                        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-4">
                          <h4 className="flex items-center gap-2 text-sm font-bold text-stone-700 dark:text-stone-300 mb-3">
                            <BookOpen className="w-4 h-4" />
                            Legal Bases
                          </h4>
                          <ul className="space-y-1">
                            {expertResult.citations.map((cite, i) => (
                              <li
                                key={i}
                                className="text-xs font-mono text-emerald-700 dark:text-emerald-400 flex items-start gap-2"
                              >
                                <span className="opacity-50">•</span>
                                {cite}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Disclaimer */}
                      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                          <span className="font-bold">Disclaimer:</span>{" "}
                          {expertResult.disclaimer}
                        </p>
                      </div>
                    </CardContent>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
