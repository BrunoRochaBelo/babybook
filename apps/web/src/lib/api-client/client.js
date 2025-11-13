const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
async function request(path, options) {
    const response = await fetch(new URL(path, baseUrl).toString(), {
        method: options.method ?? "GET",
        body: options.body ? JSON.stringify(options.body) : undefined,
        headers: {
            "Content-Type": "application/json",
            "X-BB-Trace": options.traceName ?? "ui.unknown"
        },
        signal: options.signal,
        credentials: "include"
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error?.message ?? "Unexpected API error");
    }
    return (await response.json());
}
export const apiClient = {
    get: (path, options = {}) => request(path, options),
    post: (path, options = {}) => request(path, { ...options, method: "POST" }),
    patch: (path, options = {}) => request(path, { ...options, method: "PATCH" }),
    delete: (path, options = {}) => request(path, { ...options, method: "DELETE" })
};
