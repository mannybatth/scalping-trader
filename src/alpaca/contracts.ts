import axios from 'axios';
import { ALPACA_BASE_URL, ALPACA_DATA_URL, ALPACA_KEY, ALPACA_SECRET } from '../constants';
import { getLastQuoteBySymbol, LastQuoteResponse } from './quote';

export interface ContractGreeks {
    delta: number;
    gamma: number;
    rho: number;
    theta: number;
    vega: number;
}

export interface ContractQuote {
    ap: number;
    as: number;
    ax: string;
    bp: number;
    bs: number;
    bx: string;
    c: string;
    t: string;
}

export interface ContractTrade {
    c: string;
    p: number;
    s: number;
    t: string;
    x: string;
}

export interface OptionSnapshot {
    symbol: string;
    greeks: ContractGreeks;
    impliedVolatility: number;
    latestQuote: ContractQuote;
    latestTrade: ContractTrade;
    strikePrice: string;
    openInterest: string;
}

interface OptionContract {
    id: string;
    symbol: string;
    name: string;
    status: 'active' | 'inactive';
    tradable: boolean;
    expiration_date: string;
    root_symbol?: string;
    underlying_symbol: string;
    underlying_asset_id: string;
    type: 'call' | 'put';
    style: 'american' | 'european';
    strike_price: string;
    multiplier: string;
    size: string;
    open_interest?: string;
    open_interest_date?: string;
    close_price?: string;
    close_price_date?: string;
    // deliverables?: Deliverable[];
}

interface OptionSnapshotResponse {
    snapshots: { [key: string]: OptionSnapshot };
    next_page_token: string | null;
}

interface OptionContractResponse {
    option_contracts: OptionContract[];
    next_page_token: string | null;
}

const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
}

export const getOptionSnapshots = async (symbol: string, type: 'call' | 'put'): Promise<{
    snapshots: OptionSnapshot[];
    last_symbol_quote: LastQuoteResponse;
}> => {
    try {
        const lastQuoteResponse = await getLastQuoteBySymbol(symbol);
        const lastPrice = lastQuoteResponse.quote.bp;
        const priceAdjustment = lastPrice * 0.04;
        const today = new Date();
        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(today.getDate() + 3);
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        console.log('lastPrice', lastPrice);
        console.log('priceAdjustment', priceAdjustment);

        const params = {
            type: type,
            limit: 50,
            strike_price_gte: type === 'call' ? lastPrice : lastPrice - priceAdjustment,
            strike_price_lte: type === 'call' ? lastPrice + priceAdjustment : lastPrice,
            expiration_date_gte: formatDate(threeDaysFromNow),
            expiration_date_lte: formatDate(thirtyDaysFromNow)
        };

        const [snapshotsResponse, contractsResponse] = await Promise.all([
            axios.get<OptionSnapshotResponse>(`${ALPACA_DATA_URL}/v1beta1/options/snapshots/${symbol}`, {
                params: params,
                headers: {
                    'APCA-API-KEY-ID': ALPACA_KEY,
                    'APCA-API-SECRET-KEY': ALPACA_SECRET
                }
            }),
            axios.get<OptionContractResponse>(`${ALPACA_BASE_URL}/v2/options/contracts`, {
                params: {
                    ...params,
                    underlying_symbols: symbol
                },
                headers: {
                    'APCA-API-KEY-ID': ALPACA_KEY,
                    'APCA-API-SECRET-KEY': ALPACA_SECRET
                }
            })
        ]);

        const tradableContracts = contractsResponse.data.option_contracts.filter(c => c.tradable);
        const snapshots = Object.keys(snapshotsResponse.data.snapshots).map(key => {
            const snapshot = snapshotsResponse.data.snapshots[key];
            const contract = tradableContracts.find(c => c.symbol === key);

            if (contract) {
                return {
                    ...snapshot,
                    symbol: key,
                    strikePrice: contract.strike_price,
                    openInterest: contract.open_interest || '0'
                } as OptionSnapshot;
            }

            return null;
        }).filter(snapshot => snapshot !== null);

        console.log('snapshots', snapshots.length);
        console.log('contracts response', tradableContracts.length);

        return {
            snapshots,
            last_symbol_quote: lastQuoteResponse
        };
    } catch (err: any) {
        const e = err?.response?.data || err;
        console.log('contracts error', e);
        throw e;
    }
};

export const getOptionContractBySymbolOrId = async (symbolOrId: string): Promise<OptionSnapshot> => {
    try {
        const [snapshotResponse, contractResponse] = await Promise.all([
            axios.get<OptionSnapshotResponse>(`${ALPACA_DATA_URL}/v1beta1/options/snapshots`, {
                params: {
                    symbols: symbolOrId
                },
                headers: {
                    'APCA-API-KEY-ID': ALPACA_KEY,
                    'APCA-API-SECRET-KEY': ALPACA_SECRET
                }
            }),
            axios.get<OptionContractResponse>(`${ALPACA_BASE_URL}/v2/options/contracts/${symbolOrId}`, {
                headers: {
                    'APCA-API-KEY-ID': ALPACA_KEY,
                    'APCA-API-SECRET-KEY': ALPACA_SECRET
                }
            })
        ]);

        const snapshot = snapshotResponse.data.snapshots[symbolOrId];
        const contract = contractResponse.data.option_contracts.find(c => c.symbol === symbolOrId);

        if (!contract) {
            throw new Error('Contract not found');
        }

        const result: OptionSnapshot = {
            ...snapshot,
            symbol: symbolOrId,
            strikePrice: contract.strike_price,
            openInterest: contract.open_interest || '0'
        };

        console.log('option contract response', result);

        return result;
    } catch (err: any) {
        const e = err?.response?.data || err;
        console.log('option contract error', e);
        throw e;
    }
};
