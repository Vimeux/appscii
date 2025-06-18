export function imageToAscii(
  imageData: ImageData,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const asciiChars = "@%#*+=-:. ";
  const targetWidth = 120; // Higher resolution for more detail
  const aspectRatio = imageData.width / imageData.height;
  const targetHeight = Math.floor(targetWidth / aspectRatio);

  const blockWidth = Math.floor(imageData.width / targetWidth);
  const blockHeight = Math.floor(imageData.height / targetHeight);

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);

  const charWidth = width / targetWidth;
  const charHeight = height / targetHeight;
  const fontSize = charWidth / 0.6;

  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.imageSmoothingEnabled = false;

  // Helper to get color at (x, y)
  function getPixelColor(x: number, y: number) {
    const px = (y * imageData.width + x) * 4;
    return [imageData.data[px], imageData.data[px + 1], imageData.data[px + 2]];
  }

  // --- Flood fill from corners to detect background mask ---
  const mask = Array.from({ length: imageData.height }, () => Array(imageData.width).fill(false));
  const visited = Array.from({ length: imageData.height }, () => Array(imageData.width).fill(false));
  const queue: [number, number][] = [];

  // Get average color of all corners
  const corners = [
    getPixelColor(0, 0),
    getPixelColor(imageData.width - 1, 0),
    getPixelColor(0, imageData.height - 1),
    getPixelColor(imageData.width - 1, imageData.height - 1)
  ];
  const bgR = Math.round(corners.reduce((sum, c) => sum + c[0], 0) / 4);
  const bgG = Math.round(corners.reduce((sum, c) => sum + c[1], 0) / 4);
  const bgB = Math.round(corners.reduce((sum, c) => sum + c[2], 0) / 4);

  // Helper to compute color distance
  function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) {
    return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
  }

  // Adaptive threshold: estimate stddev of border pixels
  let borderColors: number[][] = [];
  const borderSize = 10;
  for (let x = 0; x < imageData.width; x++) {
    for (let y = 0; y < borderSize; y++) borderColors.push(getPixelColor(x, y));
    for (let y = imageData.height - borderSize; y < imageData.height; y++) borderColors.push(getPixelColor(x, y));
  }
  for (let y = 0; y < imageData.height; y++) {
    for (let x = 0; x < borderSize; x++) borderColors.push(getPixelColor(x, y));
    for (let x = imageData.width - borderSize; x < imageData.width; x++) borderColors.push(getPixelColor(x, y));
  }
  const mean = [0, 0, 0];
  borderColors.forEach(c => { mean[0] += c[0]; mean[1] += c[1]; mean[2] += c[2]; });
  mean[0] /= borderColors.length; mean[1] /= borderColors.length; mean[2] /= borderColors.length;
  let variance = 0;
  borderColors.forEach(c => { variance += colorDistance(c[0], c[1], c[2], mean[0], mean[1], mean[2]) ** 2; });
  variance /= borderColors.length;
  const adaptiveThreshold = Math.max(30, Math.sqrt(variance) * 2.5); // Adaptive, but not too low

  // Flood fill from all corners
  [[0,0],[imageData.width-1,0],[0,imageData.height-1],[imageData.width-1,imageData.height-1]].forEach(([sx,sy]) => {
    queue.push([sx, sy]);
    visited[sy][sx] = true;
  });
  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    mask[y][x] = true;
    const [r, g, b] = getPixelColor(x, y);
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < imageData.width && ny >= 0 && ny < imageData.height && !visited[ny][nx]) {
        const [nr, ng, nb] = getPixelColor(nx, ny);
        if (colorDistance(r, g, b, nr, ng, nb) < adaptiveThreshold && colorDistance(bgR, bgG, bgB, nr, ng, nb) < adaptiveThreshold) {
          queue.push([nx, ny]);
          visited[ny][nx] = true;
        }
      }
    }
  }

  // --- Render ASCII art with color, masking background ---
  for (let row = 0; row < targetHeight; row++) {
    for (let col = 0; col < targetWidth; col++) {
      let r = 0, g = 0, b = 0, count = 0, bgCount = 0;
      for (let y = 0; y < blockHeight; y++) {
        for (let x = 0; x < blockWidth; x++) {
          const px = ((row * blockHeight + y) * imageData.width + (col * blockWidth + x));
          const pxX = col * blockWidth + x;
          const pxY = row * blockHeight + y;
          if (pxX < imageData.width && pxY < imageData.height) {
            if (mask[pxY][pxX]) {
              bgCount++;
              continue;
            }
            const idx = px * 4;
            r += imageData.data[idx];
            g += imageData.data[idx + 1];
            b += imageData.data[idx + 2];
            count++;
          }
        }
      }
      if (count === 0) continue; // All background
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);

      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const char = asciiChars[Math.floor(brightness * (asciiChars.length - 1))];

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      const xPos = col * charWidth;
      const yPos = row * charHeight;
      ctx.fillText(char, xPos + charWidth / 2, yPos + charHeight / 2);
    }
  }
}
