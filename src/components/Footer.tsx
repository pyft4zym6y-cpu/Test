import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 md:px-10 py-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <p className="text-xs text-white/60">
          Відкриті до Diagnostic Sprint, Program of Record або Fractional Lead.{' '}
          <Link to="/contact" className="text-[#A3E635] hover:text-[#bdff4d] transition-colors">
            Забронювати сесію
          </Link>
        </p>
        <p className="text-xs text-white/60 sm:text-right font-mono">
          © 2026 weexp · Commerce OS · linkedin.com/in/pvsidorenko
        </p>
      </div>
    </footer>
  );
}
