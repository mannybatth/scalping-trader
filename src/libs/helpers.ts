export const searchParams = (params: Record<string, string | number>): string => {
    return Object.keys(params)
        .map((key) => {
            return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
        })
        .join('&');
};

/**
 * returns true if the time difference is more than or equal to the maxDifference
 * maxDifference should be in seconds
*/
export const compareTimeDifference = (t1: string, t2: string, maxDifference: number): boolean => {
    const date1 = new Date(t1).getTime();
    const date2 = new Date(t2).getTime();

    const diff = Math.floor((date2 - date1) / 1000); // difference in seconds

    return (diff >= maxDifference);
}

export const getClosestOTMStrike = (strikes: number[], strike: number, side: 'long' | 'short'): { strike: number; index: number } => {
    const list = strikes.filter((s) => side === 'long' ? s >= strike : s <= strike);
    const strikeDiff = list.map((s) => Math.abs(s - strike));
    const minDiff = strikeDiff.reduce((a, b) => Math.min(a, b));
    const index = strikeDiff.indexOf(minDiff);
    return {
        strike: list[index],
        index
    }
}
