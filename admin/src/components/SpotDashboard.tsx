import { useEffect, useMemo, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { setSpotStatus, subscribeToSpots } from '../lib/spots';
import type { Spot, SpotStatus } from '../types';

const TABS: { id: SpotStatus; label: string }[] = [
  { id: 'pending', label: '승인 대기' },
  { id: 'approved', label: '승인됨' },
  { id: 'rejected', label: '반려됨' },
];

export function SpotDashboard({ email }: { email: string }) {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [tab, setTab] = useState<SpotStatus>('pending');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => subscribeToSpots(setSpots), []);

  const visibleSpots = useMemo(() => spots.filter((s) => s.status === tab), [spots, tab]);

  const handleSetStatus = async (spotId: string, status: SpotStatus) => {
    setUpdatingId(spotId);
    try {
      await setSpotStatus(spotId, status);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>포토스팟 어드민</h1>
        <div>
          <span className="email">{email}</span>
          <button onClick={() => signOut(auth)}>로그아웃</button>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={t.id === tab ? 'tab active' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            {t.label} ({spots.filter((s) => s.status === t.id).length})
          </button>
        ))}
      </nav>

      <table className="spot-table">
        <thead>
          <tr>
            <th>이름</th>
            <th>지역</th>
            <th>테마</th>
            <th>출처</th>
            <th>작업</th>
          </tr>
        </thead>
        <tbody>
          {visibleSpots.map((spot) => (
            <tr key={spot.id}>
              <td>{spot.name}</td>
              <td>{spot.region}</td>
              <td>{spot.themes.join(', ')}</td>
              <td>{spot.source}</td>
              <td className="actions">
                {tab !== 'approved' && (
                  <button
                    disabled={updatingId === spot.id}
                    onClick={() => handleSetStatus(spot.id, 'approved')}
                  >
                    승인
                  </button>
                )}
                {tab !== 'rejected' && (
                  <button
                    disabled={updatingId === spot.id}
                    onClick={() => handleSetStatus(spot.id, 'rejected')}
                  >
                    반려
                  </button>
                )}
                {tab !== 'pending' && (
                  <button
                    disabled={updatingId === spot.id}
                    onClick={() => handleSetStatus(spot.id, 'pending')}
                  >
                    대기로 되돌리기
                  </button>
                )}
              </td>
            </tr>
          ))}
          {visibleSpots.length === 0 && (
            <tr>
              <td colSpan={5} className="empty">
                표시할 스팟이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
