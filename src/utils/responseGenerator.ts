
export const generateErrorResponse = (message: string) => {
    return {
        content: [{ type: "text" as const, text: message }],
        isError: true,
    };
}

export const generateSuccessResponse = (message: string, structuredData?: any) => {
    return {
        content: [{ type: "text" as const, text: message }],
        structuredContent: structuredData
    };
}
