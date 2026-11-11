// Seed content. In production this is authored by WorkPlace staff in the console.
export type Lang = "en" | "es";
export type ServiceText = { type: string; title: string; sum: string; who: string; how: string; bring: string };
export type ServiceDoc = { en: ServiceText; es: ServiceText };
export type ServiceSeed = { id: string; goals: string[]; formats: string[]; towns: string[]; state: "draft" | "review" | "published"; doc: ServiceDoc };

export const GOALS = ["job", "skills", "help", "youth", "employer"] as const;
export const FORMATS = ["inperson", "phone", "online"] as const;
export const TOWNS = ["bridgeport", "stamford", "valley", "online"] as const;

export const TOWN_LABEL: Record<Lang, Record<string, string>> = {
  en: { bridgeport: "Bridgeport", stamford: "Stamford", valley: "Lower Naugatuck Valley", online: "Online" },
  es: { bridgeport: "Bridgeport", stamford: "Stamford", valley: "Valle del Bajo Naugatuck", online: "En línea" },
};
export const FORMAT_LABEL: Record<Lang, Record<string, string>> = {
  en: { inperson: "In person", phone: "Phone", online: "Online" },
  es: { inperson: "En persona", phone: "Teléfono", online: "En línea" },
};

const s = (type: string, title: string, sum: string, who: string, how: string, bring: string): ServiceText => ({ type, title, sum, who, how, bring });

