import axios from 'axios';
import { ALPACA_DOMAIN, ALPACA_KEY, ALPACA_SECRET } from '../constants';

interface AccountResponse {
    id: string;
    account_number: string;
    status: string;
    crypto_status: string;
    currency: string;
    buying_power: string;
    regt_buying_power: string;
    daytrading_buying_power: string;
    non_marginable_buying_power: string;
    cash: string;
    accrued_fees: string;
    pending_transfer_in: string;
    portfolio_value: string;
    multiplier: string;
    equity: string;
    last_equity: string;
    long_market_value: string;
    short_market_value: string;
    initial_margin: string;
    maintenance_margin: string;
    last_maintenance_margin: string;
    sma: string;
    daytrade_count: number;
    crypto_tier: string;
    account_type: string;
    created_at: string;
    trade_suspended_by_user: boolean;
    trading_blocked: boolean;
    transfers_blocked: boolean;
    account_blocked: boolean;
    fractional_trading_enabled: boolean;
    positions_count: number;
    crypto_positions_count: number;
}

export const getAccount = async (): Promise<AccountResponse> => {
    try {
        const response = await axios.get(`${ALPACA_DOMAIN}/account`, {
            headers: {
                'APCA-API-KEY-ID': ALPACA_KEY,
                'APCA-API-SECRET-KEY': ALPACA_SECRET
            }
        });
        return response.data;
    } catch (err: any) {
        const e = err?.response?.data || err;
        console.log(e);
        throw e;
    }
};
