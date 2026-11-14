import { FormEvent, useEffect, useRef, useState } from "react";
import { EMAIL } from "@/lib/links";
import { stage } from "@/lib/stage";

/** FormSubmit delivers submissions to the team inbox with no backend.
    If the service is unreachable (or not yet activated), submissions
    fall back to a prefilled email so the form never dead-ends. */
const FORM_ENDPOINT = "https://formsubmit.co/ajax/teammanusnova@gmail.com";

type Status = "idle" | "sending" | "sent";

const RequestSheet = () => {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setStatus("idle");
    };
    window.addEventListener("open-request-sheet", onOpen);
    return () => window.removeEventListener("open-request-sheet", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    stage.lenis?.stop();
    const focusTimer = setTimeout(() => firstField.current?.focus(), 350);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      stage.lenis?.start();
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const sent = () => {
    setStatus("sent");
    setTimeout(() => setOpen(false), 2600);
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
        }),
      });
      const json = await res.json();
      if (json.success === true || json.success === "true") {
        sent();
        return;
      }
      throw new Error("submit failed");
    } catch {
      const body = `Name: ${name}\nContact: ${contact}\n\n${message}`;
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(
        "Prosthetic device request"
      )}&body=${encodeURIComponent(body)}`;
      sent();
    }
  };

  const label = "block text-[13px] font-medium text-ink mb-2";
  const field =
    "w-full rounded-xl bg-bone border border-transparent px-4 py-3 text-[15px] text-ink placeholder:text-stone/70 transition-colors focus:outline-none focus:border-white/30";

  return (
    // Closed, the sheet must be truly gone: hidden only after its fade-out finishes, so it
    // can't catch clicks, the scroll wheel, taps, or keyboard focus over the page beneath.
    <div
      className={`fixed inset-0 z-[60] transition-[visibility] duration-500 ${open ? "visible" : "invisible pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-xl transition-opacity duration-500 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />

      <div className="absolute inset-0 flex items-end sm:items-center justify-center sm:p-6 pointer-events-none">
        <div
          role="dialog"
          data-lenis-prevent
          aria-modal="true"
          aria-labelledby="rq-title"
          className={`${open ? "pointer-events-auto" : ""} w-full max-w-[460px] max-h-[92svh] overflow-y-auto bg-sheet rounded-t-[28px] sm:rounded-[28px] ring-1 ring-white/10 shadow-[0_40px_100px_-20px_rgb(0_0_0/0.8)] transition-all duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] ${
            open ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex items-start justify-between px-7 pt-7">
            <h2 id="rq-title" className="text-[26px] font-semibold tracking-[-0.03em]">
              Request a device
            </h2>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="-mr-1.5 -mt-0.5 w-8 h-8 rounded-full bg-bone text-stone hover:text-ink flex items-center justify-center transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {status === "sent" ? (
            <div className="px-7 pt-6 pb-10">
              <p className="text-[17px] text-ink">Sent.</p>
              <p className="mt-1.5 text-[15px] text-stone">
                A student will reply within a day or two.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} className="px-7 pt-5 pb-7 space-y-5">
              <p className="text-[15px] leading-relaxed text-stone">
                Free for the recipient. Plain language is fine.
              </p>
              <div>
                <label htmlFor="rq-name" className={label}>
                  Name
                </label>
                <input
                  ref={firstField}
                  id="rq-name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  className={field}
                />
              </div>
              <div>
                <label htmlFor="rq-contact" className={label}>
                  Email or phone
                </label>
                <input id="rq-contact" name="contact" type="text" required className={field} />
              </div>
              <div>
                <label htmlFor="rq-message" className={label}>
                  Who it's for, and what they need
                </label>
                <textarea
                  id="rq-message"
                  name="message"
                  rows={4}
                  required
                  className={`${field} resize-none`}
                />
              </div>
              <button
                type="submit"
                disabled={status === "sending"}
                className="btn-primary w-full disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : "Send request"}
              </button>
              <p className="text-center text-[13px] text-stone">
                Or email{" "}
                <a href={`mailto:${EMAIL}`} className="text-ink underline underline-offset-2">
                  {EMAIL}
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestSheet;
