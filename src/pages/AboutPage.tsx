import React from 'react';
import { User, Cpu, Sparkles, Compass } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

interface AboutPageProps {
  onNavigate: (page: 'home' | 'track' | 'about' | 'privacy' | 'feedback') => void;
}

interface TeamMember {
  name: string;
  role: string;
  description: string;
  responsibilities: string[];
  photo?: string;
  isLeader?: boolean;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const teamMembers: TeamMember[] = [
    {
      name: 'Sahejpreet Singh',
      role: 'Team Leader & Frontend Developer',
      description:
        'Led the SETU project and designed the frontend experience, focusing on a clean, intuitive, and engaging interface that brings the railway prediction system to life.',
      responsibilities: [
        'Team leadership',
        'Frontend design and development',
        'UI/UX implementation',
        'SETU visual experience',
      ],
      photo: '/sahej.jpeg',
      isLeader: true,
    },
    {
      name: 'Ayush Kumar',
      role: 'Backend Developer',
      description:
        "Worked on the backend architecture and implementation, helping build the core systems that power SETU's train data and prediction workflow.",
      responsibilities: [
        'Backend development',
        'API/backend integration',
        'Core system implementation',
      ],
      photo: '/ayush.jpeg',
      isLeader: false,
    },
    {
      name: 'Jay Kumar',
      role: 'Research & Backend',
      description:
        "Contributed to the research behind SETU and supported the backend development, helping connect the project's technical approach with the problem it aims to solve.",
      responsibilities: [
        'Research',
        'Backend development support',
        'Technical problem analysis',
      ],
      photo: '/jax.jpeg',
      isLeader: false,
    },
    {
      name: 'MahaVidhya Diwedi',
      role: 'Presentation & Media',
      description:
        "Contributed to the project's presentation and media work, helping communicate SETU's idea clearly through the pitch deck and video content.",
      responsibilities: [
        'PPT / presentation',
        'Video content',
        'Project communication',
      ],
      photo: '/disha.jpeg',
      isLeader: false,
    },
  ];

