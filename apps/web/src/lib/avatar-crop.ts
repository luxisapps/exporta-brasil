import type { Area } from "react-easy-crop";

const createImage = (source: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.addEventListener("load", () => resolve(image));
  image.addEventListener("error", reject);
  image.src = source;
});

const radians = (degrees: number) => (degrees * Math.PI) / 180;
const rotatedSize = (width: number, height: number, degrees: number) => {
  const angle = radians(degrees);
  return { width: Math.abs(Math.cos(angle) * width) + Math.abs(Math.sin(angle) * height), height: Math.abs(Math.sin(angle) * width) + Math.abs(Math.cos(angle) * height) };
};

export async function cropAvatar(source: string, area: Area, rotation: number) {
  const image = await createImage(source);
  const bounds = rotatedSize(image.width, image.height, rotation);
  const canvas = document.createElement("canvas");
  canvas.width = bounds.width;
  canvas.height = bounds.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível preparar a imagem.");
  context.translate(bounds.width / 2, bounds.height / 2);
  context.rotate(radians(rotation));
  context.translate(-image.width / 2, -image.height / 2);
  context.drawImage(image, 0, 0);
  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = area.width;
  croppedCanvas.height = area.height;
  const croppedContext = croppedCanvas.getContext("2d");
  if (!croppedContext) throw new Error("Não foi possível preparar o corte da imagem.");
  croppedContext.drawImage(canvas, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
  const outputSize = Math.min(1024, Math.max(area.width, area.height));
  canvas.width = outputSize;
  canvas.height = outputSize;
  context.drawImage(croppedCanvas, 0, 0, outputSize, outputSize);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("Não foi possível gerar a imagem.");
  return new File([blob], "foto-de-perfil.jpg", { type: "image/jpeg" });
}
