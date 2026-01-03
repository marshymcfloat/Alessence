"use client";

import { useState } from "react";
import { INCOME_TAX_TABLE_2023, CORP_TAX_RATES } from "@/lib/data/taxTables";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator } from "lucide-react";

export default function TaxWizard() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto mb-20">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Tax Wizard</h2>
          <p className="text-muted-foreground">Comprehensive Philippine Tax Suite (TRAIN & CREATE)</p>
        </div>
      </div>

      <Tabs defaultValue="calculator">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="tables">Reference Tables</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calculator">
          <TaxCalculator />
        </TabsContent>
        
        <TabsContent value="tables">
          <ReferenceTables />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TaxCalculator() {
  const [income, setIncome] = useState("");
  const [type, setType] = useState("individual"); // individual, domestic_corp
  const [corpType, setCorpType] = useState("regular"); // regular, msme
  
  const calculateTax = () => {
    const amount = parseFloat(income.replace(/,/g, ''));
    if (isNaN(amount)) return null;

    if (type === "individual") {
      // TRAIN Law 2023+
      for (let i = INCOME_TAX_TABLE_2023.length - 1; i >= 0; i--) {
        const bracket = INCOME_TAX_TABLE_2023[i];
        if (bracket && (amount > bracket.limit || (bracket.limit === 0 && amount >= 0))) {
           // Find the first bracket where amount <= limit
           const targetBracketIndex = INCOME_TAX_TABLE_2023.findIndex(b => amount <= b.limit);
           const activeBracket = INCOME_TAX_TABLE_2023[targetBracketIndex];
           
           if (!activeBracket) return null;

           const prevBracket = targetBracketIndex > 0 ? INCOME_TAX_TABLE_2023[targetBracketIndex - 1] : { limit: 0 };
           
           if (!prevBracket) return null;

           const excess = amount - prevBracket.limit;
           const tax = activeBracket.distinct + (excess * activeBracket.rate);
           
           return {
             tax,
             rate: activeBracket.rate,
             base: activeBracket.distinct,
             excess_of: prevBracket.limit
           };
        }
      }
      return null;
    } else {
      // Corporate
      const rate = corpType === "msme" ? CORP_TAX_RATES.CREATE.domestic.msme : CORP_TAX_RATES.CREATE.domestic.regular;
      return {
        tax: amount * rate,
        rate: rate,
        base: 0,
        excess_of: 0
      };
    }
  };

  const result = calculateTax();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Tax Calculator</CardTitle>
          <CardDescription>Instant computation based on current laws.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Taxpayer Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual (RC/NRC/RA/NRA-ETB)</SelectItem>
                <SelectItem value="domestic_corp">Domestic Corporation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "domestic_corp" && (
             <div className="space-y-2">
               <Label>Corporate Classification (CREATE)</Label>
               <Select value={corpType} onValueChange={setCorpType}>
                 <SelectTrigger>
                   <SelectValue />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="regular">Regular (Asset &gt; 100M / Income &gt; 5M)</SelectItem>
                   <SelectItem value="msme">MSME (Asset ≤ 100M & Income ≤ 5M)</SelectItem>
                 </SelectContent>
               </Select>
             </div>
          )}

          <div className="space-y-2">
            <Label>Net Taxable Income</Label>
            <Input 
              type="number" 
              placeholder="0.00" 
              value={income}
              onChange={(e) => setIncome(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-50 dark:bg-slate-900 border-l-4 border-l-emerald-500">
        <CardHeader>
           <CardTitle className="text-emerald-700 dark:text-emerald-400">Tax Due</CardTitle>
        </CardHeader>
        <CardContent>
           {result ? (
             <div className="space-y-4">
                <div className="text-4xl font-mono font-bold">
                  ₱{result.tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm space-y-2 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Tax Bracket Rate:</span>
                    <span className="font-medium">{(result.rate * 100).toFixed(0)}%</span>
                  </div>
                  {type === "individual" && (
                    <>
                      <div className="flex justify-between">
                        <span>Base Tax:</span>
                        <span>{result.base.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>On Excess of:</span>
                        <span>{result.excess_of.toLocaleString()}</span>
                      </div>
                    </>
                  )}
                </div>
             </div>
           ) : (
             <div className="h-full flex items-center justify-center text-muted-foreground opacity-50">
               Enter income to calculate
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReferenceTables() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Graduated Income Tax Table</CardTitle>
        <CardDescription>Effective January 1, 2023 (TRAIN Law)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
               <tr className="bg-muted border-b">
                 <th className="p-3 text-left font-medium">Annual Income</th>
                 <th className="p-3 text-right font-medium">Basic Tax</th>
                 <th className="p-3 text-right font-medium">Rate on Excess</th>
               </tr>
            </thead>
            <tbody className="divide-y">
               {INCOME_TAX_TABLE_2023.map((bracket, i) => {
                 const prevLimit = i === 0 ? 0 : (INCOME_TAX_TABLE_2023[i-1]?.limit || 0);
                 const range = i === INCOME_TAX_TABLE_2023.length - 1 
                    ? `Over ${prevLimit.toLocaleString()}`
                    : `${i===0 ? "Not over" : "Over " + prevLimit.toLocaleString() + " to"} ${bracket.limit.toLocaleString()}`;
                 
                 return (
                   <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                     <td className="p-3">{range}</td>
                     <td className="p-3 text-right">{bracket.distinct.toLocaleString()}</td>
                     <td className="p-3 text-right">{(bracket.rate * 100).toFixed(0)}%</td>
                   </tr>
                 );
               })}
            </tbody>
          </table>
        </div>
        
        <div className="mt-8 space-y-4">
           <h3 className="font-semibold text-lg">Other Standard Rates</h3>
           <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800">
                 <div className="text-sm text-muted-foreground">VAT Rate</div>
                 <div className="text-2xl font-bold">12%</div>
                 <div className="text-xs text-muted-foreground mt-1">Threshold: ₱3,000,000</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800">
                 <div className="text-sm text-muted-foreground">Corp. Standard (RCIT)</div>
                 <div className="text-2xl font-bold">25%</div>
                 <div className="text-xs text-muted-foreground mt-1">Via CREATE Law</div>
              </div>
               <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800">
                 <div className="text-sm text-muted-foreground">Corp. MSME</div>
                 <div className="text-2xl font-bold">20%</div>
                 <div className="text-xs text-muted-foreground mt-1">Assets ≤ 100M</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800">
                 <div className="text-sm text-muted-foreground">Expanded Withholding</div>
                 <div className="text-2xl font-bold">1-15%</div>
                 <div className="text-xs text-muted-foreground mt-1">Depends on specific income</div>
              </div>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
