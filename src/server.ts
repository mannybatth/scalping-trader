import express, { Application, Request, Response } from 'express';
import nocache from 'nocache';
import cors from 'cors';
import { getAccount } from './alpaca/account';
import { buyBestOption } from './actions/buy_best_option';
import { loginToDiscord } from './libs/discord';
import { createOrderByContractSymbol } from './actions/buy_option';
import { ws } from './alpaca/socket-events';
import { getOptionSnapshots } from './alpaca/contracts';

ws.connect();
loginToDiscord(() => {});

const app: Application = express();
const port = 4000;

// Custom CORS options
const corsOptions = {
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow all methods
    allowedHeaders: '*', // Allow all headers
    exposedHeaders: '*', // Expose all headers
    credentials: true, // Allow credentials (e.g., cookies, authorization headers)
    preflightContinue: false, // Do not continue to the next middleware for OPTIONS requests
    optionsSuccessStatus: 204 // Return 204 for OPTIONS requests
};

// Use the CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(nocache());

app.get('/', (req: Request, res: Response): Response => {
    return res.status(200).send({
        message: 'Hello, world!'
    });
});

app.get('/account', async (req: Request, res: Response) => {
    try {
        const response = await getAccount();
        return res.status(200).send({
            account: response
        });
    } catch (e: any) {
        return res.status(200).send({
            error: e?.message || e
        });
    }
});

interface BuyBestOptionRequest {
    type: 'call' | 'put';
    symbol: string;
}

app.post('/buy-best-option', async (req: Request, res: Response) => {
    try {
        const { symbol, type }: BuyBestOptionRequest = req.body;
        if (!symbol || !type) {
            throw new Error('Missing required parameters');
        }

        const response = await buyBestOption({ symbol, type });
        return res.status(200).send({
            order: response
        });
    } catch (e: any) {
        return res.status(200).send({
            error: e?.message || e
        });
    }
});

app.get('/option-contracts', async (req: Request, res: Response) => {
    const symbol = req.query.symbol as string;
    const type = req.query.type as 'call' | 'put';
    if (!symbol || !type) {
        return res.status(200).send({
            error: 'Missing required parameters'
        });
    }

    try {
        const response = await getOptionSnapshots(symbol, type);
        return res.status(200).send({
            contracts: response
        });
    } catch (e: any) {
        return res.status(200).send({
            error: e?.message || e
        });
    }
});

interface BuyContractRequest {
    symbol: string;
    force: boolean;
}

app.post('/buy-contract', async (req: Request, res: Response) => {
    try {
        const { symbol, force }: BuyContractRequest = req.body;
        if (!symbol) {
            throw new Error('Missing required parameters');
        }

        const response = await createOrderByContractSymbol({
            contractSymbol: symbol,
            forceBuy: force
        });
        return res.status(200).send({
            order: response
        });
    } catch (e: any) {
        return res.status(200).send({
            error: e?.message || e
        });
    }
});

// Start the server using HTTP
try {
    app.listen(port, (): void => {
        console.log(`Connected successfully on port ${port}`);
    });
} catch (error: any) {
    console.error(`Error occurred: ${error?.message}`);
}
