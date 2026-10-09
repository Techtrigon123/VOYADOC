"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Eraser, ImagePlus, Loader2, PenLine, Square, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/agent/client";
import { Field, Modal, TextArea, TextInput, primaryBtn, secondaryBtn } from "@/components/agent/ui";

type Tool = "box" | "pen";
type Shape = { tool: "box"; x: number; y: number; w: number; h: number } | { tool: "pen"; points: [number, number][] };

/** Screenshots are scaled down to this width before upload (keeps them well under the 2.5 MB cap). */
const MAX_WIDTH = 1600;
const MARK_COLOR = "#e63946";

async function captureScreen(): Promise<HTMLImageElement> {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { displaySurface: "browser" },
    audio: false,
    // Chrome: offer "this tab" first and let the agent pick it.
    preferCurrentTab: true,
    selfBrowserSurface: "include",
  } as DisplayMediaStreamOptions);
  try {
    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    await video.play();
    await new Promise((r) => setTimeout(r, 250)); // let the first real frame arrive
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    return await loadImage(canvas.toDataURL("image/png"));
  } finally {
    stream.getTracks().forEach((t) => t.stop());
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = src;
  });
}

function drawShapes(ctx: CanvasRenderingContext2D, shapes: Shape[], scale: number) {
  ctx.strokeStyle = MARK_COLOR;
  ctx.lineWidth = Math.max(3, 4 / scale);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const s of shapes) {
    ctx.beginPath();
    if (s.tool === "box") {
      ctx.fillStyle = "rgba(230, 57, 70, 0.12)";
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeRect(s.x, s.y, s.w, s.h);
    } else if (s.points.length) {
      ctx.moveTo(...s.points[0]);
      for (const p of s.points.slice(1)) ctx.lineTo(...p);
      ctx.stroke();
    }
  }
}

