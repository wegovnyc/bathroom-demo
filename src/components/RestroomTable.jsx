// src/components/RestroomTable.jsx
export default function RestroomTable({ data }) {
  if (!data || data.length === 0) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No restrooms found for these filters. Try expanding your search radius or toggling off "Open Now".</div>;
  }

  const hasDistance = data[0]?.distance !== undefined;

  return (
    <table>
      <thead>
        <tr>
          <th>Facility</th>
          <th>Real-time Status</th>
          {hasDistance && <th>Distance</th>}
          <th>Hours</th>
          <th>Type</th>
          <th>Accessibility</th>
          <th>Features</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, index) => {
          const conf = item.confidence || 'unknown';
          const badgeClass = `status-${conf}`;
          const statusText = conf.charAt(0).toUpperCase() + conf.slice(1);

          return (
            <tr key={index}>
              <td>
                <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>{item.facility_name || 'Restroom'}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{item.location_type || 'N/A'}</div>
                {item.website?.url && (
                  <a href={item.website.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent-main)', marginTop: '4px', display: 'inline-block' }}>
                    Website ↗
                  </a>
                )}
              </td>
              <td>
                <span className={`status-badge ${badgeClass}`}>
                  {statusText}
                </span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {item.open || ''}
                </div>
              </td>
              {hasDistance && (
                <td style={{ fontWeight: '600', color: 'var(--accent-main)' }}>
                  {item.distance.toFixed(2)} mi
                </td>
              )}
              <td>
                <div style={{ maxWidth: '180px', whiteSpace: 'normal', lineHeight: '1.4' }}>
                  {item.hours_of_operation || 'See Parks Website'}
                </div>
              </td>
              <td>{item.restroom_type || 'N/A'}</td>
              <td>{item.accessibility || 'N/A'}</td>
              <td>
                <div style={{ fontSize: '0.85rem' }}>
                   <strong>Baby Station:</strong> {item.changing_stations || 'N/A'}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
