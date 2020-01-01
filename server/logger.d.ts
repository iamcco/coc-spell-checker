import { IConnection } from 'vscode-languageserver';
export declare enum LogLevel {
    NONE = 0,
    ERROR = 1,
    WARNING = 2,
    INFO = 3,
    DEBUG = 4
}
export interface LogEntry {
    seq: number;
    level: LogLevel;
    ts: Date;
    msg: string;
}
export declare class Logger {
    private logLevel;
    private connection?;
    private seq;
    private logs;
    private loggers;
    constructor(logLevel?: LogLevel, connection?: IConnection | undefined);
    private writeLog;
    logMessage(level: LogLevel, msg: string): void;
    set level(level: LogLevel | string);
    get level(): LogLevel | string;
    setConnection(connection: IConnection): void;
    error(msg: string): void;
    warn(msg: string): void;
    info(msg: string): void;
    debug(msg: string): void;
    log(msg: string): void;
    getPendingEntries(): LogEntry[];
}
