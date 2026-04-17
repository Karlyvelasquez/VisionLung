const { useEffect, useMemo, useRef, useState } = React;

const TRANSLATIONS = {
    es: {
        nav: { home: "Inicio", platform: "Plataforma", diagnosis: "Diagnostico", start: "Iniciar analisis" },
        theme: { dark: "Oscuro", light: "Claro" },
        lang: { es: "ES", en: "EN" },
        hero: {
            overline: "Asistente radiologico de nueva generacion",
            titleMain: "VisionLung:",
            titleAccent: "precision y apoyo para diagnostico de neumonia",
            subtitle: "Disenada para equipos medicos: carga en segundos, resultados comprensibles y decisiones clinicas mas rapidas.",
            cta: "Probar con radiografia",
            facts: [
                "Neumonia: infeccion que inflama los alveolos pulmonares.",
                "Sintomas frecuentes: fiebre, tos, disnea y dolor toracico.",
                "Valor clinico: la radiografia de torax es clave para la evaluacion inicial."
            ]
        },
        stats: [
            {
                label: "Agilidad de triage",
                value: 68,
                hint: "Reduce tiempos de priorizacion al centralizar carga, analisis y lectura en una sola vista."
            },
            {
                label: "Claridad diagnostica",
                value: 91,
                hint: "Presenta probabilidad y confianza en formato visual para apoyar decisiones clinicas mas rapidas."
            },
            {
                label: "Continuidad clinica",
                value: 84,
                hint: "Facilita documentacion y seguimiento con reportes listos para integrar al flujo asistencial."
            }
        ],
        workspace: {
            overline: "Modulo diagnostico",
            title: "Analiza una radiografia de torax",
            subtitle: "La IA clasifica el hallazgo, estima confianza y genera un comentario clinico contextual."
        },
        upload: {
            title: "Arrastra una radiografia o toca para seleccionar",
            meta: "Formatos permitidos: PNG, JPG, JPEG | Tamano maximo: 50 MB",
            button: "Seleccionar archivo",
            loading: "Procesando imagen y generando analisis...",
            invalidType: "Archivo invalido. Solo se aceptan PNG, JPG o JPEG.",
            invalidSize: "Archivo demasiado grande. El maximo permitido es 50 MB."
        },
        result: {
            title: "Resultado",
            empty: "Sube una radiografia para ver el resultado clinico aqui.",
            analyzedAt: "Analizado",
            file: "Archivo",
            confidence: "Confianza",
            prob: "Probabilidad neumonia",
            modelConfidence: "Confianza del modelo",
            feedbackTitle: "Analisis clinico asistido",
            newAnalysis: "Nuevo analisis",
            download: "Descargar reporte"
        },
        panel: { input: "Entrada de estudio" },
        errors: { generic: "Error inesperado en el analisis" },
        footer: {
            line1: "VisionLung 2026 | Herramienta de apoyo diagnostico para radiologia toracica.",
            line2: "Uso clinico supervisado: no reemplaza evaluacion profesional."
        },
        report: {
            title: "REPORTE CLINICO - VISIONLUNG",
            dateTime: "Fecha y hora",
            file: "Archivo analizado",
            model: "RESULTADO DEL MODELO",
            diagnosis: "Diagnostico",
            probability: "Probabilidad de neumonia",
            confidence: "Confianza del modelo",
            analysis: "ANALISIS CLINICO ASISTIDO",
            legal: "AVISO LEGAL",
            legalLine1: "Esta plataforma es una herramienta de apoyo y no reemplaza",
            legalLine2: "el criterio medico ni el informe de un radiologo.",
            unavailable: "No disponible"
        },
        diagnosisMap: {
            PNEUMONIA_DETECTED: "NEUMONIA DETECTADA",
            NO_PNEUMONIA: "SIN NEUMONIA"
        }
    },
    en: {
        nav: { home: "Home", platform: "Platform", diagnosis: "Diagnosis", start: "Start analysis" },
        theme: { dark: "Dark", light: "Light" },
        lang: { es: "ES", en: "EN" },
        hero: {
            overline: "Next-generation radiology assistant",
            titleMain: "VisionLung:",
            titleAccent: "precision and support for pneumonia diagnosis",
            subtitle: "Designed for medical teams: upload in seconds, clear outputs, and faster clinical decisions.",
            cta: "Test with chest X-ray",
            facts: [
                "Pneumonia: an infection that inflames the lung air sacs.",
                "Common symptoms: fever, cough, shortness of breath, and chest pain.",
                "Clinical value: chest X-ray is key for early evaluation."
            ]
        },
        stats: [
            {
                label: "Triage speed",
                value: 68,
                hint: "Reduces prioritization time by centralizing upload, analysis, and interpretation in one view."
            },
            {
                label: "Diagnostic clarity",
                value: 91,
                hint: "Presents probability and confidence visually to support faster clinical decisions."
            },
            {
                label: "Clinical continuity",
                value: 84,
                hint: "Improves documentation and follow-up with exportable reports ready for care workflows."
            }
        ],
        workspace: {
            overline: "Diagnostic module",
            title: "Analyze a chest X-ray",
            subtitle: "AI classifies findings, estimates confidence, and generates contextual clinical feedback."
        },
        upload: {
            title: "Drag and drop an X-ray or click to upload",
            meta: "Allowed formats: PNG, JPG, JPEG | Max size: 50 MB",
            button: "Select file",
            loading: "Processing image and generating analysis...",
            invalidType: "Invalid file. Only PNG, JPG, or JPEG are allowed.",
            invalidSize: "File too large. The maximum allowed size is 50 MB."
        },
        result: {
            title: "Result",
            empty: "Upload a chest X-ray to view the clinical output here.",
            analyzedAt: "Analyzed",
            file: "File",
            confidence: "Confidence",
            prob: "Pneumonia probability",
            modelConfidence: "Model confidence",
            feedbackTitle: "AI-assisted clinical analysis",
            newAnalysis: "New analysis",
            download: "Download report"
        },
        panel: { input: "Study input" },
        errors: { generic: "Unexpected analysis error" },
        footer: {
            line1: "VisionLung 2026 | Decision-support tool for thoracic radiology.",
            line2: "Clinical supervision required: does not replace professional assessment."
        },
        report: {
            title: "CLINICAL REPORT - VISIONLUNG",
            dateTime: "Date and time",
            file: "Analyzed file",
            model: "MODEL OUTPUT",
            diagnosis: "Diagnosis",
            probability: "Pneumonia probability",
            confidence: "Model confidence",
            analysis: "AI-ASSISTED CLINICAL ANALYSIS",
            legal: "LEGAL DISCLAIMER",
            legalLine1: "This platform is a decision-support tool and does not replace",
            legalLine2: "clinical judgment or a radiologist report.",
            unavailable: "Unavailable"
        },
        diagnosisMap: {
            PNEUMONIA_DETECTED: "PNEUMONIA DETECTED",
            NO_PNEUMONIA: "NO PNEUMONIA"
        }
    }
};

