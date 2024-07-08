export const ALPACA_KEY = process.env.ALPACA_KEY as string;
export const ALPACA_SECRET = process.env.ALPACA_SECRET as string;

export const paperMode = true;
export const ALPACA_BASE_URL = paperMode ?  'https://paper-api.alpaca.markets/v2' : 'https://api.alpaca.markets/v2';
export const ALPACA_DATA_URL = 'https://data.alpaca.markets/v2';