export const SERVICE_SEED: ServiceSeed[] = [
  { id: "coach", goals: ["help", "job"], formats: ["inperson", "phone", "online"], towns: ["bridgeport", "stamford", "valley", "online"], state: "published", doc: {
    en: s("Counseling", "Career coaching", "One-to-one help to plan your next step, from job search to training choices.", "Adults looking for work or a better job. Staff confirm which programs fit you.", "Meet a coach in person, by phone or online and leave with a clear plan.", "Nothing is required to start. A resume helps if you have one."),
    es: s("Orientación", "Asesoría de carrera", "Ayuda individual para planear su próximo paso, desde buscar empleo hasta elegir una capacitación.", "Adultos que buscan empleo o un mejor trabajo. El personal confirma qué programas le corresponden.", "Reúnase con un asesor en persona, por teléfono o en línea y salga con un plan claro.", "No necesita nada para empezar. Un currículum ayuda si lo tiene.") } },
  { id: "resume", goals: ["job"], formats: ["inperson", "online"], towns: ["bridgeport", "stamford", "online"], state: "published", doc: {
    en: s("Workshop", "Resume and job search workshop", "Build a resume, practice interviews and learn where to find openings, including CTHires.", "Anyone preparing to apply for jobs.", "Small-group sessions in person or online.", "Your work history and any resume you already have."),
    es: s("Taller", "Taller de currículum y búsqueda de empleo", "Prepare su currículum, practique entrevistas y aprenda dónde encontrar vacantes, incluido CTHires.", "Cualquier persona que se prepara para solicitar empleo.", "Sesiones en grupos pequeños, en persona o en línea.", "Su historial laboral y cualquier currículum que ya tenga.") } },
  { id: "training", goals: ["skills"], formats: ["inperson", "online"], towns: ["bridgeport", "stamford", "valley", "online"], state: "published", doc: {
    en: s("Training", "Training for in-demand careers", "Explore approved training programs. Funding may be available if you qualify; staff confirm eligibility.", "Job seekers who want new skills for a growing field.", "Start with a counselor, then choose an approved program.", "Nothing to start. Staff tell you what documents are needed later."),
    es: s("Capacitación", "Capacitación para carreras con demanda", "Explore programas de capacitación aprobados. Puede haber fondos si califica; el personal confirma la elegibilidad.", "Personas que buscan nuevas habilidades para un campo en crecimiento.", "Empiece con un asesor y luego elija un programa aprobado.", "Nada para empezar. El personal le indicará qué documentos necesitará después.") } },
  { id: "health", goals: ["skills", "job"], formats: ["inperson"], towns: ["bridgeport", "valley"], state: "published", doc: {
    en: s("Career pathway", "Healthcare career pathway (CNA and more)", "Short training and job connections for entry-level healthcare roles such as certified nursing assistant.", "Adults interested in patient care and support roles.", "Information session, then training with employer connections.", "Nothing to start."),
    es: s("Trayectoria profesional", "Trayectoria en carreras de salud (CNA y más)", "Capacitación corta y conexiones con empleos de nivel inicial en salud, como asistente de enfermería certificado.", "Adultos interesados en cuidado de pacientes y puestos de apoyo.", "Sesión informativa y luego capacitación con conexiones a empleadores.", "Nada para empezar.") } },
  { id: "youth", goals: ["youth", "skills", "job"], formats: ["inperson", "online"], towns: ["bridgeport", "stamford", "valley"], state: "published", doc: {
    en: s("Youth program", "Youth employment program (ages 16 to 24)", "Work experience, training and a dedicated counselor for young adults.", "Young adults ages 16 to 24. Staff confirm eligibility.", "Meet a youth counselor and build a plan together.", "Nothing to start."),
    es: s("Programa juvenil", "Programa de empleo juvenil (16 a 24 años)", "Experiencia laboral, capacitación y un asesor dedicado para jóvenes.", "Jóvenes de 16 a 24 años. El personal confirma la elegibilidad.", "Conozca a un asesor juvenil y armen un plan juntos.", "Nada para empezar.") } },
  { id: "digital", goals: ["skills"], formats: ["online", "inperson"], towns: ["online", "stamford"], state: "published", doc: {
    en: s("Class", "Computer and digital skills class", "Learn email, online job applications and common workplace tools.", "Anyone who wants more confidence with computers.", "Beginner-friendly classes online or in person.", "Nothing. Devices are available at the center."),
    es: s("Clase", "Clase de computación y habilidades digitales", "Aprenda a usar el correo, solicitudes de empleo en línea y herramientas comunes de trabajo.", "Cualquier persona que quiera más confianza con las computadoras.", "Clases para principiantes en línea o en persona.", "Nada. Hay equipos disponibles en el centro.") } },
  { id: "event", goals: ["job", "youth"], formats: ["inperson"], towns: ["bridgeport"], state: "published", doc: {
    en: s("Event", "Regional hiring event", "Meet local employers who are hiring.", "Job seekers ready to meet employers.", "Drop in during event hours.", "Copies of your resume."),
    es: s("Evento", "Feria regional de contratación", "Conozca a empleadores locales que están contratando.", "Personas listas para conocer empleadores.", "Venga durante el horario del evento.", "Copias de su currículum.") } },
  { id: "veterans", goals: ["help", "job"], formats: ["inperson", "phone"], towns: ["bridgeport", "stamford", "valley"], state: "published", doc: {
    en: s("Veterans", "Veterans employment services", "Priority of service and specialized help for veterans and eligible spouses.", "Veterans and eligible spouses.", "Meet a staff member in person or by phone.", "Nothing to start."),
    es: s("Veteranos", "Servicios de empleo para veteranos", "Prioridad de servicio y ayuda especializada para veteranos y cónyuges elegibles.", "Veteranos y cónyuges elegibles.", "Reúnase con el personal en persona o por teléfono.", "Nada para empezar.") } },
  { id: "reentry", goals: ["help", "job"], formats: ["inperson", "phone"], towns: ["bridgeport", "valley"], state: "draft", doc: {
    en: s("Counseling", "Reentry employment support", "Job readiness and employer connections for people returning to the community.", "Adults returning to the community. Staff confirm program fit.", "Meet a reentry specialist in person or by phone.", "Nothing to start."),
    es: s("", "", "", "", "", "") } },
];

export type CommunityEvent = { id: string; date: string; start: string; end: string; town: string; title: Record<Lang, string>; place: Record<Lang, string> };
export const EVENTS: CommunityEvent[] = [
  { id: "youth-fair", date: "2026-11-14", start: "10:00", end: "13:00", town: "bridgeport", title: { en: "Youth career fair", es: "Feria de empleo juvenil" }, place: { en: "Bridgeport, in person", es: "Bridgeport, en persona" } },
  { id: "health-info", date: "2026-11-18", start: "17:30", end: "18:30", town: "online", title: { en: "Healthcare careers info session", es: "Sesión informativa sobre carreras de salud" }, place: { en: "Online", es: "En línea" } },
  { id: "hiring-day", date: "2026-12-03", start: "09:00", end: "12:00", town: "stamford", title: { en: "Stamford employer hiring day", es: "Día de contratación en Stamford" }, place: { en: "Stamford, in person", es: "Stamford, en persona" } },
];

export const CONSENT_TEXT_VERSION = "sms-consent-v1.0";

/**
 * The WorkPlace's own published program catalogue, taken from the public page
 * workplace.org/programs on 10 November 2026. Titles and links are theirs and are
 * reproduced unchanged; nothing here is invented. Every record is loaded as a DRAFT
 * so the content console shows the real review queue: WorkPlace staff write the
 * plain-language wording, assign the goal, towns and formats, and publish. This
 * mirrors Bidder Q&A items 24 and 25 — near-term content is WorkPlace programs at
 * workplace.org/programs, maintained by WorkPlace staff, complementing the website
 * rather than reproducing it.
 */