function formatPct(value) {
    return `${(value * 100).toFixed(1)}%`;
}

function formatDate(dateIso, language) {
    return new Date(dateIso).toLocaleString(language === "en" ? "en-US" : "es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function confidenceTone(result) {
    if (!result) return "neutral";
    return result.diagnosis_code === "PNEUMONIA_DETECTED" ? "alert" : "safe";
}

function buildReport(result, fileName, language, t) {
    if (!result) return "";

    return [
        t.report.title,
        "================================",
        "",
        `${t.report.dateTime}: ${formatDate(result.timestamp, language)}`,
        `${t.report.file}: ${fileName || t.report.unavailable}`,
        "",
        t.report.model,
        "---------------------",
        `${t.report.diagnosis}: ${result.diagnosis}`,
        `${t.report.probability}: ${formatPct(result.probability)}`,
        `${t.report.confidence}: ${formatPct(result.confidence)}`,
        "",
        t.report.analysis,
        "-------------------------",
        result.feedback || t.report.unavailable,
        "",
        t.report.legal,
        "-----------",
        t.report.legalLine1,
        t.report.legalLine2,
        ""
    ].join("\n");
}

function StatCard({ label, value, hint }) {
    const cardRef = useRef(null);
    const [displayValue, setDisplayValue] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        const node = cardRef.current;
        if (!node || hasAnimated) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting || hasAnimated) return;
                    setHasAnimated(true);

                    const duration = 1100;
                    const start = performance.now();
                    const animate = (now) => {
                        const elapsed = now - start;
                        const progress = Math.min(elapsed / duration, 1);
                        const eased = 1 - Math.pow(1 - progress, 3);
                        setDisplayValue(Math.round(value * eased));
                        if (progress < 1) requestAnimationFrame(animate);
                    };

                    requestAnimationFrame(animate);
                    observer.disconnect();
                });
            },
            { threshold: 0.4 }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [value, hasAnimated]);

    return (
        <article ref={cardRef} className="stat-card reveal">
            <p className="stat-value">{displayValue}%</p>
            <p className="stat-label">{label}</p>
            <p className="stat-hint">{hint}</p>
        </article>
    );
}

