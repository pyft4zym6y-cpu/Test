import { CONTACTS } from '../data/program';

export default function Footer() {
  return (
    <footer className="bg-[#FF0000] px-6 py-14">
      <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <div className="font-italiana text-xl uppercase tracking-[0.15em]">
            Commerce Architecture
          </div>
          <p className="text-white/80 text-[13px] mt-2 max-w-sm leading-relaxed">
            Школа e-commerce. Частина екосистеми weexp · Commerce OS™.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-[13px] uppercase tracking-wider">
          <a href={CONTACTS.agency} target="_blank" rel="noreferrer" className="hover:underline">
            weexp.agency
          </a>
          <a
            href={CONTACTS.agencyAbout}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
          >
            Про засновника
          </a>
          <a href={CONTACTS.linkedin} target="_blank" rel="noreferrer" className="hover:underline">
            LinkedIn
          </a>
          <a href={`mailto:${CONTACTS.email}`} className="hover:underline">
            Email
          </a>
        </div>
      </div>
      <div className="max-w-[1100px] mx-auto mt-10 pt-6 border-t border-white/25 text-white/70 text-[12px]">
        © {new Date().getFullYear()} Commerce Architecture · Засновник — Павло Сідоренко
      </div>
    </footer>
  );
}
