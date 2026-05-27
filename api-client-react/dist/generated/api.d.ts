import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { AgentInput, AgentRecord, DriverBalance, DriverInput, DriverProfile, DriverStatusUpdate, ErrorResponse, HealthStatus, ListDriversParams, ListOrdersParams, OfferInput, OfferRecord, OrderInput, OrderRecord, OrderStatusUpdate, SelectOfferInput } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getRegisterDriverUrl: () => string;
/**
 * @summary Register a new driver
 */
export declare const registerDriver: (driverInput: DriverInput, options?: RequestInit) => Promise<DriverProfile>;
export declare const getRegisterDriverMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof registerDriver>>, TError, {
        data: BodyType<DriverInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof registerDriver>>, TError, {
    data: BodyType<DriverInput>;
}, TContext>;
export type RegisterDriverMutationResult = NonNullable<Awaited<ReturnType<typeof registerDriver>>>;
export type RegisterDriverMutationBody = BodyType<DriverInput>;
export type RegisterDriverMutationError = ErrorType<ErrorResponse>;
/**
* @summary Register a new driver
*/
export declare const useRegisterDriver: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof registerDriver>>, TError, {
        data: BodyType<DriverInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof registerDriver>>, TError, {
    data: BodyType<DriverInput>;
}, TContext>;
export declare const getListDriversUrl: (params?: ListDriversParams) => string;
/**
 * @summary List all drivers (admin)
 */
export declare const listDrivers: (params?: ListDriversParams, options?: RequestInit) => Promise<DriverProfile[]>;
export declare const getListDriversQueryKey: (params?: ListDriversParams) => readonly ["/api/drivers", ...ListDriversParams[]];
export declare const getListDriversQueryOptions: <TData = Awaited<ReturnType<typeof listDrivers>>, TError = ErrorType<unknown>>(params?: ListDriversParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDrivers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listDrivers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListDriversQueryResult = NonNullable<Awaited<ReturnType<typeof listDrivers>>>;
export type ListDriversQueryError = ErrorType<unknown>;
/**
 * @summary List all drivers (admin)
 */
export declare function useListDrivers<TData = Awaited<ReturnType<typeof listDrivers>>, TError = ErrorType<unknown>>(params?: ListDriversParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDrivers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetDriverUrl: (id: number) => string;
/**
 * @summary Get driver profile
 */
export declare const getDriver: (id: number, options?: RequestInit) => Promise<DriverProfile>;
export declare const getGetDriverQueryKey: (id: number) => readonly [`/api/drivers/${number}`];
export declare const getGetDriverQueryOptions: <TData = Awaited<ReturnType<typeof getDriver>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDriver>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDriver>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDriverQueryResult = NonNullable<Awaited<ReturnType<typeof getDriver>>>;
export type GetDriverQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get driver profile
 */
export declare function useGetDriver<TData = Awaited<ReturnType<typeof getDriver>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDriver>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateDriverStatusUrl: (id: number) => string;
/**
 * @summary Approve or reject a driver (admin)
 */
export declare const updateDriverStatus: (id: number, driverStatusUpdate: DriverStatusUpdate, options?: RequestInit) => Promise<DriverProfile>;
export declare const getUpdateDriverStatusMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateDriverStatus>>, TError, {
        id: number;
        data: BodyType<DriverStatusUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateDriverStatus>>, TError, {
    id: number;
    data: BodyType<DriverStatusUpdate>;
}, TContext>;
export type UpdateDriverStatusMutationResult = NonNullable<Awaited<ReturnType<typeof updateDriverStatus>>>;
export type UpdateDriverStatusMutationBody = BodyType<DriverStatusUpdate>;
export type UpdateDriverStatusMutationError = ErrorType<ErrorResponse>;
/**
* @summary Approve or reject a driver (admin)
*/
export declare const useUpdateDriverStatus: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateDriverStatus>>, TError, {
        id: number;
        data: BodyType<DriverStatusUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateDriverStatus>>, TError, {
    id: number;
    data: BodyType<DriverStatusUpdate>;
}, TContext>;
export declare const getGetDriverBalanceUrl: (id: number) => string;
/**
 * @summary Get driver commission balance
 */
export declare const getDriverBalance: (id: number, options?: RequestInit) => Promise<DriverBalance>;
export declare const getGetDriverBalanceQueryKey: (id: number) => readonly [`/api/drivers/${number}/balance`];
export declare const getGetDriverBalanceQueryOptions: <TData = Awaited<ReturnType<typeof getDriverBalance>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDriverBalance>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDriverBalance>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDriverBalanceQueryResult = NonNullable<Awaited<ReturnType<typeof getDriverBalance>>>;
export type GetDriverBalanceQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get driver commission balance
 */
export declare function useGetDriverBalance<TData = Awaited<ReturnType<typeof getDriverBalance>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDriverBalance>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateOrderUrl: () => string;
/**
 * @summary Create a new order
 */
export declare const createOrder: (orderInput: OrderInput, options?: RequestInit) => Promise<OrderRecord>;
export declare const getCreateOrderMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createOrder>>, TError, {
        data: BodyType<OrderInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createOrder>>, TError, {
    data: BodyType<OrderInput>;
}, TContext>;
export type CreateOrderMutationResult = NonNullable<Awaited<ReturnType<typeof createOrder>>>;
export type CreateOrderMutationBody = BodyType<OrderInput>;
export type CreateOrderMutationError = ErrorType<unknown>;
/**
* @summary Create a new order
*/
export declare const useCreateOrder: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createOrder>>, TError, {
        data: BodyType<OrderInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createOrder>>, TError, {
    data: BodyType<OrderInput>;
}, TContext>;
export declare const getListOrdersUrl: (params?: ListOrdersParams) => string;
/**
 * @summary List orders
 */
export declare const listOrders: (params?: ListOrdersParams, options?: RequestInit) => Promise<OrderRecord[]>;
export declare const getListOrdersQueryKey: (params?: ListOrdersParams) => readonly ["/api/orders", ...ListOrdersParams[]];
export declare const getListOrdersQueryOptions: <TData = Awaited<ReturnType<typeof listOrders>>, TError = ErrorType<unknown>>(params?: ListOrdersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listOrders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listOrders>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListOrdersQueryResult = NonNullable<Awaited<ReturnType<typeof listOrders>>>;
export type ListOrdersQueryError = ErrorType<unknown>;
/**
 * @summary List orders
 */
export declare function useListOrders<TData = Awaited<ReturnType<typeof listOrders>>, TError = ErrorType<unknown>>(params?: ListOrdersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listOrders>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetOrderUrl: (id: number) => string;
/**
 * @summary Get order details
 */
export declare const getOrder: (id: number, options?: RequestInit) => Promise<OrderRecord>;
export declare const getGetOrderQueryKey: (id: number) => readonly [`/api/orders/${number}`];
export declare const getGetOrderQueryOptions: <TData = Awaited<ReturnType<typeof getOrder>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOrder>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getOrder>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetOrderQueryResult = NonNullable<Awaited<ReturnType<typeof getOrder>>>;
export type GetOrderQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get order details
 */
export declare function useGetOrder<TData = Awaited<ReturnType<typeof getOrder>>, TError = ErrorType<ErrorResponse>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getOrder>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSubmitOfferUrl: (id: number) => string;
/**
 * @summary Driver submits an offer on an order
 */
export declare const submitOffer: (id: number, offerInput: OfferInput, options?: RequestInit) => Promise<OfferRecord>;
export declare const getSubmitOfferMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitOffer>>, TError, {
        id: number;
        data: BodyType<OfferInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof submitOffer>>, TError, {
    id: number;
    data: BodyType<OfferInput>;
}, TContext>;
export type SubmitOfferMutationResult = NonNullable<Awaited<ReturnType<typeof submitOffer>>>;
export type SubmitOfferMutationBody = BodyType<OfferInput>;
export type SubmitOfferMutationError = ErrorType<ErrorResponse>;
/**
* @summary Driver submits an offer on an order
*/
export declare const useSubmitOffer: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitOffer>>, TError, {
        id: number;
        data: BodyType<OfferInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof submitOffer>>, TError, {
    id: number;
    data: BodyType<OfferInput>;
}, TContext>;
export declare const getListOrderOffersUrl: (id: number) => string;
/**
 * @summary Get cheapest 3 offers for an order
 */
export declare const listOrderOffers: (id: number, options?: RequestInit) => Promise<OfferRecord[]>;
export declare const getListOrderOffersQueryKey: (id: number) => readonly [`/api/orders/${number}/offers`];
export declare const getListOrderOffersQueryOptions: <TData = Awaited<ReturnType<typeof listOrderOffers>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listOrderOffers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listOrderOffers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListOrderOffersQueryResult = NonNullable<Awaited<ReturnType<typeof listOrderOffers>>>;
export type ListOrderOffersQueryError = ErrorType<unknown>;
/**
 * @summary Get cheapest 3 offers for an order
 */
export declare function useListOrderOffers<TData = Awaited<ReturnType<typeof listOrderOffers>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listOrderOffers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSelectOrderOfferUrl: (id: number) => string;
/**
 * @summary Customer selects an offer
 */
export declare const selectOrderOffer: (id: number, selectOfferInput: SelectOfferInput, options?: RequestInit) => Promise<OrderRecord>;
export declare const getSelectOrderOfferMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof selectOrderOffer>>, TError, {
        id: number;
        data: BodyType<SelectOfferInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof selectOrderOffer>>, TError, {
    id: number;
    data: BodyType<SelectOfferInput>;
}, TContext>;
export type SelectOrderOfferMutationResult = NonNullable<Awaited<ReturnType<typeof selectOrderOffer>>>;
export type SelectOrderOfferMutationBody = BodyType<SelectOfferInput>;
export type SelectOrderOfferMutationError = ErrorType<ErrorResponse>;
/**
* @summary Customer selects an offer
*/
export declare const useSelectOrderOffer: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof selectOrderOffer>>, TError, {
        id: number;
        data: BodyType<SelectOfferInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof selectOrderOffer>>, TError, {
    id: number;
    data: BodyType<SelectOfferInput>;
}, TContext>;
export declare const getUpdateOrderStatusUrl: (id: number) => string;
/**
 * @summary Update order delivery stage
 */
export declare const updateOrderStatus: (id: number, orderStatusUpdate: OrderStatusUpdate, options?: RequestInit) => Promise<OrderRecord>;
export declare const getUpdateOrderStatusMutationOptions: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateOrderStatus>>, TError, {
        id: number;
        data: BodyType<OrderStatusUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateOrderStatus>>, TError, {
    id: number;
    data: BodyType<OrderStatusUpdate>;
}, TContext>;
export type UpdateOrderStatusMutationResult = NonNullable<Awaited<ReturnType<typeof updateOrderStatus>>>;
export type UpdateOrderStatusMutationBody = BodyType<OrderStatusUpdate>;
export type UpdateOrderStatusMutationError = ErrorType<ErrorResponse>;
/**
* @summary Update order delivery stage
*/
export declare const useUpdateOrderStatus: <TError = ErrorType<ErrorResponse>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateOrderStatus>>, TError, {
        id: number;
        data: BodyType<OrderStatusUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateOrderStatus>>, TError, {
    id: number;
    data: BodyType<OrderStatusUpdate>;
}, TContext>;
export declare const getListAgentsUrl: () => string;
/**
 * @summary List all active agents
 */
export declare const listAgents: (options?: RequestInit) => Promise<AgentRecord[]>;
export declare const getListAgentsQueryKey: () => readonly ["/api/agents"];
export declare const getListAgentsQueryOptions: <TData = Awaited<ReturnType<typeof listAgents>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAgents>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAgents>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAgentsQueryResult = NonNullable<Awaited<ReturnType<typeof listAgents>>>;
export type ListAgentsQueryError = ErrorType<unknown>;
/**
 * @summary List all active agents
 */
export declare function useListAgents<TData = Awaited<ReturnType<typeof listAgents>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAgents>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateAgentUrl: () => string;
/**
 * @summary Create a new agent (admin)
 */
export declare const createAgent: (agentInput: AgentInput, options?: RequestInit) => Promise<AgentRecord>;
export declare const getCreateAgentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAgent>>, TError, {
        data: BodyType<AgentInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createAgent>>, TError, {
    data: BodyType<AgentInput>;
}, TContext>;
export type CreateAgentMutationResult = NonNullable<Awaited<ReturnType<typeof createAgent>>>;
export type CreateAgentMutationBody = BodyType<AgentInput>;
export type CreateAgentMutationError = ErrorType<unknown>;
/**
* @summary Create a new agent (admin)
*/
export declare const useCreateAgent: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAgent>>, TError, {
        data: BodyType<AgentInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createAgent>>, TError, {
    data: BodyType<AgentInput>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map