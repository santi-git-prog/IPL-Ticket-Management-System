import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { getTeamLogo } from '../utils/teamLogos';
import './Matches.css';

interface Match {
  id: number;
  title: string;
  team1: string;
  team2: string;
  date_time: string;
  venue: string;
}

export const Matches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user email from localStorage
    const savedEmail = localStorage.getItem('userEmail');
    setUserEmail(savedEmail);

    const fetchMatches = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/matches');
        setMatches(response.data);
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const getInitial = (email: string | null) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  return (
    <div className="matches-container">
      <div className="matches-blobs">
        <div className="blob matches-blob-1"></div>
        <div className="blob matches-blob-2"></div>
        <div className="blob matches-blob-3"></div>
      </div>

      <div className="matches-header">
        <div className="matches-logo-box">
          <img src="/logo/ipl.png" alt="Satrix Logo" className="header-logo" />
          <h2 className="satrix-title">Satrix</h2>
        </div>
        <div className="header-actions">
          <div className="user-profile-circle">
            <div className="profile-initial">{getInitial(userEmail)}</div>
            <div className="profile-email-tooltip">{userEmail || 'User'}</div>
          </div>
          <button 
            className="logout-btn" 
            onClick={() => {
              localStorage.removeItem('userEmail');
              localStorage.removeItem('token');
              navigate('/login');
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="matches-content">
        <div className="title-section">
          <div className="badge">TATA IPL 2026</div>
          <h1>Upcoming Fixtures</h1>
          <p>Book your tickets and witness the ultimate cricketing battles live with Satrix.</p>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading fixtures...</p>
          </div>
        ) : (
          <>
            <div className="matches-grid">
              {matches.slice(0, visibleCount).map((match) => (
                <div 
                  key={match.id} 
                  className="match-card" 
                  onClick={() => navigate(`/matches/${match.id}`)}
                >
                  <div className="match-card-top">
                    <span className="match-title">{match.title}</span>
                  </div>
                  <div className="match-teams">
                    <div className="team">
                      <img src={getTeamLogo(match.team1)} alt={match.team1} className="team-logo-img" />
                      <span className="team-name">{match.team1}</span>
                    </div>
                    <div className="vs-badge">VS</div>
                    <div className="team">
                      <img src={getTeamLogo(match.team2)} alt={match.team2} className="team-logo-img" />
                      <span className="team-name">{match.team2}</span>
                    </div>
                  </div>
                  <div className="match-details">
                    <div className="detail-item">
                      <Calendar size={16} className="detail-icon" />
                      <span>{match.date_time}</span>
                    </div>
                    <div className="detail-item">
                      <MapPin size={16} className="detail-icon" />
                      <span>{match.venue}</span>
                    </div>
                  </div>
                  <div className="match-action">
                    <span>View Details & Book</span>
                    <ArrowRight size={18} className="action-icon" />
                  </div>
                </div>
              ))}
            </div>
            
            {visibleCount < matches.length && (
              <div className="show-more-container">
                <button 
                  className="show-more-btn" 
                  onClick={() => setVisibleCount(matches.length)}
                >
                  Show More Matches
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
