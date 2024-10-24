/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { fabric } from 'fabric';
// import { ICustomFabricObject } from "./useDecalHandler";
import { v4 as uuidv4 } from 'uuid'
import { getFabricImage } from "@/lib/fabric.utils";
import { OBJECT_TYPE } from "@/constants/constants";

interface IControl {
  url: string | null;
  size: number;
  isCircle: boolean;
  color: string;
  moving?: (a: any) => void;
  click?: (a: any) => void;
}

interface IControls {
  tl?: IControl;
  tr?: IControl;
  tc?: IControl;
  bl?: IControl;
  br?: IControl;
}

export interface ICustomFabricObject extends fabric.Object {
  objectType: string,
  objectId: string,
  isLock?: boolean
}

export interface ICustomFabricObjectControl extends ICustomFabricObject {
  moving: (a: any) => void;
  click?: (a: any) => void;
  onRefresh: () => void;
  pointerDown?: boolean;
  pointerMove?: boolean;
}

export const useObjectControl = (control: IControls) => {

  const [tl, setTl] = useState<ICustomFabricObjectControl>()
  const [tr, setTr] = useState<ICustomFabricObjectControl>()
  const [tc, setTc] = useState<ICustomFabricObjectControl>()
  const [bl, setBl] = useState<ICustomFabricObjectControl>()
  const [br, setBr] = useState<ICustomFabricObjectControl>()

  const [boundingRect, setBoundingRect] = useState<ICustomFabricObject>()

  const onRefresh = useCallback(() => {
    if(tl) {
      tl.set({
        visible: false
      })
      if(tl.canvas) {
        tl.canvas.remove(tl)
        tl.canvas.renderAll();
      }
    }

    if(tr) {
      tr.set({
        visible: false
      })

      if(tr.canvas) {
        tr.canvas.remove(tr)
        tr.canvas.renderAll();
      }
    }

    if(tc) {
      tc.set({
        visible: false
      })

      if(tc.canvas) {
        tc.canvas.remove(tc)
        tc.canvas.renderAll();
      }
    }

    if(bl) {
      bl.set({
        visible: false
      })

      if(bl.canvas) {
        bl.canvas.remove(bl)
        bl.canvas.renderAll();
      }
    }

    if(br) {
      br.set({
        visible: false
      })

      if(br.canvas) {
        br.canvas.remove(br);
        br.canvas.renderAll();
      }
    }

    if(boundingRect) {
      boundingRect.set({
        visible: false
      })

      if(boundingRect.canvas) {
        boundingRect.canvas.remove(boundingRect);
        boundingRect.canvas.renderAll();
      }
    }
  }, [ tl, tr, tc, bl, br, boundingRect])

  const onActiveObject = useCallback((object: fabric.Object | null) => {
      if(!object) {
        if(tl) {
          tl.set({
            visible: false
          })

          if(tl.canvas) {
            tl.canvas.remove(tl);
          }
        }
    
        if(tr) {
          tr.set({
            visible: false
          })
          if(tr.canvas) {
            tr.canvas.remove(tr);
          }
        }
    
        if(tc) {
          tc.set({
            visible: false
          })
          if(tc.canvas) {
            tc.canvas.remove(tc);
          }
        }
    
        if(bl) {
          bl.set({
            visible: false
          })
          if(bl.canvas) {
            bl.canvas.remove(bl);
          }
        }
    
        if(br) {
          br.set({
            visible: false
          })
          if(br.canvas) {
            br.canvas.remove(br);
          }
        }
  
        if(boundingRect) {
          boundingRect.set({
            visible: false
          })
          if(boundingRect.canvas) {
            boundingRect.canvas.remove(boundingRect);
          }
        }
  
        return;
      }

    const { width, height, left, top } = object.getBoundingRect(true, true)

    if(tl) {
      const { width: ctrlWidth, height: ctrlHeight } = tl.getBoundingRect(true, true)
      tl.set({
        visible: true,
        left: left - ctrlWidth,
        top: top - ctrlHeight,
      })
    }

    if(tr) {
      const { height: ctrlHeight } = tr.getBoundingRect(true, true)
      tr.set({
        visible: true,
        left: left + width,
        top: top - ctrlHeight,
      })
    }

    if(tc) {
      const { width: ctrlWidth, height: ctrlHeight } = tc.getBoundingRect(true, true)
      tc.set({
        visible: true,
        left: left + width/2 - ctrlWidth/2,
        top: top - ctrlHeight,
      })
    }

    if(bl) {
      const { width: ctrlWidth } = bl.getBoundingRect(true, true)
      bl.set({
        visible: true,
        left: left - ctrlWidth,
        top: top + height,
      })
    }

    if(br) {
      br.set({
        visible: true,
        left: left + width,
        top: top + height,
      })
    }

  }, [
    tl,
    tr,
    tc,
    bl,
    br,
    boundingRect
  ])

  const getObjectControls = useCallback(async (info: IControl) => {

    if(info.url) {

      const image = await getFabricImage(info.url)

      if(image) {
        (image as fabric.Image).set({
          scaleX: info.size / (image.width || 1),
          scaleY: info.size / (image.height || 1),
        });
        (image as ICustomFabricObjectControl).objectId = uuidv4();
        (image as ICustomFabricObjectControl).objectType = OBJECT_TYPE.CONTROL;
        (image as ICustomFabricObjectControl).moving = (a: any) => {
          if(info.moving) {
            info.moving(a)
          }
        };

        (image as ICustomFabricObjectControl).click = (a: any) => {
          if(info.click) {
            info.click(a)
          }
        };
    
        (image as ICustomFabricObjectControl).onRefresh = () => {
          onRefresh()
        };

        return (image as ICustomFabricObjectControl);
      }
    }
    const object = new fabric.Rect({
      width: info.size,
      height: info.size,
      fill: info.color,
      hasBorders: false,
      clipPath: new fabric.Circle({
        radius: info.size/2,
        left: -info.size/2,
        top: -info.size/2,
        stroke: "rgba(0, 0, 0, 0)",
        strokeWidth: 0,
      })
    });
    (object as any).objectId = uuidv4();
    (object as any).objectType = OBJECT_TYPE.CONTROL;
    (object as any).moving = (a: any) => {
      if(info.moving) {
        info.moving(a)
      }
    };

    (object as any).click = (a: any) => {
      if(info.click) {
        info.click(a)
      }
    };

    (object as any).onRefresh = () => {
      onRefresh()
    };

    return (object as any);
  }, [onRefresh])

  useEffect(() => {
    if(!control) {
      return;
    }

    if(control.tl && !tl) {
      getObjectControls(control.tl).then((object: any) => {
        setTl(object)
      })
    }

    if(control.tr && !tr) {
      getObjectControls(control.tr).then((object: any) => {
        setTr(object)
      })
    }

    if(control.tc && !tc) {
      getObjectControls(control.tc).then((object: any) => {
        setTc(object)
      })
    }

    if(control.bl && !bl) {
      getObjectControls(control.bl).then((object: any) => {
        setBl(object)
      })
    }

    if(control.br && !br) {
      getObjectControls(control.br).then((object: any) => {
        setBr(object)
      })
    }

    if(!boundingRect) {
      const rect = new fabric.Rect({
        hasBorders: false,
      });
      (rect as any).objectId = uuidv4();
      setBoundingRect((rect as any))
    }

  }, [bl, boundingRect, br, control, tc, tl, tr])

  return {
    tlControl: tl,
    trControl: tr,
    tcControl: tc,
    blControl: bl,
    brControl: br,
    boundingRect,
    onActiveObject: onActiveObject
  }
}