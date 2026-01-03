export async function enableMockServiceWorker() {
  if (import.meta.env.DEV || import.meta.env.MODE === "test") {
    const { worker } = await import("./browser");
    return worker.start({
      onUnhandledRequest: "bypass",
    });
  }
}
