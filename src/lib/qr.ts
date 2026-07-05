import qrcode from 'qrcode-generator';

/**
 * Renders `text` as a self-contained, scalable QR-code SVG string.
 * Pure and dependency-light (no canvas, no network), safe to call anywhere.
 */
export function qrSvg(text: string): string {
	const qr = qrcode(0, 'M');
	qr.addData(text);
	qr.make();
	return qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
}
