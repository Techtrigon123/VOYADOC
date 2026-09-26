"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type ToolShellProps = {
  title: string;
  description: string;
  cta: string;
  showAdvanced?: boolean;
};

// useSearchParams() needs a Suspense boundary for static prerendering.
export default function ToolShell(props: ToolShellProps) {
  return (
    <Suspense>
      <ToolShellInner {...props} />
    </Suspense>
  );
}

function ToolShellInner({
  title,
  description,
  cta,
  showAdvanced = false,
}: {
  title: string;
  description: string;
  cta: string;
  showAdvanced?: boolean;
}) {
  const searchParams = useSearchParams();
  const tool = searchParams.get("tool") || "detect";
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [modelFocus, setModelFocus] = useState("");
  const [tone, setTone] = useState("");
  const [brandSafe, setBrandSafe] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/tools/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool,
          text,
          options: {
            modelFocus: modelFocus || undefined,
            tone: tone || undefined,
            brandSafe,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Something went wrong.");
      }

      setResult(json.data.result);
      toast.success("Done");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="h-16 flex items-center px-6 border-b border-[var(--border)] bg-white">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--primary)]">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-base text-[var(--foreground)]">
            TravelDoc<span className="text-[var(--primary)]">Pro</span>
          </span>
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{title}</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">{description}</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="input">Input text</Label>
              <Textarea
                id="input"
                placeholder="Paste or type your text here..."
                className="min-h-[220px]"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Button onClick={onSubmit} className="px-6" loading={loading}>
                {cta}
              </Button>
              <span className="text-xs text-[var(--muted-foreground)]">
                {text.length ? `${text.length} chars` : "Result will appear below"}
              </span>
            </div>

            {loading && (
              <div className="rounded-lg border border-[var(--border)] bg-white p-6 text-sm text-[var(--muted-foreground)]">
                Processing...
              </div>
            )}

            {!loading && !result && (
              <div className="rounded-lg border border-dashed border-[var(--border)] bg-slate-50 p-6 text-center text-sm text-[var(--muted-foreground)]">
                No result yet. Submit valid input to see output here.
              </div>
            )}

            {!loading && result && (
              <div className="rounded-lg border border-[var(--border)] bg-white p-6">
                <pre className="text-sm whitespace-pre-wrap text-[var(--foreground)]">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            {showAdvanced && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Model focus</Label>
                  <Input
                    id="model"
                    placeholder="e.g. ChatGPT, Claude, Gemini"
                    value={modelFocus}
                    onChange={(e) => setModelFocus(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tone">Target tone</Label>
                  <Input
                    id="tone"
                    placeholder="e.g. professional, casual, academic"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                  />
                </div>
              </div>
            )}

            {showAdvanced && (
              <div className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-white p-4">
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">Include brand-safe rewrite</p>
                  <p className="text-xs text-[var(--muted-foreground)]">Reduce marketing-style exaggeration.</p>
                </div>
                <Switch checked={brandSafe} onCheckedChange={setBrandSafe} />
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}