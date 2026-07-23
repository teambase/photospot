import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { fetchApprovedSpots, fetchSpotById } from './spotsRepo';
import { fetchWeatherSnapshot } from './weatherRepo';

export const GEOFENCE_TASK = 'photospot-geofence-task';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) return;
  const { eventType, region } = data as {
    eventType: Location.GeofencingEventType;
    region: Location.LocationRegion;
  };
  if (eventType !== Location.GeofencingEventType.Enter || !region.identifier) return;

  const spot = await fetchSpotById(region.identifier);
  if (!spot) return;
  const weather = await fetchWeatherSnapshot(spot).catch(() => undefined);

  const body = weather
    ? `여기는 ${spot.name}입니다. 오늘 일몰 ${weather.sunsetTime}, 구름량 ${weather.cloudCoverPercent}%로 촬영하기 좋은 편입니다.`
    : `여기는 ${spot.name}입니다. 등록된 촬영 스팟 반경에 진입했습니다.`;

  await Notifications.scheduleNotificationAsync({
    content: { title: `📍 ${spot.name}`, body },
    trigger: null,
  });
});

export interface GeofencePermissionResult {
  granted: boolean;
  foreground: boolean;
  /** 지오펜싱엔 "항상 허용"이 필요 — "앱 사용 중"만으론 부족하다. */
  background: boolean;
  notifications: boolean;
}

/**
 * iOS는 위치 권한 요청 팝업을 앱당 한 번만 띄운다. 이미 "앱 사용 중"으로 답한 상태에서
 * requestBackgroundPermissionsAsync()를 다시 불러도 팝업 없이 조용히 현재 상태만 돌아오므로,
 * 사용자가 설정 앱에서 직접 "항상"으로 바꿔야 한다 — 이 함수는 그 사실을 호출자가 알 수 있게
 * 항목별 결과를 반환한다.
 */
export async function requestGeofencePermissions(): Promise<GeofencePermissionResult> {
  const fg = await Location.requestForegroundPermissionsAsync();
  const foreground = fg.status === 'granted';

  const background = foreground
    ? (await Location.requestBackgroundPermissionsAsync()).status === 'granted'
    : false;

  const notif = await Notifications.requestPermissionsAsync();
  const notifications = notif.status === 'granted';

  return { granted: foreground && background && notifications, foreground, background, notifications };
}

/** iOS Region Monitoring은 동시 20개 제한 — 호출자가 거리순으로 정렬해 넘기는 것을 전제로 상위 20개만 등록. */
export const MAX_GEOFENCES = 20;

export async function syncGeofences(spotIds: string[], radiusMeters: number) {
  const approvedSpots = await fetchApprovedSpots();
  const regions: Location.LocationRegion[] = spotIds
    .slice(0, MAX_GEOFENCES)
    .map((id) => approvedSpots.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map((spot) => ({
      identifier: spot.id,
      latitude: spot.lat,
      longitude: spot.lng,
      radius: radiusMeters,
      notifyOnEnter: true,
      notifyOnExit: false,
    }));

  if (regions.length === 0) {
    const started = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
    if (started) await Location.stopGeofencingAsync(GEOFENCE_TASK);
    return;
  }

  await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
}
