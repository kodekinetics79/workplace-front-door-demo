import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
// Shared core: the exact language and content model used by the web pathway and staff console.
import { DICTS, fmt, type Dict } from "../lib/i18n";
import type { Lang } from "../lib/content";

const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
const C = { navy: "#12304A", blue: "#1F5FA8", amber: "#F2B233", amberSoft: "#FFF4DA", ink: "#0F1E2C", ink2: "#3E4E5C", line: "#D5DEE6", field: "#6B7B8A", ground: "#F2F5F8", red: "#B42318" };
type Svc = { id: string; title: string; sum: string; who: string; how: string; bring: string; type: string; goals: string[]; townLabels: string[]; formatLabels: string[] };
type Screen = { name: "home" } | { name: "results"; goal?: string; q?: string } | { name: "detail"; id: string } | { name: "request"; id?: string } | { name: "done"; ref: string; method: string };

export default function App() {
  const [lang, setLang] = useState<Lang>("en");
  const t = DICTS[lang];
  const [stack, setStack] = useState<Screen[]>([{ name: "home" }]);
  const [services, setServices] = useState<Svc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const screen = stack[stack.length - 1];
  const go = (s: Screen) => setStack((p) => [...p, s]);
  const back = () => setStack((p) => (p.length > 1 ? p.slice(0, -1) : p));
  useEffect(() => {
    setServices(null); setError(null);
    fetch(`${API}/api/services?lang=${lang}`).then((r) => r.json()).then((d) => setServices(d.services)).catch(() => setError(t.e_generic));
  }, [lang, t.e_generic]);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.navy }}>
      <StatusBar style="light" />
      <View style={s.top}>
        {stack.length > 1 ? <Pressable onPress={back} accessibilityRole="button" accessibilityLabel={t.back} style={s.iconBtn}><Text style={{ color: "#fff", fontSize: 22 }}>‹</Text></Pressable> : <View style={s.mark} accessibilityElementsHidden />}
        <Text style={s.brand} accessibilityRole="header">{t.app_name}</Text>
        <View style={s.lang} accessibilityRole="radiogroup" accessibilityLabel={t.lang_label}>
          {(["en", "es"] as const).map((l) => (
            <Pressable key={l} onPress={() => setLang(l)} accessibilityRole="radio" accessibilityState={{ selected: lang === l }} accessibilityLabel={l === "en" ? "English" : "Español"} style={[s.langBtn, lang === l && { backgroundColor: "#fff" }]}>
              <Text style={{ fontWeight: "800", color: lang === l ? C.navy : "#D5E0EA" }}>{l.toUpperCase()}</Text>
            </Pressable>))}
        </View>
      </View>
      <View style={{ backgroundColor: C.amberSoft, paddingHorizontal: 16, paddingVertical: 6 }}><Text style={{ color: "#5A3F00", fontSize: 12 }}>{t.demo_banner}</Text></View>
      <ScrollView style={{ backgroundColor: C.ground }} contentContainerStyle={{ paddingBottom: 40 }}>
        {error && <Text style={[s.pad, { color: C.red }]} accessibilityRole="alert">{error}</Text>}
        {screen.name === "home" && <Home t={t} go={go} />}
        {screen.name === "results" && (services ? <Results t={t} list={services} goal={screen.goal} q={screen.q} go={go} /> : <ActivityIndicator style={{ marginTop: 40 }} />)}
        {screen.name === "detail" && services && <Detail t={t} svc={services.find((x) => x.id === screen.id)} go={go} />}
        {screen.name === "request" && <RequestForm t={t} lang={lang} svc={services?.find((x) => x.id === screen.id)} done={(ref, method) => setStack([{ name: "home" }, { name: "done", ref, method }])} />}
        {screen.name === "done" && <Done t={t} refCode={screen.ref} method={screen.method} home={() => setStack([{ name: "home" }])} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function Btn({ label, onPress, kind = "primary", disabled }: { label: string; onPress: () => void; kind?: "primary" | "secondary"; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled }} style={({ pressed }) => [s.btn, kind === "secondary" ? s.btnSec : { backgroundColor: C.blue }, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }, disabled && { opacity: 0.6 }]}>
      <Text style={{ color: kind === "secondary" ? C.blue : "#fff", fontWeight: "700", fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

function Home({ t, go }: { t: Dict; go: (s: Screen) => void }) {
  const [q, setQ] = useState("");
  const goals: [string, string, string][] = [["job", t.g_job, t.g_job_s], ["skills", t.g_skills, t.g_skills_s], ["help", t.g_help, t.g_help_s], ["youth", t.g_youth, t.g_youth_s]];
  return (
    <View>
      <View style={s.hero}>
        <Text style={s.h1} accessibilityRole="header">{t.home_h}</Text>
        <Text style={{ color: "#D5E0EA", fontSize: 16 }}>{t.home_sub}</Text>
        <Text nativeID="searchLabel" style={{ color: "#E6EDF3", fontWeight: "700", marginTop: 6 }}>{t.search_label}</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput value={q} onChangeText={setQ} placeholder={t.search_ph} placeholderTextColor="#C9D6E2" returnKeyType="search" accessibilityLabelledBy="searchLabel"
            onSubmitEditing={() => q.trim() && go({ name: "results", q })} style={s.searchInput} />
          <Pressable onPress={() => q.trim() && go({ name: "results", q })} accessibilityRole="button" accessibilityLabel={t.search_go} style={s.searchBtn}><Text style={{ fontSize: 20 }}>⌕</Text></Pressable>
        </View>
      </View>
      <Text style={[s.h2, s.pad]} accessibilityRole="header">{t.browse}</Text>
      <View style={[s.card, { marginHorizontal: 20 }]}>
        {goals.map(([k, a, b], i) => (
          <Pressable key={k} onPress={() => go({ name: "results", goal: k })} accessibilityRole="button" accessibilityLabel={`${a}. ${b}`} style={({ pressed }) => [s.row, i > 0 && { borderTopWidth: 1, borderTopColor: "#E3E9EF" }, pressed && { backgroundColor: "#F6F9FC" }]}>
            <View style={{ flex: 1 }}><Text style={{ fontSize: 17, fontWeight: "700", color: C.ink }}>{a}</Text><Text style={{ color: "#4B5B6A" }}>{b}</Text></View>
            <Text style={{ color: C.field, fontSize: 20 }}>›</Text>
          </Pressable>))}
      </View>
    </View>
  );
}

function Results({ t, list, goal, q, go }: { t: Dict; list: Svc[]; goal?: string; q?: string; go: (s: Screen) => void }) {
  const items = useMemo(() => list.filter((x) => (q ? `${x.title} ${x.sum}`.toLowerCase().includes(q.toLowerCase()) || (q.toLowerCase() === "cna" && x.id === "health") : x.goals.includes(goal ?? ""))), [list, goal, q]);
  return (
    <View style={{ padding: 20, gap: 12 }}>
      <Text style={s.h1dark} accessibilityRole="header">{q ? fmt(t.q_title, { q }) : ({ job: t.g_job, skills: t.g_skills, help: t.g_help, youth: t.g_youth } as Record<string, string>)[goal ?? "job"]}</Text>
      <Text style={{ color: C.ink2 }} accessibilityLiveRegion="polite">{items.length === 1 ? t.n_one : fmt(t.n_many, { n: items.length })}</Text>
      {items.map((x) => (
        <View key={x.id} style={[s.card, { padding: 16, gap: 8 }]}>
          <Text style={{ fontSize: 18, fontWeight: "800", color: C.ink }} accessibilityRole="header">{x.title}</Text>
          <Text style={{ color: C.ink2 }}>{x.sum}</Text>
          <Text style={{ color: "#4B5B6A", fontSize: 13 }}>{x.townLabels.join(", ")}</Text>
          <Btn label={t.view} onPress={() => go({ name: "detail", id: x.id })} />
        </View>))}
    </View>
  );
}

function Detail({ t, svc, go }: { t: Dict; svc?: Svc; go: (s: Screen) => void }) {
  if (!svc) return null;
  const rows: [string, string][] = [[t.d_who, svc.who], [t.d_how, svc.how], [t.d_where, `${svc.townLabels.join(", ")}. ${svc.formatLabels.join(", ")}.`], [t.d_bring, svc.bring]];
  return (
    <View>
      <View style={s.hero}><Text style={{ alignSelf: "flex-start", backgroundColor: C.amber, color: C.navy, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>{svc.type}</Text><Text style={s.h1} accessibilityRole="header">{svc.title}</Text><Text style={{ color: "#D5E0EA", fontSize: 16 }}>{svc.sum}</Text></View>
      <View style={[s.card, { margin: 20 }]}>{rows.map(([k, v], i) => (<View key={k} style={[{ padding: 14 }, i > 0 && { borderTopWidth: 1, borderTopColor: "#E3E9EF" }]}><Text style={{ fontWeight: "700", color: "#4B5B6A" }}>{k}</Text><Text style={{ fontSize: 16, color: C.ink, marginTop: 4 }}>{v}</Text></View>))}</View>
      <View style={{ paddingHorizontal: 20 }}><Btn label={t.request_help} onPress={() => go({ name: "request", id: svc.id })} /></View>
    </View>
  );
}

function RequestForm({ t, lang, svc, done }: { t: Dict; lang: Lang; svc?: Svc; done: (ref: string, method: string) => void }) {
  const [name, setName] = useState(""); const [method, setMethod] = useState<"callback" | "email" | "text">("callback");
  const [phone, setPhone] = useState(""); const [email, setEmail] = useState(""); const [sms, setSms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false); const [fail, setFail] = useState<string | null>(null);
  const showSms = method !== "email" && phone.replace(/\D/g, "").length >= 10;
  const submit = async () => {
    setBusy(true); setFail(null);
    try {
      const r = await fetch(`${API}/api/requests`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "resident", serviceId: svc?.id, firstName: name, method, phone: method === "email" ? undefined : phone, email: method === "email" ? email : undefined, smsConsent: showSms && sms, lang, channel: "app" }) });
      const d = await r.json();
      if (r.status === 422) setErrors(d.errors ?? {}); else if (!r.ok) setFail(r.status === 429 ? t.e_rate : t.e_generic); else done(d.ref, method);
    } catch { setFail(t.e_generic); } finally { setBusy(false); }
  };
  const e = (k: string) => (errors[k] ? (t as Record<string, string>)[errors[k]] ?? t.e_req : null);
  return (
    <View style={{ padding: 20, gap: 14 }}>
      <Text style={s.h1dark} accessibilityRole="header">{t.r_h}</Text>
      <Text style={{ color: C.ink2 }}>{t.r_about} <Text style={{ fontWeight: "700" }}>{svc?.title ?? t.r_general}</Text></Text>
      {(fail || Object.keys(errors).length > 0) && <Text accessibilityRole="alert" style={s.alert}>{fail ?? t.r_fix}</Text>}
      <Field label={t.r_name} value={name} onChange={setName} error={e("firstName")} autoComplete="given-name" />
      <Text style={s.label}>{t.r_method}</Text>
      <View style={s.seg} accessibilityRole="radiogroup">{(["callback", "email", "text"] as const).map((m) => (
        <Pressable key={m} onPress={() => setMethod(m)} accessibilityRole="radio" accessibilityState={{ selected: method === m }} style={[s.segBtn, method === m && { backgroundColor: "#fff" }]}><Text style={{ fontWeight: "700", color: method === m ? C.navy : C.ink2 }}>{t[`m_${m}`]}</Text></Pressable>))}</View>
      {method === "email" ? <Field label={t.r_email} value={email} onChange={setEmail} error={e("email")} keyboard="email-address" autoComplete="email" />
        : <Field label={method === "text" ? t.r_phone_text : t.r_phone_callback} value={phone} onChange={setPhone} error={e("phone")} keyboard="phone-pad" autoComplete="tel" />}
      {showSms && (<View style={[s.card, { flexDirection: "row", padding: 14, gap: 12, alignItems: "flex-start" }]}>
        <Switch value={sms} onValueChange={setSms} accessibilityLabel={t.sms_h} trackColor={{ true: C.blue }} />
        <View style={{ flex: 1 }}><Text style={{ fontWeight: "700" }}>{t.sms_h}</Text><Text style={{ fontSize: 13, color: C.ink2 }}>{t.sms_p}</Text></View></View>)}
      <Text style={{ color: C.ink2, fontSize: 14 }}>{t.privacy}</Text>
      <Btn label={busy ? t.sending : t.send} onPress={submit} disabled={busy} />
    </View>
  );
}

function Field({ label, value, onChange, error, keyboard, autoComplete }: { label: string; value: string; onChange: (v: string) => void; error: string | null; keyboard?: "email-address" | "phone-pad"; autoComplete?: "given-name" | "email" | "tel" }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} accessibilityLabel={label} accessibilityHint={error ?? undefined} keyboardType={keyboard} autoComplete={autoComplete} style={[s.input, error ? { borderColor: C.red, borderWidth: 2 } : null]} />
      {error && <Text style={{ color: C.red, fontWeight: "700" }}>{error}</Text>}
    </View>
  );
}

