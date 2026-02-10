const ESC = "\x1b[";

const codes = {
    reset: `${ESC}0m`,
    bold: `${ESC}1m`,
    dim: `${ESC}2m`,
    italic: `${ESC}3m`,
    underline: `${ESC}4m`,

    black: `${ESC}30m`,
    red: `${ESC}31m`,
    green: `${ESC}32m`,
    yellow: `${ESC}33m`,
    blue: `${ESC}34m`,
    magenta: `${ESC}35m`,
    cyan: `${ESC}36m`,
    white: `${ESC}37m`,
    test: `${ESC}38m`,
    orange: `${ESC}38;5;208m`,
    gray: `${ESC}90m`,
};

const enabled = process.stdout?.isTTY ?? false;

function wrap(text: string, ...styles: string[]) {
    if (!enabled) {
        return text;
    }
    return styles.join("") + text + codes.reset;
}

// foreground colors
export const red = (t: string) => wrap(t, codes.red);
export const green = (t: string) => wrap(t, codes.green);
export const yellow = (t: string) => wrap(t, codes.yellow);
export const orange = (t: string) => wrap(t, codes.orange);
export const blue = (t: string) => wrap(t, codes.blue);
export const magenta = (t: string) => wrap(t, codes.magenta);
export const cyan = (t: string) => wrap(t, codes.cyan);
export const gray = (t: string) => wrap(t, codes.gray);

// styles
export const bold = (t: string) => wrap(t, codes.bold);
export const dim = (t: string) => wrap(t, codes.dim);
export const underline = (t: string) => wrap(t, codes.underline);

// combine helpers (handy ones)
export const success = (t: string) => wrap(t, codes.green);
export const warn = (t: string) => wrap(t, codes.yellow);
export const error = (t: string) => wrap(t, codes.red, codes.bold);
