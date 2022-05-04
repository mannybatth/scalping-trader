import express, { Application, Request, Response } from 'express';
import fs from 'fs';
import https from 'https';
import { TDAmeritrade } from './td/td';
import nocache from 'nocache';
import { Alert } from './td/models';
import { loginToDiscord } from './discord';

const app: Application = express();
const port = 3000;

const td = new TDAmeritrade();
// const binance = new BinanceClient();

loginToDiscord(td, () => {});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(nocache());

app.get('/', (req: Request, res: Response): Response => {
    return res.status(200).send({
        message: 'Hello World!'
    });
});

app.get('/td-callback', async (req: Request, res: Response) => {
    console.log('td callback called');
    try {
        const response = await td.createAccessToken(req.query?.code as string);
        return res.status(200).send(response);
    } catch (e: any) {
        return res.status(200).send({
            error: e?.message || e
        });
    }
});

app.get('/td/login', (req: Request, res: Response) => {
    return res.redirect(301, td.authUrl);
});

app.get('/td/accounts', async (req: Request, res: Response) => {
    try {
        const response = await td.getAccounts();
        return res.status(200).send(response);
    } catch (e: any) {
        return res.status(200).send({
            error: e?.message || e
        });
    }
});

app.get('/td/get-options-chain', async (req: Request, res: Response) => {
    try {
        const response = await td.getOptionsChain(req.query.symbol as string);
        return res.status(200).send(response);
    } catch (e: any) {
        return res.status(200).send({
            error: e?.message || e
        });
    }
});

app.get('/td/get-options-chain', async (req: Request, res: Response) => {
    try {
        const response = await td.getOptionsChain(req.query.symbol as string);
        return res.status(200).send(response);
    } catch (e: any) {
        return res.status(200).send({
            error: e?.message || e
        });
    }
});

app.get('/td/streamer-subscription-keys', async (req: Request, res: Response) => {
    try {
        const response = await td.getSubscriptionKeys();
        return res.status(200).send(response);
    } catch (e: any) {
        return res.status(200).send({
            error: e?.message || e
        });
    }
});

app.post('/alert', async (req: Request, res: Response) => {
    try {
        const alert = req.body as Alert;
        if (alert.crypto) {
            // const response = await binance.processAlert(alert);
            // return res.status(200).send(response);
            return res.status(200).send();
        } else {
            const response = await td.processAlert(alert);
            return res.status(200).send(response);
        }
    }
    catch (e: any) {
        console.log({
            error: e.message || e
        });
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
