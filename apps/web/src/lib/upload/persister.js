const STORAGE_KEY = "bb.upload.queue";
async function restore() {
    if (typeof window === "undefined") {
        return [];
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        return [];
    }
    try {
        const parsed = JSON.parse(raw);
        return parsed.map((item) => ({
            ...item,
            file: new File([], item.file.name, { type: item.file.type })
        }));
    }
    catch {
        return [];
    }
}
async function save(items) {
    if (typeof window === "undefined") {
        return;
    }
    const serializable = items.map(({ file, ...rest }) => ({
        ...rest,
        file: { name: file.name, type: file.type, size: file.size }
    }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}
export const uploadPersister = {
    restore,
    save
};
