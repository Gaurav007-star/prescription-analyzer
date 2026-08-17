import { useRef, useState, useEffect, MutableRefObject } from "react";
import * as htmlToImage from "html-to-image";
import { jsPDF } from "jspdf";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle, Stethoscope,
  CheckCircle2, XCircle, Phone, MapPin,
  Calendar, User, ClipboardList, HelpCircle,
  Sparkles, ExternalLink,
  ShieldCheck, ShieldX, Tag, Building2, Pill, Clock
} from "lucide-react";

interface PrescriptionDashboardProps {
  data: any;
  exportRef?: MutableRefObject<(() => Promise<void>) | null>;
  compact?: boolean;
}

export default function PrescriptionDashboard({ data, exportRef, compact = false }: PrescriptionDashboardProps) {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!data || !data.extracted) return null;

  const { extracted, insights, medicine_verification } = data;
  const { doctor, patient, visit, medications, doctor_advice } = extracted;

  const px = compact ? "px-4" : "px-6";
  const py = compact ? "py-3" : "py-4";
  const sectionP = compact ? "p-4" : "p-6";

  const handleDownloadPDF = async () => {
    if (!dashboardRef.current) return;
    setIsDownloading(true);
    try {
      const imgData = await htmlToImage.toPng(dashboardRef.current, { pixelRatio: 2, backgroundColor: '#ffffff' });

      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => { img.onload = resolve; });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [img.width, img.height]
      });
      pdf.addImage(imgData, "PNG", 0, 0, img.width, img.height);
      pdf.save("prescription-summary.pdf");
    } catch (err) {
      console.error("Failed to generate PDF", err);
      alert("Failed to generate PDF. Please try again or use the print option.");
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (exportRef) exportRef.current = handleDownloadPDF;
  });

  return (
    <div className="w-full">
      <div ref={dashboardRef} className="w-full bg-card text-card-foreground border-2 border-foreground shadow-[var(--shadow)]">

        {/* ── Clinic Header ─────────────────────────────── */}
        <div className={`${px} ${compact ? 'pt-4 pb-3' : 'pt-6 pb-5'} border-b-2 border-foreground bg-primary text-primary-foreground`}>
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className={`${compact ? 'text-xl' : 'text-2xl'} font-bold tracking-tight uppercase leading-tight`}>
                {doctor?.name || "Doctor Name"}
              </h1>
              <p className="text-sm font-bold uppercase mt-1 tracking-wider opacity-90">
                {doctor?.speciality || "Speciality"}
              </p>
              <p className="text-sm mt-2 opacity-80">
                {doctor?.hospital}
              </p>
              {doctor?.address && (
                <p className="text-sm flex items-start gap-1.5 mt-1 opacity-80">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  {doctor.address}
                </p>
              )}
              {doctor?.contact && (
                <p className="text-sm flex items-center gap-1.5 mt-1 opacity-80">
                  <Phone className="w-4 h-4 shrink-0" />
                  {doctor.contact}
                </p>
              )}
            </div>
            <div className="text-right shrink-0 space-y-2">
              <Badge className="font-mono uppercase text-xs tracking-widest px-3 py-1 bg-card text-card-foreground border-2 border-foreground">
                {extracted.document_type || "Prescription"}
              </Badge>
              {doctor?.registration_no && (
                <p className="text-xs opacity-70">Reg: {doctor.registration_no}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Patient + Date Row ────────────────────────── */}
        <div className={`${px} ${py} bg-secondary border-b-2 border-foreground flex flex-wrap gap-x-8 gap-y-2 text-sm font-medium`}>
          <span className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Patient:</span>
            <span className="font-bold">{patient?.name || "N/A"}</span>
            {patient?.age && <span className="opacity-70">· {patient.age}y</span>}
            {patient?.sex && <span className="opacity-70 capitalize">· {patient.sex}</span>}
          </span>
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Date:</span>
            <span className="font-bold">{visit?.date || "N/A"}</span>
          </span>
        </div>

        {/* ── Prescribed Medications ────────────────────── */}
        <div className={sectionP}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="p-1.5 border-2 border-foreground bg-accent">
              <Pill className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest">
              Prescribed Medications
            </h2>
            {medications && medications.length > 0 && (
              <Badge className="ml-auto text-xs font-bold px-2 py-0.5 bg-primary text-primary-foreground border-2 border-foreground">
                {medications.length} {medications.length === 1 ? 'medicine' : 'medicines'}
              </Badge>
            )}
          </div>

          {medications && medications.length > 0 ? (
            <div className="border-2 border-foreground overflow-hidden mb-5 shadow-[var(--shadow-sm)]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted border-b-2 border-foreground hover:bg-muted">
                    <TableHead className={`text-xs font-bold uppercase tracking-wide ${compact ? 'w-[160px]' : 'w-[220px]'} py-3 border-r-2 border-foreground`}>Medicine</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wide py-3 border-r-2 border-foreground">Dosage & Instructions</TableHead>
                    <TableHead className="text-xs font-bold uppercase tracking-wide text-right py-3">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medications.map((med: any, idx: number) => (
                    <TableRow key={idx} className="border-b-2 border-foreground last:border-0 hover:bg-muted/50 transition-colors">
                      <TableCell className="align-top py-3 border-r-2 border-foreground">
                        <p className="text-sm font-bold">
                          {med.name}
                          {med.strength && <span className="font-normal opacity-70 ml-1">{med.strength}</span>}
                        </p>
                        {med.form && (
                          <Badge className="mt-1.5 text-[10px] font-bold px-2 py-0.5 bg-muted border-2 border-foreground">
                            {med.form}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="align-top py-3 border-r-2 border-foreground">
                        {(med.dosage?.pattern || med.dosage_pattern) && (
                          <p className="text-sm font-mono font-bold">
                            {med.dosage?.pattern || med.dosage_pattern}
                          </p>
                        )}
                        {med.dosage?.display?.human_readable && (
                          <p className="text-xs text-primary font-bold mt-1">{med.dosage.display.human_readable}</p>
                        )}
                        {med.dosage?.display && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {med.dosage.display.morning && (
                              <Badge className="text-[10px] px-2 py-0.5 font-bold bg-primary text-primary-foreground border-2 border-foreground">
                                <Clock className="w-3 h-3 mr-1" />
                                AM · {med.dosage.display.morning}
                              </Badge>
                            )}
                            {med.dosage.display.afternoon && (
                              <Badge className="text-[10px] px-2 py-0.5 font-bold bg-accent text-accent-foreground border-2 border-foreground">
                                <Clock className="w-3 h-3 mr-1" />
                                PM · {med.dosage.display.afternoon}
                              </Badge>
                            )}
                            {med.dosage.display.night && (
                              <Badge className="text-[10px] px-2 py-0.5 font-bold bg-secondary text-secondary-foreground border-2 border-foreground">
                                <Clock className="w-3 h-3 mr-1" />
                                Night · {med.dosage.display.night}
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="mt-2 space-y-0.5 text-xs opacity-70">
                          {med.timing && <div><span className="opacity-50">Timing:</span> {med.timing}</div>}
                          {med.route && <div><span className="opacity-50">Route:</span> {med.route}</div>}
                          {med.instructions && <div><span className="opacity-50">Note:</span> {med.instructions}</div>}
                        </div>
                        {(!med.dosage && !med.dosage_pattern && !med.timing && !med.route && !med.instructions) && (
                          <span className="opacity-50 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="align-top py-3 text-right">
                        <span className="text-sm font-bold">{med.duration || "—"}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm opacity-50 italic mb-5">No medications found.</p>
          )}

          {/* ── Doctor Advice ── */}
          {(doctor_advice && doctor_advice.length > 0) && (
            <div className="border-2 border-foreground p-4 bg-muted shadow-[var(--shadow-sm)]">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <div className="p-1 border-2 border-foreground bg-accent">
                  <ClipboardList className="w-3.5 h-3.5" />
                </div>
                Doctor Advice
              </h3>
              <ul className="space-y-2">
                {doctor_advice.map((advice: any, idx: number) => (
                  <li key={idx} className="text-sm flex items-start gap-2.5">
                    <div className="mt-1.5 w-2 h-2 bg-primary border border-foreground shrink-0" />
                    {advice.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── AI Insights ───────────────────────────────── */}
        {insights && (
          <div className="border-t-2 border-foreground">
            <div className={`${sectionP}`}>
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-primary border-2 border-foreground shadow-[var(--shadow-sm)]">
                  <Stethoscope className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className={`${compact ? 'text-base' : 'text-lg'} font-bold tracking-tight`}>Patient Guide</h2>
                  <p className="text-xs opacity-60 mt-0.5">AI-generated plain English summary</p>
                </div>
                <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-accent border-2 border-foreground text-xs font-bold shadow-[var(--shadow-sm)]">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Generated
                </div>
              </div>

              {/* Overview */}
              {insights.summary?.overview && (
                <div className="mb-6 p-4 bg-muted border-2 border-foreground shadow-[var(--shadow-sm)]">
                  <p className="text-sm leading-relaxed font-medium">
                    {insights.summary.overview}
                  </p>
                </div>
              )}

              {/* Do / Avoid */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {insights.do && insights.do.length > 0 && (
                  <div className="border-2 border-foreground bg-primary/10 p-4 shadow-[var(--shadow-sm)]">
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                      <div className="p-1 border-2 border-foreground bg-primary text-primary-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      To Do
                    </h3>
                    <ul className="space-y-2.5">
                      {insights.do.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2.5">
                          <div className="mt-1.5 w-2 h-2 bg-primary border border-foreground shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.avoid && insights.avoid.length > 0 && (
                  <div className="border-2 border-foreground bg-destructive/10 p-4 shadow-[var(--shadow-sm)]">
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                      <div className="p-1 border-2 border-foreground bg-destructive text-destructive-foreground">
                        <XCircle className="w-3.5 h-3.5" />
                      </div>
                      To Avoid
                    </h3>
                    <ul className="space-y-2.5">
                      {insights.avoid.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2.5">
                          <div className="mt-1.5 w-2 h-2 bg-destructive border border-foreground shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Medicine Details */}
              {(insights.medicine_details ?? insights.medicine_explanations) &&
                (insights.medicine_details ?? insights.medicine_explanations).length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-1.5 border-2 border-foreground bg-accent">
                      <Pill className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest">
                      What are these medicines for?
                    </h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {(insights.medicine_details ?? insights.medicine_explanations).map((med: any, idx: number) => {
                      const verification = medicine_verification?.find(
                        (v: any) =>
                          v.original_name?.toLowerCase() === (med.name ?? med.medicine)?.toLowerCase() ||
                          v.corrected_name?.toLowerCase() === (med.name ?? med.medicine)?.toLowerCase()
                      );
                      const isValid = med.is_valid ?? verification?.is_valid ?? true;
                      const manufacturer = med.manufacturer || verification?.manufacturer;
                      const price = med.approximate_price || verification?.approximate_price;
                      const pharmacyLinks: { site: string; url: string }[] =
                        med.pharmacy_links ?? verification?.pharmacy_links ?? [];

                      return (
                        <div key={idx} className="border-2 border-foreground p-4 bg-card shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow)] transition-shadow">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-sm font-bold leading-tight">
                              {med.corrected_name ?? med.name ?? med.medicine ?? med.original_name ?? "Unnamed Medicine"}
                            </p>
                            <Badge className={`shrink-0 text-[10px] font-bold px-2 py-0.5 border-2 border-foreground ${
                              isValid
                                ? "bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100"
                                : "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100"
                            }`}>
                              {isValid ? <ShieldCheck className="w-3 h-3 mr-0.5" /> : <ShieldX className="w-3 h-3 mr-0.5" />}
                              {isValid ? "Verified" : "Unrecognised"}
                            </Badge>
                          </div>

                          <p className="text-xs opacity-70 leading-relaxed mb-2">
                            {!isValid
                              ? `"${med.corrected_name ?? med.name ?? med.medicine ?? med.original_name ?? "This medicine"}" was not recognised — please consult your doctor.`
                              : med.purpose}
                          </p>

                          {(manufacturer || price) && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {manufacturer && manufacturer !== "Not specified" && (
                                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 border-2 border-foreground bg-muted font-bold">
                                  <Building2 className="w-3 h-3" />
                                  {manufacturer}
                                </span>
                              )}
                              {price && price !== "Not found" && (
                                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 border-2 border-foreground bg-primary text-primary-foreground font-bold">
                                  <Tag className="w-3 h-3" />
                                  {price}
                                </span>
                              )}
                            </div>
                          )}

                          {med.common_side_effects && med.common_side_effects.length > 0 && (
                            <div className="pt-2 border-t-2 border-foreground/30">
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-60">Side Effects</p>
                              <div className="flex flex-wrap gap-1">
                                {med.common_side_effects.map((se: string, si: number) => (
                                  <span key={si} className="text-[10px] px-2 py-0.5 border border-foreground/50 bg-muted font-bold">
                                    {se}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {pharmacyLinks.length > 0 && (
                            <div className="pt-2 border-t-2 border-foreground/30">
                              <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-60">Buy Online</p>
                              <div className="flex flex-wrap gap-1.5">
                                {pharmacyLinks.map((link: { site: string; url: string }, li: number) => (
                                  <a
                                    key={li}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[10px] px-2 py-1 border-2 border-foreground bg-card hover:bg-primary hover:text-primary-foreground font-bold transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    {link.site}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Warning Signs */}
              {insights.warning_signs && insights.warning_signs.length > 0 && (
                <div className="mb-6 border-2 border-foreground bg-destructive/10 p-4 shadow-[var(--shadow-sm)]">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="p-1.5 border-2 border-foreground bg-destructive text-destructive-foreground">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest">
                      Warning Signs
                    </h3>
                  </div>
                  <p className="text-xs font-bold mb-2">Contact your doctor immediately if you experience:</p>
                  <ul className="space-y-2">
                    {insights.warning_signs.map((ws: string, i: number) => (
                      <li key={i} className="text-sm flex items-start gap-2.5">
                        <div className="mt-1.5 w-2 h-2 bg-destructive border border-foreground shrink-0" />
                        {ws}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Questions for Doctor */}
              {insights.questions_for_doctor && insights.questions_for_doctor.length > 0 && (
                <div className="border-2 border-foreground bg-card p-4 shadow-[var(--shadow-sm)] mb-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-1.5 border-2 border-foreground bg-secondary">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest">
                      Ask your doctor next time
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {insights.questions_for_doctor.map((q: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-3 bg-muted p-3 border-2 border-foreground">
                        <span className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground border-2 border-foreground text-xs font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-medium">{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <div className="pt-4 border-t-2 border-foreground/30">
                <p className="text-[11px] opacity-50 font-medium text-center">
                  {insights.disclaimer || "This guide is generated by AI for educational purposes only. Always follow your doctor's official advice."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
