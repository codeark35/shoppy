import { Link } from 'react-router-dom';

interface SectionTitleProps {
  title: string;
  linkText?: string;
  linkTo?: string;
}

export function SectionTitle({ title, linkText, linkTo }: SectionTitleProps) {
  return (
    <div className="section-title">
      <h2 className="section-title__text">{title}</h2>
      {linkText && linkTo && (
        <Link to={linkTo} className="section-title__link">{linkText} →</Link>
      )}
    </div>
  );
}
