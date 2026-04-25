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

  useEffect(() => {
    const fetchMatchDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/matches/${id}`);
        setMatch(response.data);
      } catch (error) {
        console.error('Error fetching match details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchDetails();
  }, [id]);

  const getStadiumImage = (venue: string) => {
    const parts = venue.split(',');
    const city = parts[parts.length - 1].trim();
    return stadiumImageMap[city] || 'default-stadium.jpg';
  };

  if (loading) return <div className="booking-loading">Loading booking details...</div>;
  if (!match) return <div className="booking-error">Match not found.</div>;

  const stadiumImage = getStadiumImage(match.venue);

  return (
    <div className="booking-container">
      <div className="booking-nav">
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <div className="match-summary">
          <h3>{match.team1} vs {match.team2}</h3>
          <p>{match.date_time} | {match.venue}</p>
        </div>
      </div>

      <div className="booking-content">
        <div className="stadium-section">
          <div className="section-header">
            <h4>Select Your Stand</h4>
            <div className="status-legend">
              <span className="legend-item available">Available</span>
              <span className="legend-item filling">Filling Fast</span>
              <span className="legend-item sold-out">Sold Out</span>
            </div>
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
            <div className="layout-overlay">
              <div className="instruction-box">
                <Info size={16} />
                <span>Hover over the stands to see pricing and availability</span>
              </div>
            </div>
          </div>
        </div>

        <div className="booking-sidebar">
          <div className="selection-summary">
            <h4>Ticket Summary</h4>
            <div className="summary-empty">
              <Users size={48} className="empty-icon" />
              <p>Please select a stand from the layout to proceed with booking.</p>
            </div>
            
            <div className="price-details">
              <div className="price-row">
                <span>Base Fare</span>
                <span>₹0</span>
              </div>
              <div className="price-row">
                <span>Booking Fee</span>
                <span>₹0</span>
              </div>
              <hr />
              <div className="price-row total">
                <span>Total Amount</span>
                <span>₹0</span>
              </div>
            </div>

            <button className="checkout-btn" disabled>
              <CreditCard size={20} />
              <span>Proceed to Pay</span>
            </button>
          </div>

          <div className="stadium-info-box">
            <h4>Venue Information</h4>
            <div className="info-item">
              <MapPin size={16} />
              <span>{match.venue}</span>
            </div>
            <p className="stadium-note">
              Please reach the stadium 2 hours before the match starts for a smooth entry process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