function Done({ t, refCode, method, home }: { t: Dict; refCode: string; method: string; home: () => void }) {
  const steps: [string, string, "done" | "now" | "later"][] = [[t.st1, t.st1x, "done"], [t.st2, t.st2x, "now"], [t.st3, (t as Record<string, string>)[`st3_${method}`], "later"], [t.st4, t.st4x, "later"]];
  return (
    <View>
      <View style={s.hero}><Text style={s.h1} accessibilityRole="header">{t.heading}</Text>
        <View style={{ backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}><Text style={{ color: "#D5E0EA" }}>{t.ref}</Text><Text style={{ color: "#fff", fontSize: 24, fontWeight: "800", letterSpacing: 1 }}>{refCode}</Text></View></View>
      <View style={{ padding: 20 }}>
        <Text style={[s.h2, { marginBottom: 12 }]} accessibilityRole="header">{t.next_h}</Text>
        {steps.map(([a, b, st], i) => (
          <View key={a} style={{ flexDirection: "row", gap: 14 }}>
            <View style={{ width: 28, alignItems: "center" }}>
              <View style={st === "done" ? s.dotDone : st === "now" ? s.dotNow : s.dotLater} />
              {i < steps.length - 1 && <View style={{ width: 4, flex: 1, minHeight: 18, marginVertical: 4, borderRadius: 2, backgroundColor: st === "done" ? C.amber : C.line }} />}
            </View>
            <View style={{ flex: 1, paddingBottom: 18 }}><Text style={{ fontSize: 17, fontWeight: "800", color: C.ink }}>{a}</Text><Text style={{ color: C.ink2 }}>{b}</Text></View>
          </View>))}
        <Btn label={t.back_discover} onPress={home} />
        <View style={{ height: 10 }} />
        <Btn kind="secondary" label={t.privacy_link} onPress={() => Linking.openURL(`${API}/privacy`)} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, minHeight: 56 },
  mark: { width: 26, height: 26, borderRadius: 7, backgroundColor: C.amber, marginLeft: 6 },
  brand: { flex: 1, color: "#fff", fontSize: 18, fontWeight: "800" },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  lang: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 22, padding: 3 },
  langBtn: { minWidth: 48, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  hero: { backgroundColor: C.navy, padding: 20, paddingTop: 12, gap: 12, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  h1: { color: "#fff", fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  h1dark: { color: C.ink, fontSize: 26, fontWeight: "800" },
  h2: { fontSize: 18, fontWeight: "800", color: C.ink },
  pad: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: C.line, borderRadius: 18, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", padding: 16, minHeight: 72, gap: 12 },
  searchInput: { flex: 1, height: 54, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", backgroundColor: "rgba(255,255,255,0.14)", color: "#fff", paddingHorizontal: 16, fontSize: 16 },
  searchBtn: { width: 54, height: 54, borderRadius: 16, backgroundColor: C.amber, alignItems: "center", justifyContent: "center" },
  btn: { minHeight: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  btnSec: { borderWidth: 1.5, borderColor: C.blue, backgroundColor: "#fff" },
  label: { fontSize: 15, fontWeight: "700", color: C.ink },
  input: { minHeight: 52, borderWidth: 1, borderColor: C.field, borderRadius: 12, paddingHorizontal: 14, fontSize: 16, backgroundColor: "#fff" },
  seg: { flexDirection: "row", backgroundColor: "#E3E9EF", borderRadius: 14, padding: 4, gap: 6 },
  segBtn: { flex: 1, minHeight: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  alert: { borderWidth: 1.5, borderColor: C.red, backgroundColor: "#FEF3F2", color: "#912018", borderRadius: 12, padding: 12, fontWeight: "700" },
  dotDone: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.navy },
  dotNow: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.amber, borderWidth: 7, borderColor: C.amberSoft },
  dotLater: { width: 20, height: 20, marginVertical: 4, borderRadius: 10, borderWidth: 3, borderColor: C.field, backgroundColor: "#fff" },
});
