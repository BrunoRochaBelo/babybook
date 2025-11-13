import { nanoid } from "nanoid";
import { UploadItem } from "./types";
import { uploadPersister } from "./persister";

type QueueListener = (items: UploadItem[]) => void;

class UploadQueue {
  #items: UploadItem[] = [];
  #listeners: Set<QueueListener> = new Set();
  #concurrency = 3;
  #active = 0;

  async enqueue(file: File, kind: UploadItem["kind"]) {
    const item: UploadItem = {
      id: nanoid(),
      kind,
      file,
      status: "queued",
      progress: 0
    };

    this.#items.push(item);
    await uploadPersister.save(this.#items);
    this.#notify();
    this.#pump();
  }

  onChange(listener: QueueListener) {
    this.#listeners.add(listener);
    listener(this.#items);
    return () => this.#listeners.delete(listener);
  }

  async restore() {
    this.#items = await uploadPersister.restore();
    this.#notify();
    this.#pump();
  }

  #notify() {
    for (const listener of this.#listeners) {
      listener(this.#items);
    }
  }

  async #pump() {
    if (this.#active >= this.#concurrency) {
      return;
    }

    const next = this.#items.find((item) => item.status === "queued");
    if (!next) {
      return;
    }

    this.#active += 1;
    try {
      next.status = "uploading";
      this.#notify();
      await this.#upload(next);
      next.status = "done";
      next.progress = 1;
    } catch (error) {
      next.status = "failed";
      next.errorCode = error instanceof Error ? error.message : "upload.failed";
    } finally {
      this.#active -= 1;
      await uploadPersister.save(this.#items);
      this.#notify();
      this.#pump();
    }
  }

  async #upload(item: UploadItem) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    item.progress = 1;
  }
}

export const uploadQueue = new UploadQueue();
