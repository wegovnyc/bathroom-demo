// src/App.jsx
import { useEffect, useState, useMemo } from 'react';
import './App.css';
import MapWrapper from './components/MapWrapper';
import RestroomTable from './components/RestroomTable';
import { getOpenStatus } from './utils/timeLogic';

// Calculate Haversine distance in miles between two coordinates
function getDistanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters, Location, and Theme State
  const [theme, setTheme] = useState('default');
  const [userLocation, setUserLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({
    operationalOnly: true,
    openNow: false,
    ada: false,
    babyStation: false,
  });

  // Apply theme to document element
  useEffect(() => {
    if (theme === 'default') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/restrooms');
        if (!res.ok) throw new Error('Failed to fetch public restroom data');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const toggleLocation = () => {
    if (userLocation) {
      setUserLocation(null);
      setSearchQuery('');
      return;
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (err) => {
          alert("Error obtaining location: " + err.message + "\n\nNote: Browsers block location on unsecure (HTTP) domains unless you are on localhost.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
    }
  };

  const handleAddressSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Nominatim NYC Geocoding (bounded to NYC area)
      const query = encodeURIComponent(searchQuery);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&viewbox=-74.259,40.917,-73.700,40.477&bounded=1&limit=1`;
      
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en-US,en;q=0.9' }
      });
      const data = await res.json();
      
      if (data && data.length > 0) {
        setUserLocation({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        });
      } else {
        alert("Address not found in NYC. Please try formatting like 'Washington Square Park' or '100 Broadway, NY'");
      }
    } catch (err) {
      alert("Error contacting geocoding service. Please try again later.");
    } finally {
      setIsSearching(false);
    }
  };

  const toggleFilter = (key) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Derive the final displayed dataset
  const filteredData = useMemo(() => {
    let processed = data.map(item => {
      // 1. Calculate Open Status Confidence
      const currentConfidence = getOpenStatus(item);
      let newItem = { ...item, confidence: currentConfidence };
      
      // 2. Add Distance if location is available
      if (userLocation && item.latitude && item.longitude) {
        newItem.distance = getDistanceMiles(
          userLocation.lat, userLocation.lng,
          parseFloat(item.latitude), parseFloat(item.longitude)
        );
      }
      return newItem;
    });

    // Apply Filter Toggles
    processed = processed.filter(item => {
      // Operational Only
      if (filters.operationalOnly) {
        const statusStr = (item.status || '').toLowerCase();
        if (statusStr.includes('closed') || statusStr.includes('not operational')) return false;
      }
      
      // Open Now (Only show 'open' or 'maybe')
      if (filters.openNow) {
        if (item.confidence === 'closed' || item.confidence === 'unknown') return false;
      }

      // Feature filters
      if (filters.ada) {
        if (!(item.accessibility || '').toLowerCase().includes('yes')) return false;
      }
      if (filters.babyStation) {
        if (!(item.changing_stations || '').toLowerCase().includes('yes')) return false;
      }

      // Proximity Declutter (If user location is set, enforce 1.5 mile radius)
      if (userLocation && item.distance !== undefined) {
        if (item.distance > 1.5) return false;
      }

      return true;
    });

    // Sort by distance if location exists
    if (userLocation) {
      processed.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }

    return processed;
  }, [data, userLocation, filters]);

  const tileUrl = theme === 'default' 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="app-container">
      <header className="header glass-panel">
        <div>
          <h1>NYC Public Restrooms</h1>
          <p>Real-time location and status of NYC comfort stations</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            className="filter-btn" 
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            style={{ padding: '8px', cursor: 'pointer', outline: 'none' }}
          >
            <option value="default">Default Theme</option>
            <option value="nyc">NYC Open Data</option>
            <option value="wegov">WeGovNYC</option>
          </select>
          <button className="action-btn" onClick={toggleLocation}>
            {userLocation ? '✖️ Clear Location' : '📍 Find Nearest'}
          </button>
        </div>

        <div className="filter-controls">
          <form className="search-form" onSubmit={handleAddressSearch}>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Address or Landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isSearching}
            />
            <button type="submit" className="search-btn" disabled={isSearching || !searchQuery.trim()}>
              {isSearching ? '...' : 'Search'}
            </button>
          </form>

          <button 
            className={`filter-btn ${filters.operationalOnly ? 'active' : ''}`}
            onClick={() => toggleFilter('operationalOnly')}
          >
            Operational Only
          </button>
          <button 
            className={`filter-btn ${filters.openNow ? 'active' : ''}`}
            onClick={() => toggleFilter('openNow')}
          >
            Open Now
          </button>
          <button 
            className={`filter-btn ${filters.ada ? 'active' : ''}`}
            onClick={() => toggleFilter('ada')}
          >
            ADA Accessible
          </button>
          <button 
            className={`filter-btn ${filters.babyStation ? 'active' : ''}`}
            onClick={() => toggleFilter('babyStation')}
          >
            Baby Station
          </button>
        </div>
      </header>

      <main className="dashboard-grid">
        <section className="map-section glass-panel">
          {loading && <div className="map-loading-overlay">Loading map data...</div>}
          {error && <div className="error">{error}</div>}
          {!loading && !error && <MapWrapper data={filteredData} userLocation={userLocation} tileUrl={tileUrl} />}
        </section>

        <section className="table-section">
          <div className="table-container glass-panel">
             <div style={{ padding: '12px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-glass)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
               Showing <strong>{filteredData.length}</strong> matching restroom{filteredData.length !== 1 ? 's' : ''}
               {userLocation && " within 1.5 miles."}
             </div>
            {loading ? (
              <div className="loading">Loading table data...</div>
            ) : error ? (
              <div className="error">Error loading data.</div>
            ) : (
              <RestroomTable data={filteredData} />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
