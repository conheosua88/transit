export type ContainerType = "20' DC" | "20' RF" | "20' OT" | "40' HC" | "40' DC";

export type FleetType = 'company' | 'hired';

export type DispatchMode = 'merge' | 'quay_vong' | 'cat_mooc' | 'single';

export type KpiFilterType =
  | 'all'
  | 'dispatched'
  | 'undispatched'
  | 'company'
  | 'hired'
  | 'merged'
  | 'quay_vong'
  | 'cat_mooc';

export type SubTabId =
  | 'shipments'
  | 'dispatch'
  | 'plan'
  | 'freight'
  | 'cost'
  | 'vehicle_cost'
  | 'fuel_norm'
  | 'fuel_issue';

export interface Trip {
  id: string;
  jobCode: string;
  vehicleOwner: string;
  fleetType: FleetType;
  plateNumber: string;
  trailerNumber: string;
  driverName: string;
  driverPhone: string;
  note: string;
  noteHighlight?: boolean;
  containerType: ContainerType;
  containerNumber: string;
  billBooking: string;
  customer: string;
  ops: string;
  route: string;
  pickupPoint: string;
  weight: number | null;
  cdsCutoff: string;
  dispatchDate: string;
  isDispatched: boolean;
  hasWarning?: boolean;
  mergeGroupId?: string | null;
  mergePartnerId?: string | null;
}

export interface VehiclePreset {
  plateNumber: string;
  trailerNumber: string;
  vehicleOwner: string;
  fleetType: FleetType;
  driverName: string;
  driverPhone: string;
}

export interface MergeDispatchPayload {
  container1Id: string;
  container2Id: string;
  vehicleOwner: string;
  plateNumber: string;
  trailerNumber: string;
  driverName: string;
  driverPhone: string;
}