  return (
    <div className="about-page">
      <Navbar activePage="about" onNavigate={onNavigate} />

      <main className="about-main-container">
        {/* Header Hero */}
        <section className="about-hero-section">
          <div className="about-brand-tag">
            <span className="brand-pill">SETU INITIATIVE</span>
          </div>
          <h1 className="about-main-title">SETU</h1>
          <p className="about-tagline">“Bridging Every Journey Together”</p>
          <div className="about-divider-line" />
          <p className="about-description">
            SETU is an advanced predictive railway intelligence platform engineered to transform Indian Railways travel. By analyzing weather disruptions, loop-line precedence, and compounding network bottlenecks, SETU delivers accurate live delay predictions—bringing clarity, confidence, and peace of mind to every passenger across Bharat.
          </p>
        </section>

        {/* Pillars / Key Focus */}
        <section className="about-pillars-grid">
          <div className="pillar-card glass-panel">
            <div className="pillar-icon-box">
              <Cpu size={22} className="pillar-icon" />
            </div>
            <h3 className="pillar-title">Predictive Intelligence</h3>
            <p className="pillar-desc">
              Context-aware ETA forecasting that accounts for operational precedence and weather factors.
            </p>
          </div>

          <div className="pillar-card glass-panel">
            <div className="pillar-icon-box">
              <Sparkles size={22} className="pillar-icon" />
            </div>
            <h3 className="pillar-title">Passenger Transparency</h3>
            <p className="pillar-desc">
              Real-time insights detailing not just when a train will arrive, but why delays occur.
            </p>
          </div>

          <div className="pillar-card glass-panel">
            <div className="pillar-icon-box">
              <Compass size={22} className="pillar-icon" />
            </div>
            <h3 className="pillar-title">Seamless Experience</h3>
            <p className="pillar-desc">
              Minimalist, responsive, and accessible design built for mobile and desktop presentations.
            </p>
          </div>
        </section>

        {/* Team Members Section */}
        <section className="about-team-section">
          <h2 className="team-section-heading">Project Team</h2>
          <p className="team-section-sub">
            The minds and creators behind SETU
          </p>

          <div className="team-grid">
            {teamMembers.map((member, idx) => (
              <div
                key={idx}
                className={`team-member-card glass-panel ${
                  member.isLeader ? 'team-leader-card' : ''
                }`}
              >
                {/* Team Leader Badge Slot */}
                <div className="card-top-slot">
                  {member.isLeader ? (
                    <span className="leader-pill">TEAM LEADER</span>
                  ) : (
                    <span className="slot-placeholder" />
                  )}
                </div>

                {/* Member Photo / Avatar */}
                <div className={`member-photo-wrapper ${member.isLeader ? 'leader-photo-glow' : ''}`}>
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="member-photo"
                      loading="lazy"
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      <User size={38} strokeWidth={1.5} />
                    </div>
                  )}
                </div>

                <h3 className="member-name">{member.name}</h3>
                <span className="member-role">{member.role}</span>
                <p className="member-bio">{member.description}</p>

                {/* Responsibilities */}
                <div className="responsibilities-section">
                  <span className="responsibilities-title">Responsibilities</span>
                  <ul className="responsibilities-list">
                    {member.responsibilities.map((resp, rIdx) => (
                      <li key={rIdx}>
                        <span className={`resp-dot ${member.isLeader ? 'leader-dot' : ''}`} />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer onNavigate={onNavigate} />

      <style>{`
        .about-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #080d15;
          color: #ffffff;
        }

        .about-main-container {
          flex: 1;
          max-width: 1280px;
          margin: 0 auto;
          width: 100%;
          padding: 50px 24px 60px 24px;
        }

        .about-hero-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 56px;
        }

        .about-brand-tag {
          margin-bottom: 16px;
        }

        .brand-pill {
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #df9b3e;
          background: rgba(223, 155, 62, 0.12);
          border: 1px solid rgba(223, 155, 62, 0.35);
          padding: 5px 14px;
          border-radius: 9999px;
        }

        .about-main-title {
          font-family: var(--font-serif);
          font-size: 48px;
          font-weight: 700;
          letter-spacing: 6px;
          color: #ffffff;
          margin-bottom: 8px;
        }

        .about-tagline {
          font-family: var(--font-serif);
          font-style: italic;
          font-size: 20px;
          color: #df9b3e;
          margin-bottom: 20px;
        }

        .about-divider-line {
          width: 60px;
          height: 2px;
          background: #3b82f6;
          border-radius: 2px;
          margin-bottom: 24px;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.6);
        }

        .about-description {
          max-width: 760px;
          font-size: 16px;
          line-height: 1.7;
          color: #cbd5e1;
        }

        /* Pillars */
        .about-pillars-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 64px;
        }

        .pillar-card {
          padding: 28px 24px;
          background: rgba(14, 23, 38, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .pillar-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #60a5fa;
        }

        .pillar-title {
          font-size: 17px;
          font-weight: 600;
          color: #ffffff;
        }

        .pillar-desc {
          font-size: 14px;
          line-height: 1.6;
          color: #94a3b8;
        }

        /* Team Section */
        .about-team-section {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .team-section-heading {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 6px;
        }

        .team-section-sub {
          font-size: 14.5px;
          color: #94a3b8;
          margin-bottom: 36px;
        }

        .team-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 22px;
          width: 100%;
        }

        .team-member-card {
          padding: 22px 20px 24px 20px;
          background: rgba(14, 23, 38, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
          position: relative;
        }

        .team-member-card:hover {
          transform: translateY(-4px);
          border-color: rgba(223, 155, 62, 0.4);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.3);
        }

        .team-leader-card {
          border-color: rgba(223, 155, 62, 0.35);
          background: linear-gradient(180deg, rgba(223, 155, 62, 0.06) 0%, rgba(14, 23, 38, 0.85) 40%);
          box-shadow: 0 8px 30px rgba(223, 155, 62, 0.08);
        }

        .team-leader-card:hover {
          border-color: rgba(243, 207, 122, 0.6);
          box-shadow: 0 12px 36px rgba(223, 155, 62, 0.18);
        }

        .card-top-slot {
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          width: 100%;
        }

        .leader-pill {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: #f3cf7a;
          background: linear-gradient(135deg, rgba(223, 155, 62, 0.22), rgba(180, 83, 9, 0.25));
          border: 1px solid rgba(243, 207, 122, 0.45);
          padding: 3px 12px;
          border-radius: 9999px;
          text-transform: uppercase;
          box-shadow: 0 0 12px rgba(243, 207, 122, 0.2);
        }

        .slot-placeholder {
          display: block;
          height: 18px;
        }

        .member-photo-wrapper {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          margin-bottom: 14px;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.14);
          background: rgba(255, 255, 255, 0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
          flex-shrink: 0;
        }

        .leader-photo-glow {
          border-color: rgba(243, 207, 122, 0.65);
          box-shadow: 0 0 18px rgba(223, 155, 62, 0.25);
        }

        .member-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          display: block;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(145deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.85));
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
        }

        .member-name {
          font-size: 16.5px;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 4px;
          line-height: 1.25;
        }

        .member-role {
          font-size: 12px;
          color: #df9b3e;
          font-weight: 500;
          margin-bottom: 12px;
          min-height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1.35;
        }

        .member-bio {
          font-size: 12px;
          line-height: 1.55;
          color: #cbd5e1;
          margin-bottom: 16px;
          flex-grow: 1;
        }

        .responsibilities-section {
          width: 100%;
          text-align: left;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .responsibilities-title {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1.2px;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 8px;
          display: block;
        }

        .responsibilities-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .responsibilities-list li {
          font-size: 11.5px;
          color: #cbd5e1;
          display: flex;
          align-items: center;
          gap: 7px;
          line-height: 1.3;
        }

        .resp-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #38bdf8;
          flex-shrink: 0;
        }

        .leader-dot {
          background: #df9b3e;
        }

        @media (max-width: 1100px) {
          .team-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
          .about-pillars-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .team-grid {
            grid-template-columns: 1fr;
          }
          .about-main-title {
            font-size: 36px;
          }
          .about-main-container {
            padding: 36px 18px 48px 18px;
          }
        }
      `}</style>
    </div>
  );
};
