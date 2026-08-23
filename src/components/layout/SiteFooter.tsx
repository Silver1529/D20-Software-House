import { company, isPending, nav } from '../../content/site'
import { Pending } from '../ui/Pending'
import './site-footer.css'

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="u-shell site-footer-inner">
        <div className="site-footer-brand">
          <img
            className="site-footer-mark"
            src="/icons/d20-mark.png"
            alt=""
            width={44}
            height={44}
            loading="lazy"
            decoding="async"
          />
          <p className="site-footer-wordmark">
            D20 <span>Software House</span>
          </p>
          <p className="site-footer-tagline">{company.tagline}</p>
        </div>

        <nav className="site-footer-nav" aria-label="Navegação do rodapé">
          <ul>
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <dl className="site-footer-meta">
          <div>
            <dt className="u-data">CNPJ</dt>
            <dd>
              {isPending(company.cnpj) ? <Pending label="a informar" /> : company.cnpj}
            </dd>
          </div>
          <div>
            <dt className="u-data">Base</dt>
            <dd>
              {isPending(company.city) ? <Pending label="a informar" /> : company.city}
            </dd>
          </div>
        </dl>
      </div>

      <div className="u-shell site-footer-rule">
        <p className="u-data">
          © {year} {company.name}
        </p>
        <p className="u-data site-footer-signature">
          Construído com um d20 e nenhum template
        </p>
      </div>
    </footer>
  )
}
