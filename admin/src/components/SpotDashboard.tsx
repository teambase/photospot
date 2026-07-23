import { useEffect, useMemo, useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { seedSpotsFromMock, setSpotStatus, setSpotsStatus, subscribeToSpots } from '../lib/spots';
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
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | undefined>();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkApproving, setBulkApproving] = useState(false);

  useEffect(() => subscribeToSpots(setSpots), []);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMessage(undefined);
    try {
      const count = await seedSpotsFromMock();
      setSeedMessage(`${count}개 스팟을 가져왔습니다.`);
    } catch (err) {
      const e = err as { code?: string; message?: string };
      setSeedMessage(`실패: ${e.code ?? ''} ${e.message ?? String(err)}`.trim());
    } finally {
      setSeeding(false);
    }
  };

  const visibleSpots = useMemo(() => spots.filter((s) => s.status === tab), [spots, tab]);

  const changeTab = (next: SpotStatus) => {
    setTab(next);
    setSelectedIds(new Set());
  };

  const toggleSelected = (spotId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(spotId)) next.delete(spotId);
      else next.add(spotId);
      return next;
    });
  };

  const allVisibleSelected = visibleSpots.length > 0 && visibleSpots.every((s) => selectedIds.has(s.id));

  const toggleSelectAll = () => {
    setSelectedIds(allVisibleSelected ? new Set() : new Set(visibleSpots.map((s) => s.id)));
  };

  const handleSetStatus = async (spotId: string, status: SpotStatus) => {
    setUpdatingId(spotId);
    try {
      await setSpotStatus(spotId, status);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleBulkApprove = async () => {
    setBulkApproving(true);
    try {
      await setSpotsStatus([...selectedIds], 'approved');
      setSelectedIds(new Set());
    } finally {
      setBulkApproving(false);
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

      {spots.length === 0 && (
        <p className="seed-hint">
          Firestore에 스팟이 없습니다.{' '}
          <button onClick={handleSeed} disabled={seeding}>
            {seeding ? '가져오는 중...' : 'mock 데이터 가져오기 (최초 1회)'}
          </button>
          {seedMessage && <span> — {seedMessage}</span>}
        </p>
      )}

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={t.id === tab ? 'tab active' : 'tab'}
            onClick={() => changeTab(t.id)}
          >
            {t.label} ({spots.filter((s) => s.status === t.id).length})
          </button>
        ))}
      </nav>

      {tab === 'pending' && visibleSpots.length > 0 && (
        <div className="bulk-bar">
          <span>{selectedIds.size}개 선택됨</span>
          <button
            disabled={selectedIds.size === 0 || bulkApproving}
            onClick={handleBulkApprove}
          >
            {bulkApproving ? '승인 처리 중...' : `선택 항목 일괄 승인 (${selectedIds.size})`}
          </button>
        </div>
      )}

      <table className="spot-table">
        <thead>
          <tr>
            {tab === 'pending' && (
              <th>
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAll}
                  aria-label="전체 선택"
                />
              </th>
            )}
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
              {tab === 'pending' && (
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(spot.id)}
                    onChange={() => toggleSelected(spot.id)}
                    aria-label={`${spot.name} 선택`}
                  />
                </td>
              )}
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
              <td colSpan={tab === 'pending' ? 6 : 5} className="empty">
                표시할 스팟이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