function SectionHeader({ overline, title, subtitle }) {
    return (
        <div className="section-header reveal">
            <p className="section-overline">{overline}</p>
            <h2>{title}</h2>
            <p>{subtitle}</p>
        </div>
    );
}

function UploadZone({ onFile, busy, t }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    return (
        <div
            className={`upload-zone ${dragging ? "dragging" : ""} ${busy ? "busy" : ""}`}
            onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                if (busy) return;
                const file = event.dataTransfer.files?.[0];
                if (file) onFile(file);
            }}
            onClick={() => {
                if (!busy) inputRef.current?.click();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
                if ((event.key === "Enter" || event.key === " ") && !busy) {
                    event.preventDefault();
                    inputRef.current?.click();
                }
            }}
            aria-label={t.upload.title}
        >
            <div className="upload-dot" />
            <p className="upload-title">{t.upload.title}</p>
            <p className="upload-meta">{t.upload.meta}</p>
            <button type="button" className="btn btn-secondary" disabled={busy}>
                {t.upload.button}
            </button>
            <input
                ref={inputRef}
                hidden
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) onFile(file);
                    event.target.value = "";
                }}
            />
        </div>
    );
}

function ConfidenceRing({ confidence, tone, label }) {
    const angle = Math.round(confidence * 360);
    return (
        <div
            className={`confidence-ring ${tone}`}
            style={{ background: `conic-gradient(var(--tone) ${angle}deg, rgba(255,255,255,0.13) 0deg)` }}
        >
            <div className="confidence-inner">
                <p>{label}</p>
                <strong>{formatPct(confidence)}</strong>
            </div>
        </div>
    );
}

