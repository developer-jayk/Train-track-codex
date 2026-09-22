import { TrainData, DelayFactor, StationStop, StationStopDetail, PreviousStationDeparture } from '../types/index';

// Base API URL configured via Vite environment variable
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

interface BackendPredictionInterval {
  p10_mins: number;
  p90_mins: number;
}

interface BackendRootCause {
  factor: string;
  impact_mins: number;
}

interface BackendTimelineStop {
  station: string;
  scheduled: string;
  predicted: string;
  status: string;
}

interface BackendWeatherTelemetry {
  visibility_meters: number;
  condition: string;
}

interface BackendStationStopDetail {
  station_code: string;
  station_name: string;
  scheduled_arrival: string;
  scheduled_departure: string;
  actual_arrival: string;
  actual_departure: string;
  delay_mins: number;
  status: 'Departed' | 'In Transit' | 'Upcoming' | 'Arrived';
  distance_km: number;
  platform?: string;
  is_boarding?: boolean;
}

interface BackendPreviousStationDeparture {
  station_code: string;
  station_name: string;
  scheduled_departure: string;
  actual_departure: string;
  departure_delay_mins: number;
}

interface BackendTrainForecastResponse {
  train_number: string;
  train_name: string;
  journey_date?: string;
  boarding_station?: string;
  telemetry_source: string;
  current_status: string;
  current_speed_kmh: number;
  current_delay_mins: number;
  predicted_downstream_delay_mins: number;
  confidence_score: number;
  prediction_interval: BackendPredictionInterval;
  next_station: string;
  weather_telemetry?: BackendWeatherTelemetry;
  platform?: string;
  platform_status?: string;
  previous_station_departure?: BackendPreviousStationDeparture;
  root_causes?: BackendRootCause[];
  timeline?: BackendTimelineStop[];
  full_route?: BackendStationStopDetail[];
}

interface BackendWaypoint {
  code: string;
  name: string;
  lat: number;
  lng: number;
}

interface BackendRouteGeometryResponse {
  train_number: string;
  status: string;
  polyline: [number, number][];
  critical_waypoints: BackendWaypoint[];
  stations?: BackendStationStopDetail[];
}

/**
 * Adapter: Maps the real Python FastAPI backend response schemas
 * into the frontend's existing TrainData structure.
 */
