import express, { Application, Request, Response } from 'express';
import fs from 'fs';
import https from 'https';
import nocache from 'nocache';
import { getAccount } from './alpaca/account';
import { buyBestOption } from './actions/buy_best_option';
import { loginToDiscord } from './libs/discord';

loginToDiscord(() => {});

const app: Application = express();
const port = 4000;

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

interface BuyOptionRequest {
    type: 'call' | 'put';
    symbol: string;
}

app.post('/buy-best-option', async (req: Request, res: Response) => {
    try {
        const { symbol, type }: BuyOptionRequest = req.body;
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

try {
    const server = https.createServer({
        key: fs.readFileSync('localhost.key'),
        cert: fs.readFileSync('localhost.crt')
    }, app);

    server.listen(port, (): void => {
        console.log(`Connected successfully on port ${port}`);
    });
} catch (error: any) {
    console.error(`Error occurred: ${error?.message}`);
}
