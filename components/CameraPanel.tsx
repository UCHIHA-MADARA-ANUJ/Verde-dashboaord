import { CameraCapture } from '@/lib/types';

type Props = {
  captures: CameraCapture[];
};

export function CameraPanel({ captures }: Props) {
  const latest = captures[0];

  return (
    <section className="panel camera-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">ESP32-CAM</p>
          <h3>Plant Vision Feed</h3>
        </div>
        <span className="status-chip">STORAGE</span>
      </div>

      <div className="photo-frame">
        {latest?.public_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={latest.public_url} alt="Latest plant capture" />
        ) : (
          <div className="photo-empty">
            <b>NO CAPTURE YET</b>
            <span>Press ESP32-CAM Capture after hardware upload is connected.</span>
          </div>
        )}
      </div>

      <div className="capture-list">
        {captures.length === 0 ? (
          <p>No camera metadata received yet.</p>
        ) : (
          captures.slice(0, 4).map((cap) => (
            <div className="capture-row" key={cap.id}>
              <span>{new Date(cap.created_at).toLocaleString()}</span>
              <b>{cap.ai_status.toUpperCase()}</b>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