export const WORKPLACE_PUBLISHED: { slug: string; title: string; url: string }[] = [
  { slug: "cna", title: "Certified Nursing Assistant (CNA)", url: "https://www.workplace.org/certified-nursing-assistant/" },
  { slug: "mw-healthcare", title: "MaturityWorks Healthcare Careers", url: "https://www.workplace.org/mw-healthcare-careers/" },
  { slug: "p2e-youth", title: "Platform to Employment Youth", url: "https://www.workplace.org/platform-to-employment-youth/" },
  { slug: "p2e", title: "Platform to Employment", url: "https://www.workplace.org/p2e-re-entry/" },
  { slug: "second-chance", title: "Second Chance Re-Entry Program", url: "https://www.workplace.org/second-chance/" },
  { slug: "maturityworks", title: "MaturityWorks", url: "https://www.workplace.org/maturityworks/" },
  { slug: "mortgage-crisis", title: "Mortgage Crisis Job Training Program", url: "https://www.workplace.org/mortgage-crisis-job-training-program/" },
  { slug: "dress-for-success", title: "Dress for Success Mid-Fairfield County", url: "https://www.workplace.org/dress-for-success/" },
  { slug: "vr-training", title: "Virtual Reality Training", url: "https://www.workplace.org/virtual-reality-training/" },
  { slug: "energyworks", title: "EnergyWorks", url: "https://www.workplace.org/energyworks/" },
  { slug: "health-careerx", title: "Health CareeRx Academy", url: "https://www.workplace.org/health-career-academy/" },
  { slug: "careerhub", title: "CareerHub", url: "https://www.workplace.org/careerhub/" },
  { slug: "bbf", title: "Building Better Futures", url: "https://www.workplace.org/bbf/" },
  { slug: "youthbuild", title: "YouthBuild", url: "https://www.workplace.org/youthbuild/" },
  { slug: "manufacturing", title: "Manufacturing & Advanced Technology Training", url: "https://www.workplace.org/manufacturing-and-advanced-technology/" },
  { slug: "project-retail", title: "Project Retail", url: "https://www.workplace.org/retail-job-training-program/" },
  { slug: "veterans-program", title: "Veterans", url: "https://www.workplace.org/veterans/" },
  { slug: "military-machinist", title: "Military to Machinist", url: "https://www.workplace.org/military-to-machinist/" },
  { slug: "etm", title: "Employment Transition Model (ETM)", url: "https://www.workplace.org/employment-transition-model-etm/" },
  { slug: "ajc", title: "American Job Centers", url: "https://www.workplace.org/american-job-center/" },
  { slug: "career-coach", title: "Career Coach", url: "https://www.workplace.org/career-coach/" },
  { slug: "jobs-first", title: "Jobs First Employment Services", url: "https://www.workplace.org/jobs-first-employment-services/" },
  { slug: "engage-staffing", title: "Engage Staffing", url: "https://www.workplace.org/engage-staffing/" },
  { slug: "bs-recruitment", title: "Business Services: Recruitment", url: "https://workplace.org/business-services/#recruitment" },
  { slug: "bs-industry-training", title: "Business Services: Industry Training", url: "https://workplace.org/business-services/#industry-training" },
  { slug: "bs-layoff-aversion", title: "Business Services: Layoff Aversion", url: "https://workplace.org/business-services/#layoff-aversion" },
  { slug: "bs-labor-market", title: "Business Services: Labor Market", url: "https://workplace.org/business-services/#labor-market" },
];

const REVIEW_NOTE =
  "Loaded from The WorkPlace's published program list at workplace.org/programs (public information, 10 Nov 2026). Awaiting WorkPlace review: staff write the plain-language summary, set who it is for, and assign goal, towns and formats before publishing.";

/** The real catalogue as draft records, so the review queue is populated on first load. */
export const WORKPLACE_DRAFT_SEED: ServiceSeed[] = WORKPLACE_PUBLISHED.map((p) => {
  const text = s("WorkPlace program", p.title, REVIEW_NOTE, "To be confirmed by WorkPlace staff during review.", `Program page: ${p.url}`, "To be confirmed by WorkPlace staff during review.");
  return { id: `wp-${p.slug}`, goals: [], formats: [], towns: [], state: "draft" as const, doc: { en: text, es: { ...text, type: "Programa de The WorkPlace" } } };
});
