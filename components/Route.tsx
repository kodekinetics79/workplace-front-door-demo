import { Icon } from "./Icon";
export type Step = { title: string; text: string; state: "done" | "now" | "later"; tag?: string };
export function RouteLine({ steps }: { steps: Step[] }) {
  return (
    <ol className="route">
      {steps.map((s, i) => (
        <li key={s.title} aria-current={s.state === "now" ? "step" : undefined}>
          <div className="rail" aria-hidden="true">
            <span className={`dot ${s.state}`}>{s.state === "done" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>}</span>
            {i < steps.length - 1 && <span className={`seg-line ${s.state === "done" ? "done" : ""}`} />}
          </div>
          <div className="body">
            <span className="title">{s.title}{s.tag && <span className={s.state === "done" ? "pill-done" : "pill-now"}>{s.tag}</span>}</span>
            <span className="x">{s.text}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
export { Icon };
