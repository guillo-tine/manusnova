import { FormEvent, useEffect, useRef, useState } from "react";
import { EMAIL } from "@/lib/links";

/** FormSubmit delivers submissions to the team inbox with no backend.
    If the service is unreachable (or not yet activated), submissions
    fall back to a prefilled email so the form never dead-ends. */
const FORM_ENDPOINT = "https://formsubmit.co/ajax/teammanusnova@gmail.com";

/** Any button on the page can summon the sheet. */
export function openRequestSheet() {
  window.dispatchEvent(new Event("open-request-sheet"));
}

const INK = "#1C1917";

type Status = "idle" | "sending" | "filed";

const RequestSheet = () => {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [signed, setSigned] = useState(false);
  const [needSign, setNeedSign] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<HTMLDivElement>(null);
  const penRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setStatus("idle");
      setNeedSign(false);
    };
    window.addEventListener("open-request-sheet", onOpen);
    return () => window.removeEventListener("open-request-sheet", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Size the canvas to its rendered box each time the sheet opens
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = INK;
    setSigned(false);
  }, [open]);

  /* ── Pen cursor follows the pointer over the pad ── */
  const movePen = (e: React.PointerEvent) => {
    const pad = padRef.current;
    const pen = penRef.current;
    if (!pad || !pen) return;
    if (e.pointerType !== "mouse") return;
    const rect = pad.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    pen.style.opacity = "1";
    pen.style.transform = `translate(${x - 2}px, ${y - 26}px) rotate(${drawing.current ? -6 : 0}deg)`;
  };
  const hidePen = () => {
    if (penRef.current) penRef.current.style.opacity = "0";
  };

  /* ── Drawing ── */
  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    movePen(e);
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!signed) {
      setSigned(true);
      setNeedSign(false);
    }
  };
  const up = () => {
    drawing.current = false;
  };
  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    setSigned(false);
  };

  /** Shrink the signature onto a white card before shipping it. */
  const signatureDataUrl = () => {
    const source = canvasRef.current!;
    const out = document.createElement("canvas");
    const scale = Math.min(1, 600 / source.width);
    out.width = Math.round(source.width * scale);
    out.height = Math.round(source.height * scale);
    const ctx = out.getContext("2d")!;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(source, 0, 0, out.width, out.height);
    return out.toDataURL("image/png");
  };

  const filed = () => {
    setStatus("filed");
    setTimeout(() => setOpen(false), 2200);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!signed) {
      setNeedSign(true);
      return;
    }
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const contact = (form.elements.namedItem("contact") as HTMLInputElement).value;
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement).value;

    setStatus("sending");
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: "Prosthetic device request (manusnova.org)",
          _template: "table",
          _captcha: "false",
          name,
          contact,
          message,
          signature: signatureDataUrl(),
        }),
      });
      const json = await res.json();
      if (json.success === true || json.success === "true") {
        filed();
        return;
      }
      throw new Error("submit failed");
    } catch {
      const body = `Name: ${name}\nContact: ${contact}\n\n${message}\n\n(Signed by hand on manusnova.org)`;
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(
        "Prosthetic device request"
      )}&body=${encodeURIComponent(body)}`;
      filed();
    }
  };

  const fieldLabel = "fig-label block mb-1.5";
  const fieldInput =
    "w-full bg-transparent border-0 border-b border-ink/30 focus:border-clay focus:outline-none focus:ring-0 py-2 text-ink text-sm placeholder:text-stone/50 transition-colors";

  return (
    <div
      className={`fixed inset-0 z-[60] ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-500 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* The paper */}
      <div className="absolute inset-0 flex items-end sm:items-center justify-center sm:p-6 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Request a device"
          className={`pointer-events-auto w-full max-w-lg max-h-[92vh] overflow-y-auto bg-sheet border border-ink/10 shadow-[0_24px_60px_-12px_rgb(28_25_23/0.25)] transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
            open ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
        >
          <div className="flex items-center justify-between px-6 sm:px-8 pt-6 pb-4 border-b border-ink/10">
            <p className="fig-label">Request form · Manus Nova</p>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="link-quiet text-xl leading-none px-1"
            >
              ×
            </button>
          </div>

          {status === "filed" ? (
            <div className="px-6 sm:px-8 py-16 flex flex-col items-center text-center">
              <p className="stamp font-mono text-sm uppercase tracking-[0.2em] text-clay border-2 border-clay px-6 py-3">
                Request filed
              </p>
              <p className="mt-6 text-sm text-stone max-w-xs">
                A student will get back to you within a day or two.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="px-6 sm:px-8 py-6 space-y-6">
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-6">
                <div>
                  <label htmlFor="rq-name" className={fieldLabel}>
                    Name
                  </label>
                  <input
                    id="rq-name"
                    name="name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Your name"
                    className={fieldInput}
                  />
                </div>
                <div>
                  <label htmlFor="rq-contact" className={fieldLabel}>
                    Email or phone
                  </label>
                  <input
                    id="rq-contact"
                    name="contact"
                    type="text"
                    required
                    placeholder="How we reach you"
                    className={fieldInput}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="rq-message" className={fieldLabel}>
                  What you need
                </label>
                <textarea
                  id="rq-message"
                  name="message"
                  rows={3}
                  required
                  placeholder="Who the device is for, and anything we should know. Plain language is fine."
                  className={`${fieldInput} resize-none`}
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="fig-label">Signature</span>
                  <button type="button" onClick={clear} className="link-quiet text-xs">
                    Clear
                  </button>
                </div>
                <div
                  ref={padRef}
                  className="relative select-none"
                  onPointerLeave={hidePen}
                >
                  <canvas
                    ref={canvasRef}
                    className="w-full h-28 block border-b border-dashed border-ink/40 touch-none [cursor:none]"
                    onPointerDown={down}
                    onPointerMove={draw}
                    onPointerUp={up}
                    onPointerCancel={up}
                  />
                  {!signed && (
                    <span className="absolute left-1 bottom-2 text-stone/40 text-sm pointer-events-none">
                      Sign here
                    </span>
                  )}
                  {/* The pen that rides the cursor */}
                  <div
                    ref={penRef}
                    className="absolute left-0 top-0 opacity-0 pointer-events-none transition-opacity duration-150 will-change-transform"
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M2 22l1.5-5L17 3.5a2.12 2.12 0 0 1 3 3L6.5 20 2 22Z"
                        fill="#F5F2EC"
                        stroke={INK}
                        strokeWidth="1.4"
                        strokeLinejoin="round"
                      />
                      <path d="M2 22l1.5-5 3.5 3.5L2 22Z" fill={INK} />
                    </svg>
                  </div>
                </div>
                {needSign && (
                  <p className="mt-2 text-xs text-clay">Please sign the form first.</p>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 pt-1">
                <button type="submit" disabled={status === "sending"} className="btn-primary">
                  {status === "sending" ? "Filing…" : "Submit request"}
                </button>
                <a href={`mailto:${EMAIL}`} className="link-quiet text-xs">
                  Prefer email? {EMAIL}
                </a>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestSheet;
