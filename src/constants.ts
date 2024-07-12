export const paperMode = process.env.ENVIRONMENT === 'dev' ? true : false;

export const ALPACA_KEY = paperMode ? process.env.ALPACA_PAPER_KEY as string : process.env.ALPACA_KEY as string;
export const ALPACA_SECRET = paperMode ? process.env.ALPACA_PAPER_SECRET as string : process.env.ALPACA_SECRET as string;

export const ALPACA_BASE_URL = paperMode ?  'https://paper-api.alpaca.markets' : 'https://api.alpaca.markets';
export const ALPACA_DATA_URL = 'https://data.alpaca.markets';
