export function imageToAscii(imageData: ImageData, ctx: CanvasRenderingContext2D, width: number, height: number): void {
  // ASCII characters used for rendering
  const asciiChars = "@#S%?*+;:,. ";
  
  // Function to map brightness to an ASCII character
  const getAsciiChar = (brightness: number) => {
    const index = Math.floor(brightness * (asciiChars.length - 1));
    return asciiChars[index];
  };

  // Determine target dimensions for ASCII art
  const targetWidth = 80;
  const aspectRatio = imageData.width / imageData.height;
  const targetHeight = Math.floor(targetWidth / aspectRatio);

  // Calculate block size for sampling image data
  const blockWidth = Math.floor(imageData.width / targetWidth);
  const blockHeight = Math.floor(imageData.height / targetHeight);

  // Array to store ASCII art
  const asciiArt: string[][] = [];

  // Loop through each block to generate ASCII art
  for (let row = 0; row < targetHeight; row++) {
    const asciiRow: string[] = [];
    for (let col = 0; col < targetWidth; col++) {
      const x = Math.floor(col * blockWidth);
      const y = Math.floor(row * blockHeight);
      const pixelIndex = (y * imageData.width + x) * 4;

      // Extract RGB values and calculate brightness
      const r = imageData.data[pixelIndex];
      const g = imageData.data[pixelIndex + 1];
      const b = imageData.data[pixelIndex + 2];
      const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      // Map brightness to an ASCII character
      asciiRow.push(getAsciiChar(brightness));
    }
    asciiArt.push(asciiRow);
  }

  // Clear canvas and set background color
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);

  // Calculate dimensions to fill canvas with ASCII art
  const numRows = asciiArt.length;
  const numCols = asciiArt[0].length;
  
  // Calculate spacing and character dimensions
  const horizontalSpacing = width * 0.3 / numCols;
  const verticalSpacing = height * 0.3 / numRows;
  const charWidth = (width / numCols) - horizontalSpacing;
  const charHeight = (height / numRows) - verticalSpacing;
  const fontSize = charWidth / 0.6;

  // Configure text rendering for crisp vector look
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.fillStyle = "white";
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  
  // Enable crisp rendering
  ctx.imageSmoothingEnabled = false;
  
  // Draw ASCII characters on the canvas
  asciiArt.forEach((row, y) => {
    row.forEach((char, x) => {
      const xPos = x * (charWidth + horizontalSpacing);
      const yPos = y * (charHeight + verticalSpacing);
      
      // Draw character
      ctx.fillStyle = "white";
      ctx.fillText(
        char, 
        xPos + (charWidth + horizontalSpacing * 0.8) / 2, 
        yPos + (charHeight + verticalSpacing * 0.8) / 2
      );
    });
  });
}
