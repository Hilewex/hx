import type {
  PublicProjectionEnvelope,
  SupplierDashboardProjection,
  SupplierOrdersProjection,
  SupplierProductsProjection,
  SupplierShipmentsProjection,
  SupplierSupportProjection,
} from '@hx/contracts';
import { readBffProjectionState } from './read';

export type SupplierDashboardReadProjection = SupplierDashboardProjection;
export type SupplierProductsReadProjection = SupplierProductsProjection;
export type SupplierOrdersReadProjection = SupplierOrdersProjection;
export type SupplierShipmentsReadProjection = SupplierShipmentsProjection;
export type SupplierSupportReadProjection = SupplierSupportProjection;

export function readSupplierDashboardProjection(): Promise<PublicProjectionEnvelope<SupplierDashboardReadProjection>> {
  return readBffProjectionState<SupplierDashboardReadProjection>('/supplier');
}

export function readSupplierProductsProjection(): Promise<PublicProjectionEnvelope<SupplierProductsReadProjection>> {
  return readBffProjectionState<SupplierProductsReadProjection>('/supplier/products');
}

export function readSupplierOrdersProjection(): Promise<PublicProjectionEnvelope<SupplierOrdersReadProjection>> {
  return readBffProjectionState<SupplierOrdersReadProjection>('/supplier/orders');
}

export function readSupplierShipmentsProjection(): Promise<PublicProjectionEnvelope<SupplierShipmentsReadProjection>> {
  return readBffProjectionState<SupplierShipmentsReadProjection>('/supplier/shipments');
}

export function readSupplierSupportProjection(): Promise<PublicProjectionEnvelope<SupplierSupportReadProjection>> {
  return readBffProjectionState<SupplierSupportReadProjection>('/supplier/support');
}
