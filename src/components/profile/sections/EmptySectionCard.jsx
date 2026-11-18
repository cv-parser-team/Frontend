import { Plus } from 'lucide-react';
import './EmptySectionCard.css';

const SECTION_PROMPTS = {
  exp: {
    title: 'No work experience added yet',
    desc: 'Add past jobs, internships, or contracts to showcase your career journey.',
    cta: 'Add work experience',
  },
  edu: {
    title: 'No education history added yet',
    desc: 'Add your degrees, schools, or academic qualifications.',
    cta: 'Add education',
  },
  skills: {
    title: 'No skills added yet',
    desc: 'Highlight technical competencies, tools, and frameworks you specialize in.',
    cta: 'Add skill',
  },
  proj: {
    title: 'No projects added yet',
    desc: 'Showcase apps, open-source work, or portfolio projects you’ve built.',
    cta: 'Add project',
  },
  cert: {
    title: 'No certifications added yet',
    desc: 'Add professional certificates, licenses, or credentials.',
    cta: 'Add certification',
  },
  languages: {
    title: 'No languages added yet',
    desc: 'Add languages you speak and your proficiency levels.',
    cta: 'Add language',
  },
  summary: {
    title: 'No professional summary written yet',
    desc: 'Write a brief overview highlighting your background and career goals.',
    cta: 'Write summary',
  },
};

export default function EmptySectionCard({ type, label, onAdd }) {
  const prompt = SECTION_PROMPTS[type] || {
    title: `No ${label} added yet`,
    desc: `Add your ${label} details to strengthen your profile.`,
    cta: `Add ${label}`,
  };

  return (
    <div
      className="empty-section-card"
      onClick={onAdd}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onAdd();
        }
      }}
    >
      <div className="empty-card-left">
        <div className="empty-card-icon-bubble">
          <Plus size={18} />
        </div>
        <div className="empty-card-text">
          <h4 className="empty-card-title">{prompt.title}</h4>
          <p className="empty-card-desc">{prompt.desc}</p>
        </div>
      </div>
      <button
        type="button"
        className="btn empty-card-action-btn"
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
      >
        <Plus size={14} />
        <span>{prompt.cta}</span>
      </button>
    </div>
  );
}
