export function SectionCard({ title, description, children }) {
  return (
    <section className="section-card">
      <div className="section-head">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}
