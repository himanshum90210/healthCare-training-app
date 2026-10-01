export const cleanParams = (params: object): Record<string, unknown> =>
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined));