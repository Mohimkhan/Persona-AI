/**
 * Generates a stable, privacy-preserving device hash based on hardware / canvas attributes.
 * Survives full deletion of cookies and localStorage in the same browser session.
 * Naturally differs in private/incognito tabs and across different browsers.
 */
export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === "undefined") return "server";

  const components: string[] = [];

  // 1. Screen resolution & color depth
  components.push(
    `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
  );
  components.push(`${window.screen.availWidth}x${window.screen.availHeight}`);
  components.push(`pixelRatio:${window.devicePixelRatio || 1}`);

  // 2. Navigator properties
  components.push(`cores:${navigator.hardwareConcurrency || 1}`);
  components.push(`tz:${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  components.push(`lang:${navigator.language}`);
  components.push(`platform:${navigator.platform || ""}`);

  // 3. Canvas 2D Hash
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("PersonaAI.Device.Fingerprint", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("PersonaAI.Device.Fingerprint", 4, 17);
      components.push(`canvas:${canvas.toDataURL()}`);
    }
  } catch {
    // Canvas blocked/failed
  }

  // 4. WebGL GPU Renderer Hash
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        components.push(`gpu:${vendor}~${renderer}`);
      }
    }
  } catch {
    // WebGL blocked/failed
  }

  // 5. Hash string with SHA-256 via SubtleCrypto
  try {
    const rawString = components.join("###");
    const encoder = new TextEncoder();
    const data = encoder.encode(rawString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    // Fallback simple hash if subtle crypto fails
    return "client_fallback_" + Math.random().toString(36).substring(2, 9);
  }
}
