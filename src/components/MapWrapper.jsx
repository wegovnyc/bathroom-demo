// src/components/MapWrapper.jsx
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const createStatusIcon = (status) => {
  let color = '#94a3b8'; // unknown
  if (status === 'open') color = '#10b981';
  if (status === 'maybe') color = '#f59e0b';
  if (status === 'closed') color = '#ef4444';

  return L.divIcon({
    html: `
      <div style="background: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 3px solid var(--bg-card); filter: var(--filter-drop);"></div>
    `,
    className: 'custom-status-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

// A custom pulsing blue dot for user location
const userIconHtml = `
  <div style="background: var(--btn-bg); width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;">
    <div style="background: var(--accent-main); width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--bg-card);"></div>
  </div>
`;
const userIcon = L.divIcon({
  html: userIconHtml,
  className: 'custom-user-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

function MapController({ userLocation }) {
  const map = useMap();
  useEffect(() => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1.5 });
    }
  }, [userLocation, map]);
  return null;
}

export default function MapWrapper({ data, userLocation, tileUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" }) {
  const defaultCenter = [40.7128, -74.0060];
  
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer 
        center={defaultCenter} 
        zoom={11} 
        style={{ height: '100%', width: '100%', borderRadius: '12px' }}
      >
        <MapController userLocation={userLocation} />

        <TileLayer
          url={tileUrl}
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {/* Plot User Location if available */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
             <Popup>
               <strong style={{ color: 'var(--text-main)' }}>You are here</strong>
             </Popup>
          </Marker>
        )}

        {data.map((item, index) => {
          if (!item.latitude || !item.longitude) return null;
          
          const lat = parseFloat(item.latitude);
          const lng = parseFloat(item.longitude);
          
          // Map confidence to CSS class
          const conf = item.confidence || 'unknown';
          const badgeClass = `status-${conf}`;

           // Capitalize first letter
          const statusText = conf.charAt(0).toUpperCase() + conf.slice(1);
          const icon = createStatusIcon(conf);

          return (
            <Marker key={index} position={[lat, lng]} icon={icon}>
              <Popup>
                <div style={{ padding: '0px', width: '220px' }}>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', color: 'var(--text-main)', fontWeight: 600 }}>
                    {item.facility_name || 'Restroom'}
                  </h3>
                  
                  <div style={{ marginBottom: '10px' }}>
                    <span className={`status-badge ${badgeClass}`}>
                      {statusText} {item.open ? `(${item.open})` : ''}
                    </span>
                    {item.distance !== undefined && (
                      <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: 'var(--accent-main)', fontWeight: 600 }}>
                         {(item.distance).toFixed(2)} mi
                      </span>
                    )}
                  </div>
                  
                  <p style={{ margin: '3px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <strong>Type:</strong> {item.location_type || 'N/A'} {item.restroom_type && ` - ${item.restroom_type}`}
                  </p>
                  
                  <p style={{ margin: '3px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <strong>Operator:</strong> {item.operator || 'N/A'}
                  </p>
                  
                  <p style={{ margin: '3px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <strong>Hours:</strong> {item.hours_of_operation || 'See Parks Website'}
                  </p>
                  
                  <p style={{ margin: '3px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <strong>Accessibility:</strong> {item.accessibility || 'N/A'}
                  </p>
                  
                  <p style={{ margin: '3px 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <strong>Changing Stations:</strong> {item.changing_stations || 'N/A'}
                  </p>

                  {item.additional_notes && (
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border-glass)', paddingTop: '8px' }}>
                      {item.additional_notes}
                    </p>
                  )}
                  {item.website?.url && (
                    <a href={item.website.url} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '8px', fontSize: '0.8rem', color: 'var(--accent-main)' }}>
                      View Website
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
