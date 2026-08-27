function SectionHeading({ eyebrow, title }) {
  return (
    <div className="sec-heading">
      {eyebrow && <span className="sec-eyebrow" dangerouslySetInnerHTML={{ __html: eyebrow }} />}
      <h2 className="sec-title" dangerouslySetInnerHTML={{ __html: title }} />
    </div>
  );
}

export default SectionHeading;
