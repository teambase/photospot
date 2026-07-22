import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { MOCK_SPOTS } from '../data/mockSpots';
import { MOCK_WEATHER } from '../data/mockWeather';

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

  const spot = MOCK_SPOTS.find((s) => s.id === region.identifier);
  const weather = spot ? MOCK_WEATHER[spot.id] : undefined;
  if (!spot) return;

  const body = weather
    ? `여기는 ${spot.name}입니다. 오늘 일몰 ${weather.sunsetTime}, 구름량 ${weather.cloudCoverPercent}%로 촬영하기 좋은 편입니다.`
    : `여기는 ${spot.name}입니다. 등록된 촬영 스팟 반경에 진입했습니다.`;

  await Notifications.scheduleNotificationAsync({
    content: { title: `📍 ${spot.name}`, body },
    trigger: null,
  });
});

export async function requestGeofencePermissions(): Promise<boolean> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return false;
  const bg = await Location.requestBackgroundPermissionsAsync();
  const notif = await Notifications.requestPermissionsAsync();
  return bg.status === 'granted' && notif.status === 'granted';
}

/** iOS Region Monitoring은 동시 20개 제한 — 호출자가 거리순으로 정렬해 넘기는 것을 전제로 상위 20개만 등록. */
export const MAX_GEOFENCES = 20;

export async function syncGeofences(spotIds: string[], radiusMeters: number) {
  const regions: Location.LocationRegion[] = spotIds
    .slice(0, MAX_GEOFENCES)
    .map((id) => MOCK_SPOTS.find((s) => s.id === id))
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
