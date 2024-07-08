import Alpaca from '@alpacahq/alpaca-trade-api';
import { ALPACA_KEY, ALPACA_SECRET, paperMode } from '../constants';

class WebsocketSubscriber {
    private alpaca: Alpaca;

    constructor(keyId: string, secretKey: string, paper = true) {
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
        updates_client.onOrderUpdate((data: any) => {
            console.log(`Order updates: ${JSON.stringify(data)}`);
        });
        updates_client.onAccountUpdate((data: any) => {
            console.log(`Account updates: ${JSON.stringify(data)}`);
        });
        updates_client.connect();
    }
}

export const ws = new WebsocketSubscriber(ALPACA_KEY, ALPACA_SECRET, paperMode);
