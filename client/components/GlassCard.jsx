import React from "react";

export default function GlassCard({ title, subtitle, rightSlot, children, className = "" }) {
  return (
    <section className={`glass-card ${className}`}>
      <div className="glass-card__top">
        <div>
          {title ? <h1 className="glass-title">{title}</h1> : null}
          {subtitle ? <p className="glass-subtitle">{subtitle}</p> : null}
        </div>
        {rightSlot ? <div className="glass-right">{rightSlot}</div> : null}
      </div>
      {children ? <div className="glass-body">{children}</div> : null}
    </section>
  );
}
