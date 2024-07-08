import axios from 'axios';
import { ALPACA_BASE_URL, ALPACA_KEY, ALPACA_SECRET } from '../constants';

export interface AlpacaAccount {
    id: string;
    admin_configurations: object;
    user_configurations: any;
    account_number: string;
    status: string;
    crypto_status: string;
    options_approved_level: number;
    options_trading_level: number;
    currency: string;
    buying_power: string;
    regt_buying_power: string;
    daytrading_buying_power: string;
    effective_buying_power: string;
    non_marginable_buying_power: string;
    options_buying_power: string;
    bod_dtbp: string;
    cash: string;
    accrued_fees: string;
    pending_transfer_in: string;
    portfolio_value: string;
    pattern_day_trader: boolean;
    trading_blocked: boolean;
    transfers_blocked: boolean;
    account_blocked: boolean;
    created_at: string;
    trade_suspended_by_user: boolean;
    multiplier: string;
    shorting_enabled: boolean;
    equity: string;
    last_equity: string;
    long_market_value: string;
    short_market_value: string;
    position_market_value: string;
    initial_margin: string;
    maintenance_margin: string;
    last_maintenance_margin: string;
    sma: string;
    daytrade_count: number;
    balance_asof: string;
    crypto_tier: number;
    intraday_adjustments: string;
    pending_reg_taf_fees: string;
}


export const getAccount = async (): Promise<AlpacaAccount> => {
    try {
        const response = await axios.get(`${ALPACA_BASE_URL}/v2/account`, {
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
