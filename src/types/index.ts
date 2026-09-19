export interface DelayFactor {
  id: string;
  title: string;
  subtitle?: string;
  impactMin: number;
  iconType: 'fog' | 'signal' | 'network';
}

export interface StationStop {
  stationName: string;
  status: 'Departed' | 'Next' | 'Upcoming';
  statusSubtext?: string;
  scheduledTime?: string;
  actualTime?: string;
  predictedTime?: string;
  delayMin?: number;
}

export interface StationStopDetail {
  stationCode: string;
  stationName: string;
  scheduledArrival: string;
  scheduledDeparture: string;
  actualArrival: string;
  actualDeparture: string;
  delayMin: number;
  status: 'Departed' | 'In Transit' | 'Upcoming' | 'Arrived';
  distanceKm: number;
  platform?: string;
  isBoarding?: boolean;
}

export interface PreviousStationDeparture {
  stationCode: string;
  stationName: string;
  scheduledDeparture: string;
  actualDeparture: string;
  departureDelayMin: number;
}

export interface TrainData {
  trainNumber: string;
  trainName: string;
  journeyDate?: string;
  boardingStation?: string;
  routeFrom: string;
  routeTo: string;
  statusText: string;
  lastUpdatedText: string;
  currentSpeedKmH: number;
  currentDelayMin: number;
  predictedDelayMin: number;
  confidencePercent: number;
  confidenceText: string;
  expectedDelayRange: [number, number];
  nextStationName: string;
  nextStationEta: string;
  platform: string;
  infoMessage: string;
  previousStationDeparture?: PreviousStationDeparture;
  delayFactors: DelayFactor[];
  routeStops: StationStop[];
  fullRouteStations?: StationStopDetail[];
}
