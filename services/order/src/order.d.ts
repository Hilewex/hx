import { CreateOrderCommand, OrderResponse, OrderDetailResponse } from '@hx/contracts';
export declare function getOrderById(orderId: string): Promise<OrderResponse | undefined>;
export declare function getOrderDetail(orderId: string): Promise<OrderDetailResponse>;
export declare function createOrderFromPayment(command: CreateOrderCommand): Promise<OrderResponse>;
//# sourceMappingURL=order.d.ts.map