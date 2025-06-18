'use client';

import { useEffect, useRef, useState } from "react";
import { imageToAscii } from "@/utils/imageToAscii";
import { Box, Button, Card, Tooltip } from "@radix-ui/themes";
import { Vibrant } from "node-vibrant/browser";
import { PlusIcon, TrashIcon, DownloadIcon } from "@radix-ui/react-icons";

export default function AsciiConverter() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    const fileUploadElement = document.getElementById('file-upload');

    if (fileUploadElement instanceof HTMLInputElement) {
      fileUploadElement.click();
    } else {
      console.error("L'élément avec l'ID 'file-upload' n'existe pas ou n'est pas un input.");
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const link = document.createElement('a');
    link.download = `ascii-art-${fileName || 'download'}.jpg`;
    link.href = dataUrl;
    link.click();
  };

  useEffect(() => {
    if (!imageSrc || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();
    image.src = imageSrc;
    image.onload = async () => {
      const vibrant = new Vibrant(image);
      const palette = await vibrant.getPalette();
      // const dominantColor = palette.Vibrant?.hex || '#000000';

      const maxWidth = 2000;
      const maxHeight = 2000;
      const aspectRatio = image.width / image.height;
      const width = aspectRatio > 1 ? maxWidth : maxHeight * aspectRatio;
      const height = aspectRatio > 1 ? maxWidth / aspectRatio : maxHeight;

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(image, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      imageToAscii(imageData, ctx, width, height);
    };
  }, [imageSrc]);

  return (
    <div className="flex flex-row items-center gap-4 p-4 justify-center">
      <Box width="350px" height="350px">
        <Card className="w-full h-full flex items-center justify-center relative">
          {imageSrc ? (
            <>
              <img src={imageSrc} alt="Preview" className="w-full h-full object-cover rounded" style={{ borderRadius: '5px' }} />
              <Tooltip content="Nouvelle image">
                <Button 
                  color="gray"
                  onClick={handleClick}
                  className="!absolute !top-0 !right-0 !m-4"
                >
                  <PlusIcon />
                </Button>
              </Tooltip>
            </>
          ) : (
            <label htmlFor="file-upload" className="cursor-pointer text-gray-500 flex items-center justify-center w-full h-full">
              Choisir une image
            </label>
          )}
          <input 
            id="file-upload"
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            className="hidden"
          />
        </Card>
      </Box>
      <Box width="350px" height="350px">
        <Card className="w-full h-full flex items-center justify-center relative">
          <canvas 
            ref={canvasRef}
            width={2000}
            height={2000}
            style={{ maxWidth: '100%', height: 'auto', borderRadius: '5px' }}
          />
          {imageSrc && (
            <Tooltip content="Télécharger en JPEG">
              <Button 
                color="gray"
                onClick={handleDownload}
                className="!absolute !top-0 !right-0 !m-4"
              >
                <DownloadIcon />
              </Button>
            </Tooltip>
          )}
        </Card>
      </Box>
    </div>
  );
}