export default function BugReportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [tool, setTool] = useState<Tool>("box");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [capturing, setCapturing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<{ id: string; number: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<Shape | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const canCapture = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia;

  const reset = () => {
    setImage(null);
    setShapes([]);
    setTitle("");
    setDescription("");
    setSent(null);
    setTool("box");
  };

  const render = useCallback(
    (extra?: Shape | null) => {
      const canvas = canvasRef.current;
      if (!canvas || !image) return;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const scale = canvas.clientWidth / canvas.width || 1;
      drawShapes(ctx, extra ? [...shapes, extra] : shapes, scale);
    },
    [image, shapes]
  );

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const ratio = Math.min(1, MAX_WIDTH / image.naturalWidth);
    canvasRef.current.width = Math.round(image.naturalWidth * ratio);
    canvasRef.current.height = Math.round(image.naturalHeight * ratio);
    render();
  }, [image, render]);

  const toCanvas = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * c.width, ((e.clientY - r.top) / r.height) * c.height];
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const [x, y] = toCanvas(e);
    drawing.current = tool === "box" ? { tool: "box", x, y, w: 0, h: 0 } : { tool: "pen", points: [[x, y]] };
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drawing.current;
    if (!d) return;
    const [x, y] = toCanvas(e);
    if (d.tool === "box") {
      d.w = x - d.x;
      d.h = y - d.y;
    } else d.points.push([x, y]);
    render(d);
  };
  const onUp = () => {
    const d = drawing.current;
    drawing.current = null;
    if (!d) return;
    if (d.tool === "box" && (Math.abs(d.w) < 6 || Math.abs(d.h) < 6)) return render();
    setShapes((s) => [...s, d.tool === "box" ? { ...d, x: Math.min(d.x, d.x + d.w), y: Math.min(d.y, d.y + d.h), w: Math.abs(d.w), h: Math.abs(d.h) } : d]);
  };

  const capture = async () => {
    // Hide the dialog while the screen is captured, so the screenshot shows the page itself.
    setCapturing(true);
    await new Promise((r) => setTimeout(r, 350));
    try {
      setImage(await captureScreen());
      setShapes([]);
    } catch (err) {
      if ((err as Error).name !== "NotAllowedError") toast.error("Could not capture the screen. Try uploading a screenshot instead.");
    } finally {
      setCapturing(false);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return toast.error("Choose a PNG, JPEG or WebP image.");
    if (file.size > 10 * 1024 * 1024) return toast.error("That image is larger than 10 MB.");
    const url = await new Promise<string>((res) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.readAsDataURL(file);
    });
    try {
      setImage(await loadImage(url));
      setShapes([]);
    } catch {
      toast.error("Could not read that image.");
    }
  };

  const submit = async () => {
    if (title.trim().length < 3) return toast.error("Give the bug a short title.");
    if (description.trim().length < 10) return toast.error("Tell us what went wrong (at least 10 characters).");
    setBusy(true);
    const screenshot = image && canvasRef.current ? canvasRef.current.toDataURL("image/jpeg", 0.85) : undefined;
    const r = await api<{ id: string; number: number }>("/api/agent/support/bugs", {
      method: "POST",
      json: {
        title,
        description,
        screenshot,
        context: { url: window.location.pathname, viewport: `${window.innerWidth}×${window.innerHeight}`, userAgent: navigator.userAgent },
      },
    });
    setBusy(false);
    if (!r.success || !r.data) return toast.error(r.error?.message ?? "Could not send the bug report.");
    toast.success(r.message ?? "Bug report sent.");
    setSent(r.data);
  };

  const close = (v: boolean) => {
    onOpenChange(v);
    if (!v) window.setTimeout(reset, 200);
  };

  return (
    <Modal open={open && !capturing} onOpenChange={close} title={sent ? "Thanks for the report" : "Report a bug"} description={sent ? undefined : "Grab a screenshot, mark the problem, and we'll open a ticket for you."} size="lg">
      {sent ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-slate-600">
            Bug report <span className="font-semibold text-black">#{sent.number}</span> is with our team. You&apos;ll see replies under Support tickets.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/dashboard/support/tickets/${sent.id}`} onClick={() => close(false)} className={primaryBtn}>
              View ticket
            </Link>
            <button type="button" onClick={() => close(false)} className={secondaryBtn}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {image ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs font-medium text-slate-500">Mark the problem:</span>
                {(
                  [
                    ["box", Square, "Box"],
                    ["pen", PenLine, "Draw"],
                  ] as const
                ).map(([t, Icon, label]) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTool(t)}
                    aria-pressed={tool === t}
                    className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold", tool === t ? "border-brand-500 bg-brand-50 text-brand-600" : "border-slate-200 text-slate-600 hover:border-slate-300")}
                  >
                    <Icon className="h-3.5 w-3.5" /> {label}
                  </button>
                ))}
                <button type="button" onClick={() => setShapes((s) => s.slice(0, -1))} disabled={!shapes.length} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 disabled:opacity-40">
                  <Undo2 className="h-3.5 w-3.5" /> Undo
                </button>
                <button type="button" onClick={() => setShapes([])} disabled={!shapes.length} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 disabled:opacity-40">
                  <Eraser className="h-3.5 w-3.5" /> Clear
                </button>
                <button type="button" onClick={() => setImage(null)} className="ml-auto text-xs font-semibold text-slate-500 hover:text-brand-600">
                  Remove screenshot
                </button>
              </div>
              <canvas
                ref={canvasRef}
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                className="block max-h-[45vh] w-full cursor-crosshair touch-none rounded-xl border border-slate-200 object-contain"
                aria-label="Screenshot — drag to mark the problem"
              />
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {canCapture ? (
                <button type="button" onClick={capture} className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-black hover:border-brand-300">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                    <Camera className="h-5 w-5" />
                  </span>
                  Capture this screen
                  <span className="text-xs font-normal text-slate-500">Your browser asks which tab to share</span>
                </button>
              ) : null}
              <button type="button" onClick={() => fileRef.current?.click()} className={cn("flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-black hover:border-brand-300", !canCapture && "sm:col-span-2")}>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <ImagePlus className="h-5 w-5" />
                </span>
                Upload a screenshot
                <span className="text-xs font-normal text-slate-500">PNG, JPEG or WebP · optional</span>
              </button>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
            </div>
          )}

          <Field label="What went wrong?" htmlFor="bug-title" required>
            <TextInput id="bug-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} placeholder="e.g. Voucher PDF shows the wrong check-out date" />
          </Field>
          <Field label="Steps and details" htmlFor="bug-desc" required hint="What you did, what you expected, and what happened instead.">
            <TextArea id="bug-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} rows={4} />
          </Field>
          <p className="text-xs text-slate-400">We attach the page address, screen size and browser to help us reproduce it.</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => close(false)} className={secondaryBtn}>
              Cancel
            </button>
            <button type="button" onClick={submit} disabled={busy} className={primaryBtn}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Send report
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