function mapBackendToTrainData(
  forecast: BackendTrainForecastResponse,
  routeGeometry?: BackendRouteGeometryResponse | null
): TrainData {
  // Determine Origin and Destination from Route Geometry or Timeline
  const waypoints = routeGeometry?.critical_waypoints || [];
  let origin = 'Origin Station';
  let destination = 'Destination Terminal';

  if (waypoints.length > 0) {
    origin = waypoints[0].name;
    destination = waypoints[waypoints.length - 1].name;
  } else if (forecast.timeline && forecast.timeline.length > 0) {
    origin = forecast.timeline[0].station;
    destination = forecast.timeline[forecast.timeline.length - 1].station;
  }

  // Format Status Text
  const statusText = forecast.current_status || (forecast.current_delay_mins > 0
    ? `Running late by ${forecast.current_delay_mins} mins`
    : 'On Time');

  // Confidence text tier
  const confidenceScore = forecast.confidence_score ?? 85;
  const confidenceText = confidenceScore >= 80
    ? 'HIGH CONFIDENCE'
    : confidenceScore >= 60
    ? 'MODERATE CONFIDENCE'
    : 'LOW CONFIDENCE';

  // Prediction interval range
  const p10 = forecast.prediction_interval?.p10_mins ?? Math.max(0, forecast.predicted_downstream_delay_mins - 4);
  const p90 = forecast.prediction_interval?.p90_mins ?? (forecast.predicted_downstream_delay_mins + 5);

  // Map Explainable AI delay root causes
  const delayFactors: DelayFactor[] = (forecast.root_causes || []).map((rc, idx) => {
    const fLower = rc.factor.toLowerCase();
    let iconType: 'fog' | 'signal' | 'network' = 'network';
    if (fLower.includes('fog') || fLower.includes('weather') || fLower.includes('visibility')) {
      iconType = 'fog';
    } else if (fLower.includes('precedence') || fLower.includes('loop') || fLower.includes('signal') || fLower.includes('clearance')) {
      iconType = 'signal';
    }
    return {
      id: `rc-${idx + 1}`,
      title: rc.factor,
      impactMin: rc.impact_mins,
      iconType,
    };
  });

  // Map route progression timeline
  const routeStops: StationStop[] = (forecast.timeline || []).map((stop, idx) => {
    let status: 'Departed' | 'Next' | 'Upcoming' = 'Upcoming';
    const sLower = stop.status.toLowerCase();
    if (sLower.includes('departed')) {
      status = 'Departed';
    } else if (sLower.includes('transit') || sLower.includes('next') || sLower.includes('approaching') || idx === 1) {
      status = 'Next';
    }
    return {
      stationName: stop.station,
      status,
      scheduledTime: stop.scheduled,
      predictedTime: stop.predicted,
      delayMin: forecast.predicted_downstream_delay_mins,
      statusSubtext: stop.status,
    };
  });

  // Map previous station departure
  let previousStationDeparture: PreviousStationDeparture | undefined = undefined;
  if (forecast.previous_station_departure) {
    previousStationDeparture = {
      stationCode: forecast.previous_station_departure.station_code,
      stationName: forecast.previous_station_departure.station_name,
      scheduledDeparture: forecast.previous_station_departure.scheduled_departure,
      actualDeparture: forecast.previous_station_departure.actual_departure,
      departureDelayMin: forecast.previous_station_departure.departure_delay_mins,
    };
  }

  // Map full route station details
  const rawStations = forecast.full_route || routeGeometry?.stations || [];
  const fullRouteStations: StationStopDetail[] = rawStations.map((st) => ({
    stationCode: st.station_code,
    stationName: st.station_name,
    scheduledArrival: st.scheduled_arrival,
    scheduledDeparture: st.scheduled_departure,
    actualArrival: st.actual_arrival,
    actualDeparture: st.actual_departure,
    delayMin: st.delay_mins,
    status: st.status,
    distanceKm: st.distance_km,
    platform: st.platform,
    isBoarding: st.is_boarding,
  }));

  // Compose dynamic telemetry information notice
  const weatherText = forecast.weather_telemetry
    ? `Visibility: ${forecast.weather_telemetry.visibility_meters}m (${forecast.weather_telemetry.condition}).`
    : 'Clear visibility reported along corridor.';
  const sourceText = forecast.telemetry_source ? ` Source: ${forecast.telemetry_source}.` : '';
  const infoMessage = `${weatherText}${sourceText} Continuous gradient-boosted delay inference active.`;

  return {
    trainNumber: forecast.train_number,
    trainName: forecast.train_name,
    journeyDate: forecast.journey_date,
    boardingStation: forecast.boarding_station,
    routeFrom: origin,
    routeTo: destination,
    statusText,
    lastUpdatedText: forecast.current_status === 'JOURNEY COMPLETED' ? 'HISTORICAL RECORD' : 'LIVE TELEMETRY',
    currentSpeedKmH: forecast.current_speed_kmh ?? 0,
    currentDelayMin: forecast.current_delay_mins ?? 0,
    predictedDelayMin: forecast.predicted_downstream_delay_mins ?? 0,
    confidencePercent: confidenceScore,
    confidenceText,
    expectedDelayRange: [p10, p90],
    nextStationName: forecast.next_station || 'Approaching Section',
    nextStationEta: forecast.timeline?.[1]?.predicted || forecast.timeline?.[0]?.predicted || '02:00 AM',
    platform: forecast.platform
      ? (forecast.platform.toUpperCase().startsWith('PF') || forecast.platform.toUpperCase().startsWith('PLATFORM')
          ? forecast.platform
          : `PF ${forecast.platform}`)
      : 'Platform TBA',
    infoMessage,
    previousStationDeparture,
    delayFactors,
    routeStops,
    fullRouteStations,
  };
}

/**
 * Service abstraction for train status and delay prediction.
 * Communicates with the real FastAPI backend engine.
 */
