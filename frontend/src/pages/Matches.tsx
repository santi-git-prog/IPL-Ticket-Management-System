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

interface BookingRecord {
  id: number;
  match_title: string;
  stand_name: string;
  quantity: number;
  total_amount: number;
  payment_id: string;
  created_at: string;
}

export const Matches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [filterTeams, setFilterTeams] = useState<string[]>([]);
  const [filterDate, setFilterDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'matches' | 'bookings'>('matches');
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user details from localStorage
    const savedEmail = localStorage.getItem('userEmail');
    const savedName = localStorage.getItem('username');
    setUserEmail(savedEmail);
    setUserName(savedName);

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

  useEffect(() => {
    if (activeTab === 'bookings' && userEmail) {
      const fetchBookings = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/api/payments/my-bookings?email=${userEmail}`);
          setBookings(response.data);
        } catch (error) {
          console.error('Error fetching bookings:', error);
        }
      };
      fetchBookings();
    }
  }, [activeTab, userEmail]);

  const getInitial = () => {
    if (userName && userName.length > 0) return userName.charAt(0).toUpperCase();
    if (userEmail && userEmail.length > 0) return userEmail.charAt(0).toUpperCase();
    return 'U';
  };

  const uniqueTeams = Array.from(new Set(matches.flatMap(m => [m.team1, m.team2]))).sort();

  const parseMatchDate = (dateString: string) => {
    try {
      let cleanDatePart = "";
      
      if (dateString.includes('-')) {
        // Handle format like "28-MAR-26 7:30 PM"
        const parts = dateString.split(' ');
        cleanDatePart = parts[0]; // "28-MAR-26"
      } else if (dateString.includes(',')) {
        // Handle format like "Sat, 25 Apr, 3:30 PM"
        const parts = dateString.split(',');
        if (parts.length >= 2) {
          cleanDatePart = parts[1].trim() + " " + new Date().getFullYear(); // "25 Apr 2026"
        }
      } else {
        // Fallback for other formats
        cleanDatePart = dateString.split(/[-|]/)[0].trim();
      }

      let parsedDate = new Date(cleanDatePart);
      
      // If parsing failed, try manual extraction for DD-MMM-YY
      if (isNaN(parsedDate.getTime()) && cleanDatePart.includes('-')) {
        const dmy = cleanDatePart.split('-');
        if (dmy.length === 3) {
          // Assuming DD-MMM-YY or DD-MMM-YYYY
          parsedDate = new Date(`${dmy[1]} ${dmy[0]}, ${dmy[2].length === 2 ? '20' + dmy[2] : dmy[2]}`);
        }
      }

      parsedDate.setHours(0, 0, 0, 0);
      return parsedDate;
    } catch (e) {
      console.error("Date parsing error for:", dateString, e);
      return new Date(NaN);
    }
  };

  const filteredMatches = matches.filter(m => {
    const teamMatch = filterTeams.length === 0 || filterTeams.includes(m.team1) || filterTeams.includes(m.team2);
    
    let dateMatch = true;
    if (filterDate) {
      const selectedDateObj = new Date(filterDate);
      selectedDateObj.setHours(0, 0, 0, 0);
      const matchDateObj = parseMatchDate(m.date_time);
      
      if (!isNaN(matchDateObj.getTime())) {
        dateMatch = matchDateObj >= selectedDateObj;
      }
    }
    
    return teamMatch && dateMatch;
  });

  const toggleTeam = (team: string) => {
    setFilterTeams(prev => 
      prev.includes(team) 
        ? prev.filter(t => t !== team) 
        : [...prev, team]
    );
    setVisibleCount(10);
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
            <div className="profile-initial">{getInitial()}</div>
            <div className="profile-email-tooltip">{userEmail}</div>
          </div>
          <button 
            className="logout-btn" 
            onClick={() => {
              localStorage.removeItem('userEmail');
              localStorage.removeItem('username');
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
          <h1>{activeTab === 'matches' ? 'Upcoming Fixtures' : 'My Ticket Bookings'}</h1>
          <p>
            {activeTab === 'matches' 
              ? 'Book your tickets and witness the ultimate cricketing battles live with Satrix.' 
              : 'Managing your confirmed ticket purchases and match day details.'}
          </p>
        </div>

        <div className="tabs-navigation">
          <button 
            className={`tab-btn ${activeTab === 'matches' ? 'active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            Matches
          </button>
          <button 
            className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            My Bookings
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading fixtures...</p>
          </div>
        ) : activeTab === 'matches' ? (
          <>
            <div className="matches-filters">
              <div className="team-filter-section">
                <label>Filter by Teams</label>
                <div className="team-logos-grid">
                  {uniqueTeams.map(team => (
                    <div 
                      key={team} 
                      className={`team-logo-filter-item ${filterTeams.includes(team) ? 'active' : ''}`}
                      onClick={() => toggleTeam(team)}
                    >
                      <img src={getTeamLogo(team)} alt={team} className="filter-team-logo" />
                      <span>{team}</span>
                    </div>
                  ))}
                </div>
                {filterTeams.length > 0 && (
                  <button className="clear-selection-link" onClick={() => setFilterTeams([])}>
                    Clear Selection
                  </button>
                )}
              </div>

              <div className="filter-group date-filter-group">
                <label>Matches from Date</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="date" 
                    value={filterDate} 
                    onChange={(e) => { setFilterDate(e.target.value); setVisibleCount(10); }}
                    className="date-filter-input"
                  />
                  {filterDate && (
                    <button 
                      onClick={() => { setFilterDate(''); setVisibleCount(10); }}
                      className="clear-date-btn"
                      title="Clear Date Filter"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="matches-grid">
              {filteredMatches.slice(0, visibleCount).map((match) => (
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
            
            {visibleCount < filteredMatches.length && (
              <div className="show-more-container">
                <button 
                  className="show-more-btn" 
                  onClick={() => setVisibleCount(filteredMatches.length)}
                >
                  Show More Matches
                </button>
              </div>
            )}
          </>
        ) : activeTab === 'bookings' ? (
          <div className="bookings-section">
            {bookings.length > 0 ? (
              <div className="bookings-table-container">
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>Match & Seat Details</th>
                      <th>Qty</th>
                      <th>Amount</th>
                      <th>Payment ID</th>
                      <th>Booking Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>
                          <div className="booking-ticket-info">
                            <span className="booking-match-title">{booking.match_title}</span>
                            <span className="booking-stand">{booking.stand_name}</span>
                          </div>
                        </td>
                        <td>{booking.quantity}</td>
                        <td>
                          <span className="booking-amount">₹{booking.total_amount.toLocaleString()}</span>
                        </td>
                        <td>
                          <code style={{ fontSize: '0.75rem', opacity: 0.6 }}>{booking.payment_id}</code>
                        </td>
                        <td>
                          <span className="booking-date">
                            {new Date(booking.created_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-bookings-state">
                <p>You haven't booked any tickets yet.</p>
                <button className="show-more-btn" onClick={() => setActiveTab('matches')}>
                  Browse Matches
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
