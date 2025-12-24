export default function GlassCard({
  title,
  subtitle,
  right,
  children,
  className = "",
}) {
  return (
    <section className={`glass-card ${className}`}>
      {(title || subtitle || right) && (
        <div className="glass-card__head">
          <div>
            {title && <h1 className="glass-title">{title}</h1>}
            {subtitle && <p className="glass-subtitle">{subtitle}</p>}
          </div>

          {right ? <div className="glass-card__right">{right}</div> : null}
        </div>
      )}

      {children ? <div className="glass-card__body">{children}</div> : null}
    </section>
  );
}
