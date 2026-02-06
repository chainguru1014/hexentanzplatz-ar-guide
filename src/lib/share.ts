export async function shareImageBlob(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type || "image/png" });

  const navAny = navigator as any;
  const canShareFiles = typeof navAny.canShare === "function" && navAny.canShare({ files: [file] });

  if (navigator.share && canShareFiles) {
    await navigator.share({
      files: [file],
      title: "Hexentanzplatz",
      text: "Mein AR-Snapshot vom Hexentanzplatz"
    });
    return;
  }

  // Fallback: open in new tab
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
}
