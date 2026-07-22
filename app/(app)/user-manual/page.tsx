import { DashboardHeader } from "@/components/layout/header";
import { DashboardFooter } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { BookOpen, PlayCircle, FileText, Download, LayoutDashboard, Factory, Users, type LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * User Manual — downloadable guides plus walkthrough videos and reference
 * photos for the A A Tech system.
 *
 * Media & documents live in /public/user-manual/. Add each file's path here as
 * it's added to the folder (kept as an explicit list so it renders reliably on
 * Vercel, where the public folder isn't listable at runtime).
 */
interface DocEntry {
  src: string;
  title: string;
  desc: string;
  size: string;
  from: string;
  to: string;
  Icon: LucideIcon;
}

// The three workspace manuals, colour-matched to their Hub workspace cards.
const DOCS: DocEntry[] = [
  {
    src: "/user-manual/wms-user-manual.docx",
    title: "WMS — Work Management System",
    desc: "Login, Dashboard, My Day, Tasks & Kanban.",
    size: "8.2 MB · Word",
    from: "#0180cf",
    to: "#0069b3",
    Icon: LayoutDashboard,
  },
  {
    src: "/user-manual/preproduction-user-manual.docx",
    title: "Pre-Production System",
    desc: "Quote & SO status, GA approval, BOM, Work Order, Working Specification & Proforma Invoice.",
    size: "3.6 MB · Word",
    from: "#63b81e",
    to: "#4a9616",
    Icon: Factory,
  },
  {
    src: "/user-manual/employees-workspace-user-manual.docx",
    title: "Employees Workspace",
    desc: "Attendance, Leave, Salary & Reimbursement.",
    size: "3.3 MB · Word",
    from: "#0d9488",
    to: "#0f766e",
    Icon: Users,
  },
];

const VIDEOS: { src: string; title: string }[] = [];
const PHOTOS: { src: string; title: string }[] = [];

export default async function UserManualPage() {
  const hasContent = DOCS.length > 0 || VIDEOS.length > 0 || PHOTOS.length > 0;

  return (
    <>
      <DashboardHeader generatedAt={new Date()} />
      <main className="relative mx-auto max-w-[1200px] px-8 pb-20 pt-8 max-md:px-4">
        <PageHero
          eyebrow="Help"
          title="User Manual"
          subtitle="Guides, walkthroughs, photos & videos for the A A Tech system."
          Icon={BookOpen}
        />

        {!hasContent ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-300 bg-white/60 px-6 py-20 text-center backdrop-blur">
            <span className="inline-flex size-14 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: "linear-gradient(135deg, #0ea5c4, #0069b3)" }}>
              <PlayCircle size={26} strokeWidth={2.1} />
            </span>
            <p className="mt-4 text-[16px] font-bold text-slate-700">No manual content yet</p>
            <p className="mt-1 max-w-md text-[13.5px] text-slate-500">Videos and photos added to this manual will appear here.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {DOCS.length > 0 && (
              <section>
                <h2 className="mb-4 text-[12px] font-black uppercase tracking-[0.1em] text-slate-400">Manuals</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {DOCS.map((d) => {
                    const Icon = d.Icon;
                    return (
                      <a
                        key={d.src}
                        href={d.src}
                        download
                        className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                      >
                        {/* top accent rail — the workspace colour */}
                        <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${d.from}, ${d.to})` }} />
                        {/* shine sweep on hover */}
                        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -translate-x-[200%] -skew-x-12 bg-gradient-to-r from-transparent via-slate-100/70 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[260%]" />

                        <div className="relative flex items-start gap-3.5">
                          <span
                            className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg transition-transform group-hover:scale-105"
                            style={{ background: `linear-gradient(135deg, ${d.from}, ${d.to})`, boxShadow: `0 12px 26px -12px ${d.to}cc` }}
                          >
                            <Icon size={24} strokeWidth={2.2} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <FileText size={13} className="shrink-0 text-slate-400" />
                              <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-slate-400">{d.size}</span>
                            </div>
                            <h3 className="mt-0.5 text-[15.5px] font-black leading-tight text-slate-800">{d.title}</h3>
                          </div>
                        </div>

                        <p className="relative mt-3 text-[12.5px] leading-snug text-slate-500">{d.desc}</p>

                        <span
                          className="relative mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl text-[13px] font-extrabold text-white shadow-md transition-transform group-hover:-translate-y-0.5"
                          style={{ background: `linear-gradient(135deg, ${d.from}, ${d.to})`, boxShadow: `0 10px 22px -10px ${d.to}aa` }}
                        >
                          <Download size={15} strokeWidth={2.5} /> Download
                        </span>
                      </a>
                    );
                  })}
                </div>
              </section>
            )}

            {VIDEOS.length > 0 && (
              <section>
                <h2 className="mb-4 text-[12px] font-black uppercase tracking-[0.1em] text-slate-400">Videos</h2>
                <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
                  {VIDEOS.map((v) => (
                    <figure key={v.src} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <video controls preload="metadata" className="w-full bg-black" style={{ aspectRatio: "16 / 9" }}>
                        <source src={v.src} />
                        Your browser does not support the video tag.
                      </video>
                      <figcaption className="px-4 py-3 text-[13.5px] font-bold text-slate-700">{v.title}</figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            )}

            {PHOTOS.length > 0 && (
              <section>
                <h2 className="mb-4 text-[12px] font-black uppercase tracking-[0.1em] text-slate-400">Photos</h2>
                <div className="grid grid-cols-3 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
                  {PHOTOS.map((p) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <a key={p.src} href={p.src} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                      <img src={p.src} alt={p.title} className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      <div className="px-3 py-2 text-[12.5px] font-semibold text-slate-600">{p.title}</div>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
      <DashboardFooter />
    </>
  );
}
