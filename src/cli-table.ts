import type { OutputRow } from "./cli.ts";
import { bold, gray, green, yellow } from "./cli-color.ts";

export const leftTopCorner = "┌";
export const rightTopCorner = "┐";
export const leftBottomCorner = "└";
export const rightBottomCorner = "┘";
export const leftMiddleCorner = "├";
export const rightMiddleCorner = "┤";
export const horizontal = "─";
export const vertical = "│";

export function renderTable(rows: OutputRow[]) {
    console.log(table(rows).join("\n"));
}

export function table(rows: OutputRow[]): string[] {
    const content: string[] = [];
    const headers = Object.keys(rows[0]);
    const nbrCols = headers.length;

    const colMaxWidth: number[] = [];
    for (const row of rows) {
        let index = 0;
        for (const col of headers) {
            if (!colMaxWidth[index]) {
                colMaxWidth[index] = headers[index].length;
            }
            if (row[col].length > colMaxWidth[index]) {
                colMaxWidth[index] = row[col].length;
            }
            index++;
        }
    }
    const tableWidth = colMaxWidth.reduce((a, b) => a + b, nbrCols * 4) + 1;

    const headerLine = new Line();
    for (let i = 0; i < headers.length; i++) {
        headerLine.push(cell(headers[i], colMaxWidth[i], (v) => bold(v)));
    }

    content.push(...header(headerLine, tableWidth));

    for (const row of rows) {
        let j = 0;
        const rowLine = new Line();
        for (const col of headers) {
            let wrapper: ((v: string) => string) | undefined;
            if (col === "status") {
                if (row.status === "need update") {
                    wrapper = (v: string) => yellow(v);
                } else if (row.status === "ok") {
                    wrapper = (v: string) => green(v);
                }
            }
            if (col === "package" && row.status === "need update") {
                wrapper = (v: string) => bold(v);
            }
            if (!wrapper && row.status !== "need update") {
                wrapper = (v: string) => gray(v);
            }
            if (!wrapper && row.status === "need update") {
                wrapper = (v: string) => v;
            }
            rowLine.push(superCell(row[col], colMaxWidth[j], wrapper));
            j++;
        }
        content.push(rowLine.toString());
    }
    content.push(bottomSeparator(tableWidth));

    return content;
}

export class Line {
    private content: string[] = [];

    push(text: string): void {
        this.content.push(text);
    }

    toString(delimiter: string = ` ${vertical} `): string {
        return `${vertical} ${this.content.join(delimiter)} ${vertical}`;
    }
}

function header(headerLine: Line, width: number): string[] {
    return [topSeparator(width), headerLine.toString(), middleSeparator(width)];
}

function cell(value: any, maxWidth: number, wrap?: (v: string) => string): string {
    let space = "";
    const pad = maxWidth - value.length;
    if (pad > 0) {
        space = " ".repeat(pad);
    }

    if (wrap) {
        value = wrap(value);
    }
    return `${value} ${space}`;
}

function superCell(value: any, maxWidth: number, wrap?: (v: string) => string): string {
    if (!wrap) {
        switch (value) {
            case "-":
                return cell(value, maxWidth, (v) => gray(v));
            default:
                return cell(value, maxWidth, wrap);
        }
    }
    return cell(value, maxWidth, wrap);
}

function separator(width: number, corner?: { left?: string; right?: string }): string {
    if (!corner) {
        return horizontal.repeat(width);
    }
    return `${corner.left ?? leftTopCorner}${horizontal.repeat(width - 2)}${corner.right ?? rightTopCorner}`;
}

function middleSeparator(width: number): string {
    return separator(width, { left: leftMiddleCorner, right: rightMiddleCorner });
}

function bottomSeparator(width: number): string {
    return separator(width, { left: leftBottomCorner, right: rightBottomCorner });
}

function topSeparator(width: number): string {
    return separator(width, { left: leftTopCorner, right: rightTopCorner });
}