export const trainService = {
  /**
   * Fetch delay prediction and status for a given train number, date, and boarding station.
   * Returns null if train is not found (404).
   * Throws an Error if backend/network failure or date error occurs.
   */
  async fetchTrainDelayPrediction(
    trainNumber: string,
    journeyDate?: string,
    boardingStation?: string
  ): Promise<TrainData | null> {
    const cleanNumber = trainNumber.trim();
    if (!cleanNumber) {
      return null;
    }

    const params = new URLSearchParams();
    if (journeyDate) params.set('date', journeyDate.trim());
    if (boardingStation) params.set('boarding_station', boardingStation.trim());
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const forecastUrl = `${API_BASE_URL}/api/v1/trains/${encodeURIComponent(cleanNumber)}/forecast${queryString}`;
    let forecastRes: Response;

    try {
      forecastRes = await fetch(forecastUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
    } catch (networkErr) {
      console.error('[trainService] Network error connecting to backend:', networkErr);
      throw new Error('Unable to fetch journey data. Please try again.');
    }

    // 404 handling: check whether train was not found or date had no journey
    if (forecastRes.status === 404) {
      let detailMsg = '';
      try {
        const errorJson = await forecastRes.json();
        detailMsg = errorJson.detail || '';
      } catch (e) {
        // ignore json parse error
      }
      if (detailMsg.toLowerCase().includes('no journey data available for this date')) {
        throw new Error('No journey data available for this date.');
      }
      return null;
    }

    // Non-200 HTTP response
    if (!forecastRes.ok) {
      console.error(`[trainService] Backend responded with HTTP status ${forecastRes.status}`);
      throw new Error('Unable to fetch journey data. Please try again.');
    }

    const forecastData: BackendTrainForecastResponse = await forecastRes.json();

    // Geospatial route geometry lookup
    let routeData: BackendRouteGeometryResponse | null = null;
    try {
      const routeRes = await fetch(
        `${API_BASE_URL}/api/v1/trains/${encodeURIComponent(cleanNumber)}/route-geometry${journeyDate ? `?date=${encodeURIComponent(journeyDate.trim())}` : ''}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      if (routeRes.ok) {
        routeData = await routeRes.json();
      }
    } catch (e) {
      console.warn('[trainService] Route geometry query skipped/failed:', e);
    }

    return mapBackendToTrainData(forecastData, routeData);
  },

  /**
   * Fetch complete station stops and route geometry for a train number and date.
   * Returns null if train not found.
   */
  async fetchTrainRoute(trainNumber: string, journeyDate?: string): Promise<StationStopDetail[] | null> {
    const cleanNumber = trainNumber.trim();
    if (!cleanNumber) return null;

    const dateParam = journeyDate ? `?date=${encodeURIComponent(journeyDate.trim())}` : '';
    const routeUrl = `${API_BASE_URL}/api/v1/trains/${encodeURIComponent(cleanNumber)}/route-geometry${dateParam}`;

    try {
      const res = await fetch(routeUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Unable to fetch route details.');

      const data: BackendRouteGeometryResponse = await res.json();
      if (!data.stations) return [];
      return data.stations.map((st) => ({
        stationCode: st.station_code,
        stationName: st.station_name,
        scheduledArrival: st.scheduled_arrival,
        scheduledDeparture: st.scheduled_departure,
        actualArrival: st.actual_arrival,
        actualDeparture: st.actual_departure,
        delayMin: st.delay_mins,
        status: st.status,
        distanceKm: st.distance_km,
        platform: st.platform,
        isBoarding: st.is_boarding,
      }));
    } catch (err) {
      console.error('[trainService] Error fetching train route:', err);
      return null;
    }
  },

  /**
   * Alias maintaining compatibility with existing callers
   */
  async getTrainStatus(trainNumber: string): Promise<TrainData | null> {
    return this.fetchTrainDelayPrediction(trainNumber);
  },
};

/**
 * Standalone export maintaining compatibility
 */
export const fetchTrainDelayPrediction = (trainNumber: string, journeyDate?: string, boardingStation?: string) =>
  trainService.fetchTrainDelayPrediction(trainNumber, journeyDate, boardingStation);
