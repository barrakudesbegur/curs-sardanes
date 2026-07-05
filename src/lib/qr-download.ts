import { qrSvg } from './qr';

// Browser-only helpers: trigger a file download of a link's QR code as SVG or
// PNG. Called from click handlers, so they only ever run client-side.

function triggerDownload(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export function downloadQrSvg(text: string, filename: string): void {
	triggerDownload(new Blob([qrSvg(text)], { type: 'image/svg+xml' }), `${filename}.svg`);
}

/** Rasterise the QR SVG to a PNG at `size`×`size` px via an offscreen canvas. */
export async function downloadQrPng(text: string, filename: string, size = 512): Promise<void> {
	const svg = qrSvg(text);
	const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
	const img = new Image();
	img.width = size;
	img.height = size;
	await new Promise<void>((resolve, reject) => {
		img.onload = () => resolve();
		img.onerror = () => reject(new Error('QR image failed to load'));
		img.src = svgUrl;
	});
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('canvas 2d context unavailable');
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, size, size);
	ctx.drawImage(img, 0, 0, size, size);
	const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
	if (blob) triggerDownload(blob, `${filename}.png`);
}
