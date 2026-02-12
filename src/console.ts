import * as fs from "node:fs";
import { clearColor } from "./cli-color.ts";

export interface Output extends Pick<Console, "error" | "log"> {}

export class CliOutput implements Output {
    error(...message: any[]): void {
        console.error(...message);
    }

    log(...message: any[]): void {
        console.log(...message);
    }
}

export class FileOutput implements Output {
    private content: string[] = [];

    error(...message: any[]): void {
        this.content.push(...message);
    }

    log(...message: any[]): void {
        this.content.push(...message);
    }

    saveTo(filePath: string): void {
        this.content = this.content.map((l) => clearColor(l));
        const today = new Date().toISOString();
        const header = `Upup report generated on ${today}\n\n`;
        fs.writeFileSync(filePath, `${header}${this.content.join("\n")}`);
    }
}