function App() {
    const [theme, setTheme] = useState(localStorage.getItem("visionlung-theme") || "dark");
    const [language, setLanguage] = useState(localStorage.getItem("visionlung-language") || "es");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [fileName, setFileName] = useState("");

    const diagnosticRef = useRef(null);
    const tone = confidenceTone(result);
    const t = TRANSLATIONS[language];

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("visionlung-theme", theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem("visionlung-language", language);
    }, [language]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) entry.target.classList.add("in-view");
                });
            },
            { threshold: 0.15 }
        );

        document.querySelectorAll(".reveal:not(.in-view)").forEach((node) => observer.observe(node));
        return () => observer.disconnect();
    }, [language]);

    const uploadFile = async (file) => {
        setError("");

        const validTypes = ["image/png", "image/jpeg"];
        if (!validTypes.includes(file.type)) {
            setError(t.upload.invalidType);
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            setError(t.upload.invalidSize);
            return;
        }

        setBusy(true);
        setResult(null);
        setFileName(file.name);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("language", language);

            const response = await fetch("/api/predict", {
                method: "POST",
                body: formData
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || t.errors.generic);
            }

            setResult(payload);
            diagnosticRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (err) {
            setError(err.message || t.errors.generic);
        } finally {
            setBusy(false);
        }
    };

    const localizedDiagnosis = result
        ? (t.diagnosisMap[result.diagnosis_code] || result.diagnosis)
        : "";

    const reportContent = useMemo(
        () => buildReport(result ? { ...result, diagnosis: localizedDiagnosis } : null, fileName, language, t),
        [result, fileName, language, t, localizedDiagnosis]
    );

    const exportReport = () => {
        if (!reportContent) return;
        const blob = new Blob([reportContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `visionlung-report-${Date.now()}.txt`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <div className="app-bg" aria-hidden="true" />
            <header className="top-nav">
                <a href="#home" className="brand">
                    <span className="brand-mark" />
                    <span>VisionLung</span>
                </a>
                <nav>
                    <a href="#home">{t.nav.home}</a>
                    <a href="#plataforma">{t.nav.platform}</a>
                    <a href="#diagnostico">{t.nav.diagnosis}</a>
                </nav>
                <div className="nav-tools">
                    <button
                        className="btn btn-secondary tool-btn"
                        onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
                    >
                        {theme === "dark" ? t.theme.light : t.theme.dark}
                    </button>
                    <div className="lang-switch" role="group" aria-label="Language switch">
                        <button
                            className={`lang-btn ${language === "es" ? "active" : ""}`}
                            onClick={() => setLanguage("es")}
                        >
                            {t.lang.es}
                        </button>
                        <button
                            className={`lang-btn ${language === "en" ? "active" : ""}`}
                            onClick={() => setLanguage("en")}
                        >
                            {t.lang.en}
                        </button>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => diagnosticRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                    >
                        {t.nav.start}
                    </button>
                </div>
            </header>

            <main>
                <section className="hero" id="home">
                    <div className="hero-copy reveal">
                        <p className="eyebrow">{t.hero.overline}</p>
                        <h1>
                            {t.hero.titleMain}
                            <span>{t.hero.titleAccent}</span>
                        </h1>
                        <p>{t.hero.subtitle}</p>
                        <div className="hero-actions">
                            <button
                                className="btn btn-primary"
                                onClick={() => diagnosticRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                            >
                                {t.hero.cta}
                            </button>
                        </div>
                    </div>
                    <div className="hero-card reveal">
                        <img src={window.VISIONLUNG_ASSETS?.heroImage} alt="Chest X-ray visual" />
                        <div className="hero-card-footer">
                            {t.hero.facts.map((fact) => (
                                <p key={fact}>{fact}</p>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="stats" id="plataforma">
                    {t.stats.map((item, index) => (
                        <StatCard key={`stat-${index}`} label={item.label} value={item.value} hint={item.hint} />
                    ))}
                </section>

                <section className="workspace" id="diagnostico" ref={diagnosticRef}>
                    <SectionHeader
                        overline={t.workspace.overline}
                        title={t.workspace.title}
                        subtitle={t.workspace.subtitle}
                    />

                    {error && <div className="error-banner">{error}</div>}

                    <div className="workspace-grid">
                        <article className="panel reveal">
                            <h3>{t.panel.input}</h3>
                            <UploadZone onFile={uploadFile} busy={busy} t={t} />
                            {busy && <p className="loading-text">{t.upload.loading}</p>}
                        </article>

                        <article className="panel result-panel reveal">
                            <h3>{t.result.title}</h3>
                            {busy && (
                                <div className="result-loading" role="status" aria-live="polite">
                                    <p className="result-loading-title">{t.upload.loading}</p>
                                    <div className="loading-track">
                                        <div className="loading-fill" />
                                    </div>
                                    <div className="loading-skeleton" />
                                    <div className="loading-skeleton short" />
                                    <div className="loading-skeleton" />
                                </div>
                            )}
                            {!result && !busy && (
                                <div className="empty-state">
                                    <p>{t.result.empty}</p>
                                </div>
                            )}

                            {result && (
                                <>
                                    <div className="result-head">
                                        <div>
                                            <span className={`diagnosis-pill ${tone}`}>{localizedDiagnosis}</span>
                                            <p className="result-date">{t.result.analyzedAt}: {formatDate(result.timestamp, language)}</p>
                                            <p className="result-date">{t.result.file}: {fileName}</p>
                                        </div>
                                        <ConfidenceRing confidence={result.confidence} tone={tone} label={t.result.confidence} />
                                    </div>

                                    <div className="metric-row">
                                        <div>
                                            <span>{t.result.prob}</span>
                                            <strong>{formatPct(result.probability)}</strong>
                                        </div>
                                        <div>
                                            <span>{t.result.modelConfidence}</span>
                                            <strong>{formatPct(result.confidence)}</strong>
                                        </div>
                                    </div>

                                    <img className="result-image" src={result.image} alt="Analyzed chest X-ray" />

                                    <section className="feedback">
                                        <h4>{t.result.feedbackTitle}</h4>
                                        {result.feedback
                                            .split("\n")
                                            .filter((line) => line.trim())
                                            .map((line, index) => (
                                                <p key={`${line.slice(0, 16)}-${index}`}>{line}</p>
                                            ))}
                                    </section>

                                    <div className="result-actions">
                                        <button className="btn btn-secondary" onClick={() => setResult(null)}>
                                            {t.result.newAnalysis}
                                        </button>
                                        <button className="btn btn-primary" onClick={exportReport}>
                                            {t.result.download}
                                        </button>
                                    </div>
                                </>
                            )}
                        </article>
                    </div>
                </section>
            </main>

            <footer className="footer">
                <p>{t.footer.line1}</p>
                <p>{t.footer.line2}</p>
            </footer>
        </>
    );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
