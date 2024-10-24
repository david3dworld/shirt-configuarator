import { CANVAS_SIZE, MOVING_OBJECT, OBJECT_TYPE } from "@/constants/constants";
import { ICustomFabricObject } from "@/hooks/useObjectControls";
import axios from 'axios';
import { Buffer } from 'buffer';
import { fabric } from 'fabric';
import { Vector2 } from "three";
import { v4 as uuidv4 } from 'uuid';

export interface BoundingRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function rectRandomFabricPosition(rect: BoundingRect) {
  const { left: leftRect, top: topRect, width, height } = rect

  const left = numberRandom(leftRect, leftRect + width);
  const top = numberRandom(topRect, topRect + height);

  return {
    left,
    top
  }
}

export function sizeRandomFabricPosition(size: { width: number, height: number }) {
  const rect: BoundingRect = {
    left: 0,
    top: 0,
    width: size.width,
    height: size.height
  }

  return rectRandomFabricPosition(rect);
}

export function createNewText(value: string, option = {}) {
  const text = new fabric.IText(value, {
    left: 200,
    top: 200,
    fontSize: 40,
    fill: 'red',
    hasBorders: false,
    hasControls: false,
    ...option
  });

  text.getBoundingRect

  return text;
}

export function getFabricImage(url: string) {
  return new Promise<any>((resolve) => {
    axios
      .get(url, {
        responseType: 'arraybuffer'
      })
      .then(response => ("data:image/png;base64," + Buffer.from(response.data, 'binary').toString('base64')))
      .then((base64Src) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const fabricImage = new fabric.Image(img, {
            crossOrigin: 'anonymous',
          });
          (fabricImage as any).objectType = OBJECT_TYPE.IMAGE;
          (fabricImage as any).objectId = uuidv4()
          resolve(fabricImage as any)
        }
        img.src = base64Src
      })
      .catch(() => {
        resolve(null)
      })
  })
}

export function numberRandom(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function uvToVec2(uvPoint: Vector2, canvasSize: number = CANVAS_SIZE) {
  return new Vector2(uvPoint.x, uvPoint.y).multiplyScalar(canvasSize)
}

export function vec2ToPoint(uvPoint: Vector2) {
  return new fabric.Point(uvPoint.x, uvPoint.y)
}

export function getControlAtPoint(canvas: fabric.Canvas, point: fabric.Point) {
  const objects = canvas.getObjects();
  const object = objects.find((obj) => {
    const offsetX = obj.originX === 'center' ? - ((obj.width || 1) * (obj.scaleX || 1)/2): 0;
    const offsetY = obj.originY === 'center' ? - ((obj.height || 1) * (obj.scaleY || 1)/2): 0;

    return new fabric.Rect({
      width: (obj.width || 1) * (obj.scaleX || 1),
      height: (obj.height || 1) * (obj.scaleY || 1),
      left: (obj.left || 0) + offsetX,
      top: (obj.top || 0) + offsetY
    }).containsPoint(point) && (obj as ICustomFabricObject).objectType === OBJECT_TYPE.CONTROL && obj.visible;
  })
  return object;
}

export function getObjectAtPoint(canvas: fabric.Canvas, point: fabric.Point) {
  const objects = canvas.getObjects();
  const object = objects.find((obj) => {
    const { left, top, width, height } = obj.getBoundingRect(true, true)

    return new fabric.Rect({
      left, top, width, height
    }).containsPoint(point) && MOVING_OBJECT.includes((obj as ICustomFabricObject).objectType)
  })
  return object;
}

export function getObjectByObjectId(canvas: fabric.Canvas, objectId: string) {
  const objects = canvas.getObjects();
  const object = objects.find((obj) => {
    return (obj as ICustomFabricObject).objectId === objectId;
  })
  return object;
}

export function moveObjectWithOffset(obj: ICustomFabricObject, offset: fabric.Point) {
  if(!obj) {
    return;
  }

  const left = (obj.left || 0) + offset.x;
  const top = (obj.top || 0) + offset.y;

  obj.set({
    left: left,
    top: top
  })
}

export async function createNewImage(src: string, option = {}) {
  const image = await getFabricImage(src);
  image.set({
    ...option
  })
  return image;
}