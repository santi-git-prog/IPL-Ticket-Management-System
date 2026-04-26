import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, MapPin, Info, Users, CreditCard } from 'lucide-react';
import './Booking.css';

interface MatchDetail {
  id: number;
  title: string;
  team1: string;
  team2: string;
  date_time: string;
  venue: string;
}

const stadiumImageMap: { [key: string]: string } = {
  'Bangalore': 'Bangalore.jpeg',
  'Chennai': 'Chennai.png',
  'Delhi': 'Delhi.jpg',
  'New Delhi': 'Delhi.jpg',
  'Dharamshala': 'dharamshala.png',
  'Gujarat': 'Gujarat.jpeg',
  'Ahmedabad': 'Gujarat.jpeg',
  'Guwahati': 'Guwhati.jpg',
  'Hyderabad': 'Hyderabad.jpeg',
  'Jaipur': 'Jaipur.jpeg',
  'Kolkata': 'Kolkata.jpeg',
  'Lucknow': 'Lucknow.jpg',
  'Mumbai': 'Mumbai.jpg',
  'New Chandigarh': 'new Chandigarh.jpeg',
  'Raipur': 'Raipur.jpg',
};

export const Booking = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableStands, setAvailableStands] = useState<{ name: string, price: number }[]>([]);
  const [selectedStand, setSelectedStand] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  const getCity = (venue: string | undefined) => {
    if (!venue) return '';
    // Handle both comma-separated and simple city names
    const parts = venue.split(',');
    const city = parts[parts.length - 1].trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
    return city;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching details for Match ID:', id);
        
        // 1. Fetch match info
        const matchRes = await axios.get(`http://localhost:5000/api/matches/${id}`);
        setMatch(matchRes.data);
        
        // 2. Fetch stands directly by match ID (Backend handles city mapping)
        const standsRes = await axios.get(`http://localhost:5000/api/matches/${id}/stands`);
        console.log(`Stands loaded for Match ${id}:`, standsRes.data.length, 'stands found');
        setAvailableStands(standsRes.data);

      } catch (error) {
        console.error('Error fetching booking data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getStadiumImage = (venue: string) => {
    const city = getCity(venue);
    return stadiumImageMap[city] || 'default-stadium.jpg';
  };

  if (loading) return <div className="booking-loading">Loading booking details...</div>;
  if (!match) return <div className="booking-error">Match not found.</div>;

  const stadiumImage = getStadiumImage(match.venue);
  const city = getCity(match.venue);
  const currentStand = availableStands.find(s => s.name === selectedStand);
  
  const baseFare = currentStand ? currentStand.price * quantity : 0;
  const bookingFee = selectedStand ? Math.round(baseFare * 0.05) : 0;
  const totalAmount = baseFare + bookingFee;

  return (
    <div className="booking-container">
      <div className="booking-nav">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <div className="match-summary">
          <h3>
            {match.team1} <span className="vs-text" style={{ fontSize: '0.85em', opacity: 0.8, margin: '0 4px', fontStyle: 'italic' }}>vs</span><br />
            {match.team2}
          </h3>
          <p>{match.date_time} | {match.venue}</p>
        </div>
      </div>

      <div className="booking-content">
        <div className="stadium-section">
          <div className="section-header">
            <h4>Seating Area</h4>
          </div>
          
          <div className="stadium-layout-container">
            <img 
              src={`/stadiums/${stadiumImage}`} 
              alt="Stadium Layout" 
              className="stadium-layout-img"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/800x600/1e2130/white?text=Stadium+Layout+Incoming';
              }}
            />
          </div>

          {availableStands.length > 0 && (
            <div className="stands-table-container">
              <h5>Available Stands in {city}</h5>
              <table className="stands-table">
                <thead>
                  <tr>
                    <th>Stand Name</th>
                    <th>Price (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {availableStands.map((stand, index) => (
                    <tr key={index} className={selectedStand === stand.name ? 'selected' : ''} onClick={() => setSelectedStand(stand.name)}>
                      <td>{stand.name}</td>
                      <td>₹{stand.price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="booking-sidebar">
          <div className="selection-summary">
            <h4>Select Tickets</h4>
            
            <div className="selection-form">
              <div className="form-group">
                <label>Choose Stand</label>
                <select 
                  value={selectedStand} 
                  onChange={(e) => setSelectedStand(e.target.value)}
                  className="stand-select"
                >
                  <option value="">Select a stand</option>
                  {availableStands.map((stand, index) => (
                    <option key={index} value={stand.name}>{stand.name} - ₹{stand.price.toLocaleString()}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Quantity</label>
                <div className="quantity-selector">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(10, quantity + 1))}>+</button>
                </div>
              </div>
            </div>

            <div className="price-details">
              <div className="price-row">
                <span>Base Fare</span>
                <span>₹{baseFare.toLocaleString()}</span>
              </div>
              <div className="price-row">
                <span>Booking Fee (5%)</span>
                <span>₹{bookingFee.toLocaleString()}</span>
              </div>
              <hr />
              <div className="price-row total">
                <span>Total Amount</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <button className={`checkout-btn ${selectedStand ? 'active' : ''}`} disabled={!selectedStand}>
              <CreditCard size={20} />
              <span>Proceed to Pay ₹{totalAmount.toLocaleString()}</span>
            </button>
          </div>

          <div className="stadium-info-box">
            <h4>Venue Information</h4>
            <div className="info-item">
              <MapPin size={16} />
              <span>{match.venue}</span>
            </div>
            <p className="stadium-note">
              Please reach the stadium 2 hours before the match starts for a smooth entry process. Digital tickets must be carried for entry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
