export interface Order {
    id: string;
    client_order_id: string;
    created_at: string;
    updated_at: string;
    submitted_at: string;
    filled_at: string | null;
    expired_at: string | null;
    cancel_requested_at: string | null;
    canceled_at: string | null;
    failed_at: string | null;
    replaced_at: string | null;
    replaced_by: string | null;
    replaces: string | null;
    asset_id: string;
    symbol: string;
    asset_class: string;
    notional: string | null;
    qty: string;
    filled_qty: string;
    filled_avg_price: string | null;
    order_class: string;
    order_type: string;
    type: string;
    side: string;
    time_in_force: string;
    limit_price: string | null;
    stop_price: string | null;
    status: string;
    extended_hours: boolean;
    legs: string | null;
    trail_percent: string | null;
    trail_price: string | null;
    hwm: string | null;
}

export interface OrderUpdate {
    event: string;
    timestamp: string;
    order: Order;
    execution_id?: string;
    price?: string;
    qty?: string;
    position_qty?: string;
}
