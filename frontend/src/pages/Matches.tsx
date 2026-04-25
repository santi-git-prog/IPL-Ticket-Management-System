import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, MapPin, ArrowRight, Layout } from 'lucide-react';
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
  const navigate = useNavigate();

  useEffect(() => {
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

  return (
    <div className="matches-container">
      <div className="matches-blobs">
        <div className="blob matches-blob-1"></div>
        <div className="blob matches-blob-2"></div>
        <div className="blob matches-blob-3"></div>
      </div>

      <div className="matches-header">
        <div className="matches-logo-box">
          <Layout className="logo-icon" />
          <h2>IPL Ticket Portal</h2>
        </div>
        <div className="user-profile">
          <img src="https://ui-avatars.com/api/?name=User&background=random" alt="User Profile" />
        </div>
      </div>

      <div className="matches-content">
        <div className="title-section">
          <div className="badge">TATA IPL 2026</div>
          <h1>Upcoming Fixtures</h1>
          <p>Book your tickets and witness the ultimate cricketing battles live.</p>
        </div>

        {loading ? (
          <div className="loading-state">Loading fixtures...</div>
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

// End of file (removed default export)
