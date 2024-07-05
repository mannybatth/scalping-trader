import express, { Application, Request, Response } from 'express';
import fs from 'fs';
import https from 'https';
import nocache from 'nocache';

const app: Application = express();
const port = 4000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(nocache());

app.get('/', (req: Request, res: Response): Response => {
    return res.status(200).send({
        message: 'Hello World!'
    });
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
