import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Calendar, MapPin, ArrowRight, ArrowLeft, Trash2 } from 'lucide-react';
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
  user_email?: string;
  stadium_name?: string;
  stadium_city?: string;
}

interface BookingSummary {
  match_id: number;
  match_title: string;
  stadium_name: string;
  stadium_city: string;
  total_bookings: number;
  total_tickets_sold: number;
  total_revenue: number;
}

export const Matches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [filterTeams, setFilterTeams] = useState<string[]>([]);
  const [filterDate, setFilterDate] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'matches' | 'bookings' | 'admin'>('matches');
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [adminSummary, setAdminSummary] = useState<BookingSummary[]>([]);
  const [allBookings, setAllBookings] = useState<BookingRecord[]>([]);
  const [adminTab, setAdminTab] = useState<'summary' | 'details' | 'match'>('summary');
  const [selectedMatchTitle, setSelectedMatchTitle] = useState<string>('');
  const [matchStands, setMatchStands] = useState<any[]>([]);
  const [showAll, setShowAll] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user details from localStorage
    const savedEmail = localStorage.getItem('userEmail');
    const savedName = localStorage.getItem('username');
    const savedAdmin = localStorage.getItem('isAdmin') === 'true';
    setUserEmail(savedEmail);
    setUserName(savedName);
    setIsAdmin(savedAdmin);

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

    if (activeTab === 'admin' && isAdmin) {
      const fetchAdminData = async () => {
        try {
          if (adminTab === 'summary') {
            const res = await axios.get('http://localhost:5000/api/admin/booking-summary');
            setAdminSummary(res.data);
          } else if (adminTab === 'details') {
            const res = await axios.get('http://localhost:5000/api/admin/booking-details');
            setAllBookings(res.data);
          }
        } catch (error) {
          console.error('Error fetching admin data:', error);
        }
      };
      fetchAdminData();
    }
  }, [activeTab, userEmail, isAdmin, adminTab]);

  const handleAdminMatchClick = async (matchId: number, matchTitle: string) => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/admin/match-bookings/${matchId}`);
      setAllBookings(res.data);
      
      // Fetch stand availability for the match
      const standsRes = await axios.get(`http://localhost:5000/api/matches/${matchId}/stands`);
      setMatchStands(standsRes.data);

      setSelectedMatchTitle(matchTitle);
      setActiveTab('admin');
      setAdminTab('match');
    } catch (error) {
      console.error('Error fetching specific match bookings:', error);
    } finally {
      setLoading(false);
    }
  };


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
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const matchDateObj = parseMatchDate(m.date_time);
    const isPast = !isNaN(matchDateObj.getTime()) && matchDateObj < today;

    let dateMatch = true;
    if (filterDate) {
      const selectedDateObj = new Date(filterDate);
      selectedDateObj.setHours(0, 0, 0, 0);
      
      if (!isNaN(matchDateObj.getTime())) {
        dateMatch = matchDateObj >= selectedDateObj;
      }
    }
    
    // Default view: Show all upcoming matches (including those > 5 days)
    if (!showAll && isPast) return false;

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

  const getBookingCountdown = (matchDateStr: string) => {
    const matchDate = parseMatchDate(matchDateStr);
    const bookingOpenDate = new Date(matchDate.getTime() - (5 * 24 * 60 * 60 * 1000));
    bookingOpenDate.setHours(0, 0, 0, 0);
    
    const now = new Date();
    const diff = bookingOpenDate.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { days, hours, mins };
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
              localStorage.removeItem('isAdmin');
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
          <h1>
            {activeTab === 'matches' 
              ? (showAll ? 'All Fixtures' : 'Upcoming Fixtures') 
              : 'My Ticket Bookings'}
          </h1>
          <p>
            {activeTab === 'matches' 
              ? (showAll 
                  ? 'Viewing all matches including recently completed and future fixtures.'
                  : 'Viewing matches with bookings open now (within next 5 days).')
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
          {!isAdmin && (
            <button 
              className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              My Bookings
            </button>
          )}
          {isAdmin && (
            <button 
              className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              Admin Dashboard
            </button>
          )}
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
              {filteredMatches.slice(0, visibleCount).map((match) => (() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const matchDateObj = parseMatchDate(match.date_time);
                  const isPast = !isNaN(matchDateObj.getTime()) && matchDateObj < today;
                  
                  // Calculate days until match
                  const diffTime = matchDateObj.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  
                  const isBookingOpen = !isPast && diffDays <= 5;
                  const isUpcoming = !isPast && diffDays > 5;

                  return (
                    <div 
                      key={match.id} 
                      className={`match-card ${isAdmin ? 'admin-mode' : ''} ${isPast ? 'past-match' : ''} ${isUpcoming ? 'upcoming-match' : ''}`} 
                      onClick={() => {
                        if ((isPast || isUpcoming) && !isAdmin) return;
                        isAdmin ? handleAdminMatchClick(match.id, match.title) : navigate(`/matches/${match.id}`)
                      }}
                      style={{ cursor: ((isPast || isUpcoming) && !isAdmin) ? 'default' : 'pointer' }}
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
                          <span>{match.venue.split(',')[0].trim()}</span>
                        </div>
                      </div>
                      <div className="match-action">
                        {isPast ? (
                          <span className="completed-badge">Completed</span>
                        ) : isUpcoming ? (
                          (() => {
                            const countdown = getBookingCountdown(match.date_time);
                            return countdown ? (
                              <div className="booking-countdown">
                                <span className="countdown-label">Bookings open in</span>
                                <div className="timer-values">
                                  <span>{countdown.days}d</span>
                                  <span>{countdown.hours}h</span>
                                  <span>{countdown.mins}m</span>
                                </div>
                              </div>
                            ) : (
                              <>
                                <span>{isAdmin ? 'View Match Analytics' : 'View Details & Book'}</span>
                                <ArrowRight size={18} className="action-icon" />
                              </>
                            );
                          })()
                        ) : (
                          <>
                            <span>{isAdmin ? 'View Match Analytics' : 'View Details & Book'}</span>
                            <ArrowRight size={18} className="action-icon" />
                          </>
                        )}
                      </div>
                    </div>
                  );
                })())}
            </div>
            
            <div className="show-more-container">
              {showAll ? (
                <button 
                  className="show-more-btn" 
                  onClick={() => { setShowAll(false); setVisibleCount(10); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'none' }}
                >
                  <ArrowLeft size={16} /> Back to Upcoming Matches
                </button>
              ) : (
                filteredMatches.length > 0 && (
                  <button 
                    className="show-more-btn outline" 
                    onClick={() => { setShowAll(true); setVisibleCount(matches.length); }}
                  >
                    View Completed Matches
                  </button>
                )
              )}
            </div>
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
        ) : activeTab === 'admin' ? (
          <div className="admin-section">
            <div className="admin-tabs">
              <button 
                className={`admin-sub-tab ${adminTab === 'summary' ? 'active' : ''}`}
                onClick={() => setAdminTab('summary')}
              >
                Booking Summary
              </button>
              <button 
                className={`admin-sub-tab ${adminTab === 'details' ? 'active' : ''}`}
                onClick={() => setAdminTab('details')}
              >
                All Bookings
              </button>
              {adminTab === 'match' && (
                <button className="admin-sub-tab active">
                  Bookings for {selectedMatchTitle}
                </button>
              )}
            </div>

            {adminTab === 'summary' ? (
              <div className="bookings-table-container">
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>Match Details</th>
                      <th>Stadium</th>
                      <th>Bookings</th>
                      <th>Tickets</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminSummary.map((item) => (
                      <tr key={item.match_id}>
                        <td><strong>{item.match_title}</strong></td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>{item.stadium_name}</span>
                            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{item.stadium_city}</span>
                          </div>
                        </td>
                        <td>{item.total_bookings}</td>
                        <td>{item.total_tickets_sold}</td>
                        <td><span className="booking-amount">₹{item.total_revenue.toLocaleString()}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bookings-table-container">
                {adminTab === 'match' && (
                  <div className="match-filter-indicator">
                    <span>Showing bookings only for: <strong>{selectedMatchTitle}</strong></span>
                    <button onClick={() => { setAdminTab('summary'); setMatchStands([]); }} className="clear-match-filter">View All Matches</button>
                  </div>
                )}

                {adminTab === 'match' && matchStands.length > 0 && (
                  <div className="admin-stands-availability">
                    <h4>Stands Availability</h4>
                    <table className="bookings-table stands-availability-table" style={{ marginBottom: '2rem' }}>
                      <thead>
                        <tr>
                          <th>Stand Name</th>
                          <th>Capacity</th>
                          <th>Sold</th>
                          <th>Remaining</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matchStands.map((stand, idx) => (
                          <tr key={idx}>
                            <td>{stand.name}</td>
                            <td>{stand.capacity}</td>
                            <td>{stand.capacity - Number(stand.available_capacity)}</td>
                            <td style={{ color: Number(stand.available_capacity) < (stand.capacity * 0.15) ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
                              {stand.available_capacity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <h4>Recent Bookings</h4>
                  </div>
                )}

                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Match & Stand</th>
                      <th>Qty</th>
                      <th>Amount</th>
                      <th>Payment ID</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td><span style={{ fontSize: '0.85rem' }}>{booking.user_email}</span></td>
                        <td>
                          <div className="booking-ticket-info">
                            <span className="booking-match-title">{booking.match_title}</span>
                            <span className="booking-stand">{booking.stand_name}</span>
                          </div>
                        </td>
                        <td>{booking.quantity}</td>
                        <td><span className="booking-amount">₹{booking.total_amount.toLocaleString()}</span></td>
                        <td><code style={{ fontSize: '0.75rem' }}>{booking.payment_id}</code></td>
                        <td>{new Date(booking.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
