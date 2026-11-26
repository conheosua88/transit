import { DispatchMode, Trip } from '../types/dispatch';

export interface TripClassificationInfo {
  mode: DispatchMode;
  groupKey: string | null;
  peerTripIds: string[];
  trailerList: string[];
}

export interface PlanSummaryRow {
  groupKey: string;
  quantity: number;
  customerLabel: string;
  plateNumber: string;
  trailerInfo: string;
  tripIds: string[];
}

export interface DispatchPlanSummaryData {
  mergeRows: PlanSummaryRow[];
  quayVongRows: PlanSummaryRow[];
  catMoocRows: PlanSummaryRow[];
  mergeTotal: number;
  quayVongTotal: number;
  catMoocTotal: number;
  grandTotalGroups: number;
  totalTripsCount: number;
  companyTripsCount: number;
  hiredTripsCount: number;
}

function formatCustomerPair(customers: string[]): string {
  const cleaned = customers.map((c) => c.trim()).filter(Boolean);
  const unique = Array.from(new Set(cleaned));
  if (unique.length === 0) return '—';
  if (unique.length === 1) return unique[0];
  return unique.join(' + ');
}

/**
 * Classifies every trip into:
 * - 'merge' ("Ghép"): 20' containers merged together (has mergeGroupId)
 * - 'quay_vong' ("Quay vòng"): same plateNumber + same trailerNumber running >= 2 non-merged trips on the same day
 * - 'cat_mooc' ("Cắt mooc"): same plateNumber running >= 2 non-merged trips on the same day using different trailerNumbers
 * - 'single': standard single trip or undispatched trip
 */
export function classifyTrips(
  trips: Trip[]
): Record<string, TripClassificationInfo> {
  const result: Record<string, TripClassificationInfo> = {};

  // 1. Merged pairs ("Ghép")
  const mergeGroups = new Map<string, Trip[]>();
  for (const trip of trips) {
    if (trip.mergeGroupId) {
      const list = mergeGroups.get(trip.mergeGroupId) ?? [];
      list.push(trip);
      mergeGroups.set(trip.mergeGroupId, list);
    }
  }

  for (const [groupId, groupTrips] of mergeGroups.entries()) {
    const ids = groupTrips.map((t) => t.id);
    for (const t of groupTrips) {
      result[t.id] = {
        mode: 'merge',
        groupKey: groupId,
        peerTripIds: ids.filter((id) => id !== t.id),
        trailerList: Array.from(
          new Set(groupTrips.map((x) => x.trailerNumber).filter(Boolean))
        ),
      };
    }
  }

  // 2. Non-merged dispatched trips grouped by (dispatchDate, plateNumber)
  const truckDayGroups = new Map<string, Trip[]>();
  for (const trip of trips) {
    if (trip.mergeGroupId) continue;
    const plate = trip.plateNumber.trim().toUpperCase();
    if (!trip.isDispatched || !plate) {
      result[trip.id] = {
        mode: 'single',
        groupKey: null,
        peerTripIds: [],
        trailerList: trip.trailerNumber ? [trip.trailerNumber] : [],
      };
      continue;
    }

    const key = `${trip.dispatchDate}__${plate}`;
    const list = truckDayGroups.get(key) ?? [];
    list.push(trip);
    truckDayGroups.set(key, list);
  }

  for (const [key, groupTrips] of truckDayGroups.entries()) {
    const tripsWithTrailer = groupTrips.filter(
      (t) => t.trailerNumber.trim() !== ''
    );
    const tripsWithoutTrailer = groupTrips.filter(
      (t) => t.trailerNumber.trim() === ''
    );

    // Trips without a trailer assigned yet stay 'single' until mooc is picked
    for (const t of tripsWithoutTrailer) {
      result[t.id] = {
        mode: 'single',
        groupKey: null,
        peerTripIds: [],
        trailerList: [],
      };
    }

    if (tripsWithTrailer.length < 2) {
      for (const only of tripsWithTrailer) {
        result[only.id] = {
          mode: 'single',
          groupKey: null,
          peerTripIds: [],
          trailerList: [only.trailerNumber.trim().toUpperCase()],
        };
      }
      continue;
    }

    const uniqueTrailers = Array.from(
      new Set(tripsWithTrailer.map((t) => t.trailerNumber.trim().toUpperCase()))
    );

    // Same trailer across >= 2 trips -> Quay vòng; different trailers -> Cắt mooc
    const mode: DispatchMode =
      uniqueTrailers.length > 1 ? 'cat_mooc' : 'quay_vong';

    const ids = tripsWithTrailer.map((t) => t.id);
    for (const t of tripsWithTrailer) {
      result[t.id] = {
        mode,
        groupKey: `${mode}__${key}`,
        peerTripIds: ids.filter((id) => id !== t.id),
        trailerList: uniqueTrailers,
      };
    }
  }

  return result;
}

export function buildDispatchPlanSummary(
  trips: Trip[],
  classification: Record<string, TripClassificationInfo>
): DispatchPlanSummaryData {
  const mergeMap = new Map<string, Trip[]>();
  const quayVongMap = new Map<string, Trip[]>();
  const catMoocMap = new Map<string, Trip[]>();

  for (const trip of trips) {
    const info = classification[trip.id];
    if (!info || !info.groupKey) continue;

    if (info.mode === 'merge') {
      const list = mergeMap.get(info.groupKey) ?? [];
      list.push(trip);
      mergeMap.set(info.groupKey, list);
    } else if (info.mode === 'quay_vong') {
      const list = quayVongMap.get(info.groupKey) ?? [];
      list.push(trip);
      quayVongMap.set(info.groupKey, list);
    } else if (info.mode === 'cat_mooc') {
      const list = catMoocMap.get(info.groupKey) ?? [];
      list.push(trip);
      catMoocMap.set(info.groupKey, list);
    }
  }

  const toRows = (map: Map<string, Trip[]>): PlanSummaryRow[] => {
    const rows: PlanSummaryRow[] = [];
    for (const [groupKey, groupTrips] of map.entries()) {
      const plate = groupTrips[0]?.plateNumber || '—';
      const trailers = Array.from(
        new Set(groupTrips.map((t) => t.trailerNumber).filter(Boolean))
      );

      rows.push({
        groupKey,
        quantity: Math.max(1, groupTrips.length - 1),
        customerLabel: formatCustomerPair(groupTrips.map((t) => t.customer)),
        plateNumber: plate,
        trailerInfo: trailers.join(' / ') || '—',
        tripIds: groupTrips.map((t) => t.id),
      });
    }
    return rows;
  };

  const mergeRows = toRows(mergeMap);
  const quayVongRows = toRows(quayVongMap);
  const catMoocRows = toRows(catMoocMap);

  const mergeTotal = mergeRows.reduce((s, r) => s + r.quantity, 0);
  const quayVongTotal = quayVongRows.reduce((s, r) => s + r.quantity, 0);
  const catMoocTotal = catMoocRows.reduce((s, r) => s + r.quantity, 0);

  return {
    mergeRows,
    quayVongRows,
    catMoocRows,
    mergeTotal,
    quayVongTotal,
    catMoocTotal,
    grandTotalGroups: mergeTotal + quayVongTotal + catMoocTotal,
    totalTripsCount: trips.length,
    companyTripsCount: trips.filter((t) => t.fleetType === 'company').length,
    hiredTripsCount: trips.filter((t) => t.fleetType === 'hired').length,
  };
}
