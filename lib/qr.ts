import QRCode from "qrcode";

/** Black-on-white SVG, always, so door scanners can read it whatever the event's colours are. */
export function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });
}
