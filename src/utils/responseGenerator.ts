
export const generateErrorResponse = (message: string) => {
    return {
        content: [{ type: "text" as const, text: message }],
        isError: true,
    };
}

export const generateSuccessResponse = (message: string) => {
    return {
        content: [{ type: "text" as const, text: message }],
    };
}
