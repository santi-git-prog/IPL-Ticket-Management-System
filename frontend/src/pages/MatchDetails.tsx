import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Clock, Users, MapPin, Zap, Info, ShieldCheck, Accessibility, ChevronRight } from 'lucide-react';
import { getTeamLogo } from '../utils/teamLogos';
import './MatchDetails.css';

interface Highlight {
  title: string;
  description: string;
}

interface MatchDetail {
  id: number;
  title: string;
  team1: string;
  team2: string;
  date_time: string;
  venue: string;
  about_text: string;
  highlights: Highlight[];
}

export const MatchDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [minPrice, setMinPrice] = useState<number>(400);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/matches/${id}`);
        setMatch(response.data);
        
        // Fetch stands to find minimum price
        const standsRes = await axios.get(`http://localhost:5000/api/matches/${id}/stands`);
        if (standsRes.data && standsRes.data.length > 0) {
          const prices = standsRes.data.map((s: any) => s.price);
          setMinPrice(Math.min(...prices));
        }
      } catch (error) {
        console.error('Error fetching match details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchDetails();
  }, [id]);

  if (loading) {
    return <div className="details-loading">Loading match details...</div>;
  }

  if (!match) {
    return <div className="details-error">Match not found.</div>;
  }

  return (
    <div className="match-details-container">
      <div className="details-blobs">
        <div className="blob blob-red"></div>
        <div className="blob blob-blue"></div>
      </div>

      <nav className="details-nav">
        <button onClick={() => navigate('/matches')} className="back-btn">
          <ArrowLeft size={20} />
          <span>Back to Matches</span>
        </button>
      </nav>

      <div className="details-hero">
        <div className="hero-content">
          <div className="match-tag">{match.title}</div>
          <div className="teams-heading-container">
            <div className="team-header-item">
              <img src={getTeamLogo(match.team1)} alt={match.team1} className="team-logo-header" />
              <span className="team-highlight">{match.team1}</span> 
            </div>
            <span className="vs-text">VS</span> 
            <div className="team-header-item">
              <img src={getTeamLogo(match.team2)} alt={match.team2} className="team-logo-header" />
              <span className="team-highlight">{match.team2}</span>
            </div>
          </div>
          
          <div className="hero-meta">
            <div className="meta-item">
              <Clock className="meta-icon" />
              <span>{match.date_time}</span>
            </div>
            <div className="meta-divider">|</div>
            <div className="meta-item">
              <MapPin className="meta-icon" />
              <span>{match.venue}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="details-body">
        <div className="main-content">
          <section className="info-section">
            <h2 className="section-title">About the Match</h2>
            <div className="about-text">
              {match.about_text.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section className="info-section highlights-section">
            <h2 className="section-title">Highlights</h2>
            <div className="highlights-grid">
              {match.highlights && match.highlights.map((item, index) => (
                <div key={index} className="highlight-card">
                  <div className="icon-wrapper">
                    <Zap className="highlight-icon" />
                  </div>
                  <div className="highlight-content">
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="sidebar">
          <div className="booking-card">
            <div className="price-info">
              <span className="price-label">Starting from</span>
              <h3 className="price-value">₹{minPrice.toLocaleString()}</h3>
            </div>
            <button 
              className="book-btn"
              onClick={() => navigate(`/booking/${match.id}`)}
            >
              <span>Book Tickets</span>
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="things-to-know">
            <h3>Things to know</h3>
            <ul className="info-list">
              <li>
                <Clock className="list-icon" size={18} />
                <span>Duration: 3 Hours</span>
              </li>
              <li>
                <Info className="list-icon" size={18} />
                <span>Ticket needed for ages 2 and above</span>
              </li>
              <li>
                <Users className="list-icon" size={18} />
                <span>Entry allowed for all ages (Kid friendly)</span>
              </li>
              <li>
                <MapPin className="list-icon" size={18} />
                <span>Layout: Outdoor Seated</span>
              </li>
              <li>
                <ShieldCheck className="list-icon" size={18} />
                <span>Washrooms available</span>
              </li>
              <li>
                <Accessibility className="list-icon" size={18} />
                <span>Wheelchair accessible</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// End of file (removed default export)
