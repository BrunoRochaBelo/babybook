/**
 * Tests for Storage utilities
 */
import { describe, it, expect } from "vitest";
import { getContentType } from "../src/lib/storage";

describe("getContentType", () => {
  it("returns correct MIME type for images", () => {
    expect(getContentType("photo.jpg")).toBe("image/jpeg");
    expect(getContentType("photo.jpeg")).toBe("image/jpeg");
    expect(getContentType("image.png")).toBe("image/png");
    expect(getContentType("image.gif")).toBe("image/gif");
    expect(getContentType("image.webp")).toBe("image/webp");
    expect(getContentType("image.avif")).toBe("image/avif");
    expect(getContentType("icon.svg")).toBe("image/svg+xml");
  });

  it("returns correct MIME type for videos", () => {
    expect(getContentType("video.mp4")).toBe("video/mp4");
    expect(getContentType("video.webm")).toBe("video/webm");
    expect(getContentType("video.mov")).toBe("video/quicktime");
  });

  it("returns correct MIME type for audio", () => {
    expect(getContentType("audio.mp3")).toBe("audio/mpeg");
    expect(getContentType("audio.wav")).toBe("audio/wav");
    expect(getContentType("audio.ogg")).toBe("audio/ogg");
  });

  it("returns correct MIME type for documents", () => {
    expect(getContentType("document.pdf")).toBe("application/pdf");
    expect(getContentType("data.json")).toBe("application/json");
  });

  it("returns octet-stream for unknown extensions", () => {
    expect(getContentType("file.xyz")).toBe("application/octet-stream");
    expect(getContentType("noextension")).toBe("application/octet-stream");
  });

  it("handles uppercase extensions", () => {
    expect(getContentType("photo.JPG")).toBe("image/jpeg");
    expect(getContentType("video.MP4")).toBe("video/mp4");
  });

  it("handles paths with directories", () => {
    expect(getContentType("u/user-123/m/moment-456/photo.jpg")).toBe(
      "image/jpeg",
    );
    expect(getContentType("partners/partner-id/delivery-id/video.mp4")).toBe(
      "video/mp4",
    );
  });
});
