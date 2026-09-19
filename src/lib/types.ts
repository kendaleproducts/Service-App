export const SERVICE_REQUEST_STATUSES = [
  "New",
  "Scheduled",
  "In Progress",
  "Awaiting Parts",
  "Completed",
  "Cancelled",
] as const;
export type ServiceRequestStatus = (typeof SERVICE_REQUEST_STATUSES)[number];

export const SERVICE_REQUEST_PRIORITIES = ["Low", "Normal", "High", "Urgent"] as const;
export type ServiceRequestPriority = (typeof SERVICE_REQUEST_PRIORITIES)[number];

export const LOCATION_STATUSES = ["Open", "Pending", "Archived"] as const;
export type LocationStatus = (typeof LOCATION_STATUSES)[number];

export const SHIPMENT_STATUSES = ["Preparing", "Shipped", "Delivered", "Cancelled"] as const;
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export interface Customer {
  id: number;
  name: string;
  created_at: string;
}

export interface Location {
  id: number;
  customer_id: number;
  store_number: string;
  name: string;
  ownership: string | null;
  status: string;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  phone: string | null;
  contact_name: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceCompany {
  id: number;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  coverage_area: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Part {
  id: number;
  part_number: string;
  description: string;
  quantity_on_hand: number;
  reorder_threshold: number;
  unit_cost: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequest {
  id: number;
  location_id: number;
  service_company_id: number | null;
  status: string;
  priority: string;
  equipment_description: string | null;
  issue_description: string;
  reported_by: string | null;
  reported_at: string;
  scheduled_at: string | null;
  completed_at: string | null;
  cost: number | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequestWithJoins extends ServiceRequest {
  location_name: string;
  store_number: string;
  city: string | null;
  province: string | null;
  service_company_name: string | null;
}

export interface ServiceRequestNote {
  id: number;
  service_request_id: number;
  note: string;
  created_at: string;
}

export interface PartShipment {
  id: number;
  service_request_id: number | null;
  location_id: number | null;
  service_company_id: number | null;
  carrier: string | null;
  tracking_number: string | null;
  status: string;
  shipped_at: string | null;
  delivered_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PartShipmentItem {
  id: number;
  part_shipment_id: number;
  part_id: number;
  quantity: number;
}
