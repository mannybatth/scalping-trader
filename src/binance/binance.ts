import keys from '../../binance-keys.json';
import Binance, { MarginType, OrderSide, OrderType } from 'binance-api-node';
import { BuyAlert } from '../td/models';

const leverage = 1;
const takeProfit = 1.0015;
const stopLoss = 0.9985;

const generateRandomId = () => Math.random().toString(36).substr(2, 10);

export class BinanceClient {
    private client = Binance({
        apiKey: keys.api_key,
        apiSecret: keys.secret_key
    });

    constructor() {
        this.client.ws.futuresUser(async (msg: any) => {

            if (msg.eventType === 'ACCOUNT_UPDATE') {
                for (const position of msg.positions) {
                    if (position.positionAmount === '0') {
                        const orders = await this.client.futuresOpenOrders({
                            symbol: position.symbol
                        });
                        for (const order of orders) {
                            await this.client.futuresCancelOrder({
                                symbol: order.symbol,
                                orderId: order.orderId
                            });
                        }
                    }
                }

            } else if (msg.eventType === 'ORDER_TRADE_UPDATE' && msg.orderStatus === 'FILLED') {
                if (msg.clientOrderId.includes('new_oco_order_')) {

                    const takeProfitPrice = parseFloat((msg.averagePrice * takeProfit).toFixed(2));
                    const stopLossPrice = parseFloat((msg.averagePrice * stopLoss).toFixed(2));

                    await this.client.futuresOrder({
                        symbol: msg.symbol,
                        side: msg.side === 'BUY' ? 'SELL' as OrderSide : 'BUY' as OrderSide,
                        type: 'TAKE_PROFIT_MARKET' as OrderType,
                        stopPrice: takeProfitPrice,
                        closePosition: 'true'
                    });
                    await this.client.futuresOrder({
                        symbol: msg.symbol,
                        side: msg.side === 'BUY' ? 'SELL' as OrderSide : 'BUY' as OrderSide,
                        type: 'STOP_MARKET' as OrderType,
                        quantity: `${msg.quantity}`,
                        stopPrice: stopLossPrice,
                        closePosition: 'true'
                    });
                }
            }
        });
    }

    public async processAlert(alert: BuyAlert): Promise<any> {
        try {
            await this.client.futuresMarginType({
                symbol: alert.symbol,
                marginType: 'ISOLATED' as MarginType
            });
        } catch (e) {
            if (e.message !== 'No need to change margin type.') {
                throw e;
            }
        }

        await this.client.futuresLeverage({
            symbol: alert.symbol,
            leverage: leverage
        });

        const side = alert.side === 'long' ? 'BUY' as OrderSide : 'SELL' as OrderSide;
        await this.client.futuresOrder({
            symbol: alert.symbol,
            side: side,
            type: 'MARKET' as OrderType,
            quantity: '0.001',
            newClientOrderId: 'new_oco_order_' + generateRandomId()
        });
    }
}
