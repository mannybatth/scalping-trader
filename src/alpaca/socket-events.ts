import Alpaca from '@alpacahq/alpaca-trade-api';
import { ALPACA_KEY, ALPACA_SECRET, paperMode } from '../constants';
import { Order, OrderUpdate } from './models';
import { createOrder, getAllOrders, OrderRequest } from './orders';
import { getAllOpenPositions } from './positions';

class WebsocketSubscriber {
    private alpaca: Alpaca;

    constructor(keyId: string, secretKey: string, paper = true) {
        const messageColor = paper ? '\x1b[32m' : '\x1b[31m'; // Green for PAPER, Red for LIVE
        const resetColor = '\x1b[0m';
        const liveWarning = paper ? '' : '\x1b[33m⚠️ WARNING: You are connecting to a LIVE account!⚠️\x1b[0m\n';
        console.log(`${messageColor}Connecting to ${paper ? 'PAPER' : 'LIVE'} account${resetColor}`);
        if (!paper) {
            console.log(liveWarning);
        }
        this.alpaca = new Alpaca({
            keyId: keyId,
            secretKey: secretKey,
            paper: paper
        });
    }

    public connect() {
        const updates_client = this.alpaca.trade_ws;
        updates_client.onConnect(function () {
            console.log('Connected to Alpaca WebSockets');
            const trade_keys = ['trade_updates', 'account_updates'];
            updates_client.subscribe(trade_keys);
        });
        updates_client.onDisconnect(() => {
            console.log('Disconnected');
        });
        updates_client.onStateChange((newState: string) => {
            console.log(`State changed to ${newState}`);
        });
        updates_client.onOrderUpdate(async (data: OrderUpdate) => {
            console.log(`Order updates: ${JSON.stringify(data)}`);

            if (data.event === 'fill' && data.order?.side === 'buy' && data.order?.client_order_id?.startsWith('auto-trade')) {
                console.log('Auto-trade buy order filled', data.order);
                await this.createTakeProfitOrder(data.order);
            }
        });
        updates_client.onAccountUpdate((data: any) => {
            console.log(`Account updates: ${JSON.stringify(data)}`);
        });
        updates_client.connect();
    }

    private async createTakeProfitOrder(order: Order) {
        let takeProfitOrder: OrderRequest;

        const positions = await getAllOpenPositions();
        const openPosition = positions.find(position => position.symbol === order.symbol);

        if (openPosition && parseInt(openPosition.qty) > parseInt(order.filled_qty!)) {

            console.log('Open position found', openPosition);

            // Cancel open sell orders for the symbol
            const openOrders = await getAllOrders({
                status: 'open',
                side: 'sell',
                symbols: order.symbol
            });

            // Cancel sell order in parallel, await all
            await Promise.all(openOrders.map(async openOrder => {
                try {
                    await this.alpaca.cancelOrder(openOrder.id);
                    console.log('Cancelled open sell order', openOrder.id);
                } catch (error) {
                    console.error('Failed to cancel open sell order', error);
                }
            }));

            const takeProfitPrice = (parseFloat(openPosition.avg_entry_price) * 1.05).toFixed(2);
            takeProfitOrder = {
                symbol: order.symbol,
                qty: openPosition.qty,
                side: 'sell',
                type: 'limit',
                time_in_force: 'day',
                limit_price: takeProfitPrice
            };
        } else {
            const takeProfitPrice = (parseFloat(order.filled_avg_price!) * 1.05).toFixed(2);
            takeProfitOrder = {
                symbol: order.symbol,
                qty: order.filled_qty,
                side: 'sell',
                type: 'limit',
                time_in_force: 'day',
                limit_price: takeProfitPrice
            };
        }

        try {
            const response = await createOrder(takeProfitOrder);
            console.log('Take profit order created', response);
        } catch (error) {
            console.error('Failed to create take profit order', error);
        }
    }
}

export const ws = new WebsocketSubscriber(ALPACA_KEY, ALPACA_SECRET, paperMode);
