export interface Tool {
    name: string;
    description: string;
    inputSchema: any;
    outputSchema?: any;
    execute: (args: any, extra?: any) => Promise<any>;
}
