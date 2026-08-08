import { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import { jsPDF } from "jspdf";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle, Stethoscope, FileText,
  CheckCircle2, XCircle, Phone, MapPin,
  Calendar, User, ClipboardList, HelpCircle,
  Sparkles, Download, Loader2, ExternalLink,
  ShieldCheck, ShieldX, Tag, Building2
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function PrescriptionDashboard({ data }: { data: any }) {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!data || !data.extracted) return null;

  const { extracted, insights, medicine_verification } = data;
  const { doctor, patient, visit, medications, doctor_advice, other_notes } = extracted;

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

  return (
    <section className="w-full h-max flex flex-col items-end">
      <Button
        variant="outline"
        size="sm"
        className="w-max print:hidden gap-2 text-xs h-8"
        onClick={handleDownloadPDF}
        disabled={isDownloading}
      >
        {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        {isDownloading ? "Generating PDF..." : "Download PDF"}
      </Button>

      <div ref={dashboardRef} className="w-full max-w-5xl mx-auto my-2 bg-card text-card-foreground rounded-xl border border-border overflow-hidden shadow-sm">
        {/* ── Clinic Header ─────────────────────────────── */}
        <div className="px-8 pt-8 pb-6 border-b border-border">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase leading-tight">
                {doctor?.name || "Doctor Name"}
              </h1>
              <p className="text-sm font-semibold text-primary uppercase mt-1.5 tracking-wider">
                {doctor?.speciality || "Speciality"}
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                {doctor?.hospital}
              </p>
              {doctor?.address && (
                <p className="text-sm text-muted-foreground flex items-start gap-1.5 mt-1.5">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  {doctor.address}
                </p>
              )}
              {doctor?.contact && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Phone className="w-4 h-4 shrink-0" />
                  {doctor.contact}
                </p>
              )}
            </div>
            <div className="text-right shrink-0 space-y-3">
              <div className="flex flex-col items-end space-y-2">
                <Badge variant="outline" className="font-mono uppercase text-xs tracking-widest px-2.5 py-0.5">
                  {extracted.document_type || "Prescription"}
                </Badge>
                {doctor?.registration_no && (
                  <p className="text-xs text-muted-foreground">Reg: {doctor.registration_no}</p>
                )}
              </div>


            </div>
          </div>
        </div>

        {/* ── Patient + Date Row ────────────────────────── */}
        <div className="px-8 py-4 bg-muted/40 border-b border-border flex flex-wrap gap-x-10 gap-y-3 text-sm">
          <span className="flex items-center gap-2 text-foreground">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Patient:</span>
            <span className="font-semibold">{patient?.name || "N/A"}</span>
            {patient?.age && <span className="font-semibold text-muted-foreground">· {patient.age}y</span>}
            {patient?.sex && <span className="font-semibold text-muted-foreground capitalize">· {patient.sex}</span>}
          </span>
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Date:</span>
            <span className="font-semibold text-foreground">{visit?.date || "N/A"}</span>
          </span>
        </div>

        {/* ── Prescribed Medications ────────────────────── */}
        <div className="p-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Prescribed Medications
          </h2>

          {medications && medications.length > 0 ? (
            <div className="rounded-lg border border-border overflow-hidden mb-6">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[250px] py-4">Medicine</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide py-4">Dosage & Instructions</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right py-4">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medications.map((med: any, idx: number) => (
                    <TableRow key={idx} className="border-b border-border last:border-0">
                      <TableCell className="align-top py-4">
                        <p className="text-base font-semibold text-foreground">
                          {med.name}
                          {med.strength && <span className="font-normal text-muted-foreground ml-1">{med.strength}</span>}
                        </p>
                        {med.form && (
                          <Badge variant="secondary" className="mt-1.5 text-xs font-normal px-2">
                            {med.form}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="align-top py-4">
                        {/* Dosage pattern */}
                        {(med.dosage?.pattern || med.dosage_pattern) && (
                          <p className="text-base font-mono font-medium text-foreground">
                            {med.dosage?.pattern || med.dosage_pattern}
                          </p>
                        )}
                        {/* Human-readable */}
                        {med.dosage?.display?.human_readable && (
                          <p className="text-sm text-primary font-medium mt-1">{med.dosage.display.human_readable}</p>
                        )}
                        {/* Morning / Afternoon / Night pills */}
                        {med.dosage?.display && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {med.dosage.display.morning && (
                              <Badge variant="outline" className="text-xs px-2 py-0.5 font-normal">
                                🌅 Morning · {med.dosage.display.morning}
                              </Badge>
                            )}
                            {med.dosage.display.afternoon && (
                              <Badge variant="outline" className="text-xs px-2 py-0.5 font-normal">
                                ☀️ Afternoon · {med.dosage.display.afternoon}
                              </Badge>
                            )}
                            {med.dosage.display.night && (
                              <Badge variant="outline" className="text-xs px-2 py-0.5 font-normal">
                                🌙 Night · {med.dosage.display.night}
                              </Badge>
                            )}
                          </div>
                        )}
                        {/* Timing / Route / Notes */}
                        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                          {med.timing && <div><span className="text-foreground/50">Timing:</span> {med.timing}</div>}
                          {med.route && <div><span className="text-foreground/50">Route:</span> {med.route}</div>}
                          {med.instructions && <div><span className="text-foreground/50">Note:</span> {med.instructions}</div>}
                        </div>
                        {(!med.dosage && !med.dosage_pattern && !med.timing && !med.route && !med.instructions) && (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="align-top py-4 text-right">
                        <span className="text-sm font-medium text-foreground">{med.duration || "—"}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-base text-muted-foreground italic mb-6">No medications found.</p>
          )}

          {/* ── Doctor Advice & Notes ── */}
          {((doctor_advice && doctor_advice.length > 0) || (other_notes && other_notes.length > 0)) && (
            <div className="grid sm:grid-cols-2 gap-6">
              {doctor_advice && doctor_advice.length > 0 && (
                <div className="rounded-xl border border-border p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" /> Doctor Advice
                  </h3>
                  <ul className="space-y-2">
                    {doctor_advice.map((advice: any, idx: number) => (
                      <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        {advice.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {other_notes && other_notes.length > 0 && (
                <div className="rounded-xl border border-border p-5">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Other Notes
                  </h3>
                  <ul className="space-y-2">
                    {other_notes.map((note: string, idx: number) => (
                      <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── AI Insights ───────────────────────────────── */}
        {insights && (
          <div className="bg-gradient-to-b from-primary/[0.03] to-transparent border-t-2 border-primary/10">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground tracking-tight">Patient Guide</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">AI-generated plain English summary</p>
                </div>
                <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Generated
                </div>
              </div>

              {insights.summary?.overview && (
                <p className="text-base text-foreground leading-relaxed mb-8 p-5 rounded-2xl bg-card border border-border shadow-sm">
                  {insights.summary.overview}
                </p>
              )}

              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                {/* Do */}
                {insights.do && insights.do.length > 0 && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-primary mb-5 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> To Do
                    </h3>
                    <ul className="space-y-3">
                      {insights.do.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-foreground flex items-start gap-3">
                          <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Avoid */}
                {insights.avoid && insights.avoid.length > 0 && (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-destructive mb-5 flex items-center gap-2">
                      <XCircle className="w-5 h-5" /> To Avoid
                    </h3>
                    <ul className="space-y-3">
                      {insights.avoid.map((item: string, idx: number) => (
                        <li key={idx} className="text-sm text-foreground flex items-start gap-3">
                          <div className="mt-1 w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Medicine Details — with price, manufacturer & pharmacy links */}
              {(insights.medicine_details ?? insights.medicine_explanations) &&
                (insights.medicine_details ?? insights.medicine_explanations).length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-5">
                    What are these medicines for?
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-5">
                    {(insights.medicine_details ?? insights.medicine_explanations).map((med: any, idx: number) => {
                      // Find matching verification data (from medicine_verification or embedded in insights)
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
                        <div key={idx} className="rounded-2xl border border-border p-5 bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
                          {/* Name + validity badge */}
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-base font-bold text-foreground leading-tight">
                              {med.corrected_name ?? med.name ?? med.medicine ?? med.original_name ?? "Unnamed Medicine"}
                            </p>
                            <span className={`shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              isValid
                                ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-400"
                                : "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-400"
                            }`}>
                              {isValid ? <ShieldCheck className="w-3 h-3" /> : <ShieldX className="w-3 h-3" />}
                              {isValid ? "Verified" : "Unrecognised"}
                            </span>
                          </div>

                          {/* Purpose */}
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {!isValid
                              ? `"${med.corrected_name ?? med.name ?? med.medicine ?? med.original_name ?? "This medicine"}" was not recognised — please consult your doctor for more information.`
                              : med.purpose}
                          </p>

                          {/* Manufacturer + Price row */}
                          {(manufacturer || price) && (
                            <div className="flex flex-wrap gap-2">
                              {manufacturer && manufacturer !== "Not specified" && (
                                <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground font-medium">
                                  <Building2 className="w-3 h-3" />
                                  {manufacturer}
                                </span>
                              )}
                              {price && price !== "Not found" && (
                                <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold">
                                  <Tag className="w-3 h-3" />
                                  {price}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Side Effects */}
                          {med.common_side_effects && med.common_side_effects.length > 0 && (
                            <div className="pt-3 border-t border-border/50">
                              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Common Side Effects</p>
                              <div className="flex flex-wrap gap-1.5">
                                {med.common_side_effects.map((se: string, si: number) => (
                                  <span key={si} className="text-xs px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium border border-border/50">
                                    {se}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Pharmacy Links */}
                          {pharmacyLinks.length > 0 && (
                            <div className="pt-3 border-t border-border/50">
                              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Buy Online</p>
                              <div className="flex flex-wrap gap-2">
                                {pharmacyLinks.map((link: { site: string; url: string }, li: number) => (
                                  <a
                                    key={li}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-background border border-border hover:border-primary hover:text-primary text-foreground font-medium transition-colors"
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
                <Alert variant="destructive" className="mb-8 rounded-2xl border-destructive/30 bg-destructive/5">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle className="text-sm font-bold">Warning Signs — Contact your doctor immediately if you experience:</AlertTitle>
                  <AlertDescription className="text-sm mt-2 leading-relaxed">
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      {insights.warning_signs.map((ws: string, i: number) => (
                        <li key={i}>{ws}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Questions for Doctor */}
              {insights.questions_for_doctor && insights.questions_for_doctor.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" /> Ask your doctor next time
                  </h3>
                  <ul className="space-y-3">
                    {insights.questions_for_doctor.map((q: string, idx: number) => (
                      <li key={idx} className="text-sm text-foreground flex items-start gap-3 bg-muted/30 p-3 rounded-xl border border-border/50">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-background border border-border text-xs font-bold text-muted-foreground shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="mt-1">{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-muted-foreground/80 font-medium text-center pt-6 border-t border-border/50">
                {insights.disclaimer || "This guide is generated by AI for educational purposes only. Always follow your doctor's official advice."}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>

  );
}
