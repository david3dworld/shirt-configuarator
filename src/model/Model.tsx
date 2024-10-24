import React, { memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { fabric } from 'fabric';
import { OrbitControlsProps, useGLTF } from "@react-three/drei";
import modelGltf from "../assets/3d/tshirt.glb";
import { CanvasTexture, Intersection, LinearFilter, MathUtils, Mesh, Object3D, Object3DEventMap, Raycaster, RepeatWrapping, Vector2, Vector3 } from 'three';
import { ICustomFabricObject, ICustomFabricObjectControl, useObjectControl } from '@/hooks/useObjectControls';
import { v4 as uuidv4 } from 'uuid'
import { createNewImage, createNewText, getControlAtPoint, getObjectAtPoint, getObjectByObjectId, moveObjectWithOffset, numberRandom, sizeRandomFabricPosition, uvToVec2, vec2ToPoint } from '@/lib/fabric.utils';
import { ICONS_CONTROL_SRC, OBJECT_TYPE } from '@/constants/constants';
import { useThree } from '@react-three/fiber';

export interface ICustomFabricCanvas extends fabric.Canvas {
  allowRect: fabric.Rect;
}

interface ISelectedObject {
  canvas: fabric.Canvas | null,
  objectId: string | null,
  oldPosition: fabric.Point | null,
  currentObjectName: string | null,
}

interface IModelProps {

}

export interface IModelRefProps {
  onAddText: (text: string) => void,
  onAddImage: (src: string) => void
}

const Model = React.forwardRef(function ({ }: IModelProps, ref) {
  const { nodes } = useGLTF(modelGltf) as any;
  const textureRef = useRef<CanvasTexture>(null);
  const { gl, controls, scene, raycaster } = useThree()
  const selectedControl = useRef<ICustomFabricObjectControl>()

  const selectedObject = useRef<ISelectedObject>({
    canvas: null,
    objectId: null,
    oldPosition: null,
    currentObjectName: null
  })


  const fabricCanvas = useMemo(() => {
    return new fabric.Canvas('design-canvas', {
      width: 600,
      height: 600,
      backgroundColor: '#fff',
      imageSmoothingEnabled: true
    })
  }, [])

  const bvhRaycaster: Raycaster = useMemo(() => {
    raycaster.firstHitOnly = true;
    return raycaster;
  }, [raycaster])

  function onRenderCanvas() {
    if (textureRef.current) {
      textureRef.current.needsUpdate = true;
    }
  }

  const onRotateObject = useCallback(({object, control, offset}: 
    {object: ICustomFabricObject,
      control: ICustomFabricObjectControl,
      offset: fabric.Point
    }) => {

    if(object.isLock) {
      return;
    }

    const pivotPoint = object.translateToOriginPoint(object.getCenterPoint(), 'center', 'center');
    const { width, height } = object.getBoundingRect(true, true)
    pivotPoint.add(
      new fabric.Point(width/2, height/2)
    )

    const oldPivotPoint = control.translateToOriginPoint(control.getCenterPoint(), 'center', 'center');
    const newPivotPoint = oldPivotPoint.clone().add(offset.multiply(1.8));

    const oldV = new Vector3(oldPivotPoint.x - pivotPoint.x, oldPivotPoint.y - pivotPoint.y, 0).normalize()
    const newV = new Vector3(newPivotPoint.x - pivotPoint.x, newPivotPoint.y - pivotPoint.y, 0).normalize()

    const cross = new Vector3().crossVectors(oldV, newV).normalize().dot(new Vector3(0,0,1))
    
    const offsetAngle = oldV.angleTo(newV) * (cross > 0 ? 1 : -1);
    let angle = (object.angle ? object.angle : 0) + MathUtils.radToDeg(offsetAngle);

    if (angle < 0) {
      angle = 360 + angle;
    }
    angle %= 360;

    object.set({
      angle: angle,
    })
  }, [])

  const onResizeObject = useCallback(({object, offset}: 
    {object: ICustomFabricObject,
      offset: fabric.Point
    }) => {

    if(object.isLock) {
      return;
    }

    const pivotPoint = object.translateToOriginPoint(object.getCenterPoint(), 'center', 'center');
    const { width, height } = object.getBoundingRect(true, true)
    pivotPoint.add(
      new fabric.Point(width/2, height/2)
    )

    if(Math.abs(offset.x) > Math.abs(offset.y)) {
      const offsetScale = offset.x / width / 18;
      const scaleX = (object.scaleX || 1) + offsetScale;
      const scaleY = (object.scaleY || 1) + offsetScale;
      object.set({
        scaleX,
        scaleY
      })

    }
    else {
      const offsetScale = offset.y / height / 18;
      const scaleX = (object.scaleX || 1) + offsetScale;
      const scaleY = (object.scaleY || 1) + offsetScale;
      object.set({
        scaleX,
        scaleY
      })
    }

    object.canvas?.renderAll()
  }, [])

  // const onLockObject = useCallback(({object, control}: 
  //   {object: ICustomFabricObject,
  //     control: ICustomFabricObjectControl
  //   }) => {

  //     if(!object || !control) {
  //       return
  //     }

  //     object.isLock = !object.isLock;

  //     if(control.setSrc) {
  //       control.setSrc(object.isLock ? ICONS_CONTROL_SRC.LOCK: ICONS_CONTROL_SRC.UNLOCK, () => {
  //         control.canvas?.renderAll()
  //       })
  //     }
  // }, [])

  const onDeleteObject = useCallback(({object, control, onRefresh}: 
    {
      object: ICustomFabricObject,
      control: ICustomFabricObjectControl,
      onRefresh: () => void
    }) => {

      if(!object || !control || object.isLock) {
        return
      }

      const canvas = object.canvas;
      if(canvas) {
        canvas.remove(object);
        canvas.renderAll()
      }

      onRefresh()
  }, [])

  const onGetIntersectObjectByName = useCallback((name: string) => {

    const meshes = [];
    const obj = scene.getObjectByName(name)
    if(obj) {
      meshes.push(obj)
    }

    if(!bvhRaycaster || !meshes || !obj) {
      return null;
    }

    const intersect = bvhRaycaster.intersectObjects(meshes);
    if(!intersect.length) {
      return null;
    }

    return intersect[0];
  }, [bvhRaycaster, scene])

  const onRepeatObject = useCallback(({object, control}: 
    {object: ICustomFabricObject,
      control: ICustomFabricObjectControl
    }) => {

      if(!object || !control || !object.canvas) {
        return
      }
      const canvas = object.canvas;

      const allowRect = (object.canvas as ICustomFabricCanvas).allowRect;

      for(let i = 0; i < 5; i++) {
        const dupObject = fabric.util.object.clone(object);
        (dupObject as ICustomFabricObject).objectId = uuidv4();

        if(allowRect) {
          const { left: leftRect, top: topRect, width, height } = allowRect.getBoundingRect(true, true)

          const left = numberRandom(leftRect, leftRect + width);
          const top = numberRandom(topRect, topRect + height);

          dupObject.set({
            left,
            top
          })
        }

        canvas.add(dupObject);
      }
      canvas.renderAll();
  }, [])  

  const onDuplicateObject = useCallback(({object, control}: 
    {object: ICustomFabricObject,
      control: ICustomFabricObjectControl
    }) => {

      if(!object || !control || !object.canvas) {
        return
      }

      const dupObject = fabric.util.object.clone(object);
      (dupObject as ICustomFabricObject).objectId = uuidv4();
      const canvas = object.canvas;
      canvas.add(dupObject);
      canvas.renderAll();
  }, [])

  const { 
    tlControl,
    trControl,
    tcControl,
    blControl,
    brControl,
    boundingRect,
    onActiveObject
  } = useObjectControl({
    tl: {
      url: ICONS_CONTROL_SRC.DUPLICATE,
      size: 20,
      isCircle: false,
      color: '#fff',
      click: onDuplicateObject
    },
    tr: {
      url: ICONS_CONTROL_SRC.ROTATE,
      size: 20,
      isCircle: false,
      color: '#fff',
      moving: onRotateObject
    },
    bl: {
      url: ICONS_CONTROL_SRC.DELETE,
      size: 20,
      isCircle: false,
      color: '#fff',
      click: onDeleteObject
    },
    br: {
      url: ICONS_CONTROL_SRC.RESIZE,
      size: 20,
      isCircle: false,
      color: '#fff',
      moving: onResizeObject
    }
  })

  const onMovingObject = useCallback((e: any) => {

    if(!e.target) {
      return;
    }

    console.log("e: ", e)
  }, [])

  useEffect(() => {
    if (!fabricCanvas) {
      return
    }
    fabricCanvas.on('object:moving', onMovingObject);
    fabricCanvas.on('after:render', onRenderCanvas);
    setTimeout(() => {
      fabricCanvas.renderAll();
    }, 200);

    return () => {
      if (fabricCanvas) {
        fabricCanvas.off('after:render', onRenderCanvas);
        fabricCanvas.off('object:moving', onMovingObject);
        fabricCanvas.dispose();
      }
    };
  }, []);

  function onAddText(text: string) {
    const randomPos = sizeRandomFabricPosition({
      width: fabricCanvas.getWidth(),
      height: fabricCanvas.getHeight(),
    })
    const textValue = text || 'Your text here';
    const fabricText = createNewText(textValue, {
      ...randomPos,
      editable: false,
      objectType: OBJECT_TYPE.TEXT,
      objectId: uuidv4(),
      originX: 'center',
      originY: 'center',
      centeredRotation: true,
      hasBorders: false,
      hasControls: false,
    });
    fabricCanvas.add(fabricText);
  }

  async function onAddImage(src: string) {
    const randomPos = sizeRandomFabricPosition({
      width: fabricCanvas.getWidth(),
      height: fabricCanvas.getHeight(),
    })
    const image = await createNewImage(src, {
      ...randomPos,
      editable: false,
      hasBorders: false,
      hasControls: false,
      objectType: OBJECT_TYPE.IMAGE,
      objectId: uuidv4(),
      originX: 'center',
      originY: 'center',
      centeredRotation: true
    });
    fabricCanvas.add(image);
  }

  const getMeshOnScene = useCallback(() => {
    const meshes: Mesh[] = [];
    scene.traverse((obj: Object3D) => {
      if (obj instanceof Mesh) {
        meshes.push(obj);
      }
    })
    return meshes;
  }, [scene])

  const onGetIntersectObject = useCallback(() => {

    const meshOnScene = getMeshOnScene()

    if(!bvhRaycaster || !meshOnScene) {
      return null;
    }

    const intersect = bvhRaycaster.intersectObjects(meshOnScene);
    if(!intersect.length) {
      return null;
    }

    return intersect[0];
  }, [bvhRaycaster, getMeshOnScene])

  const onPointerMove = useCallback(() => {
    if (!selectedObject.current.canvas
      || !selectedObject.current.objectId
      || !selectedObject.current.oldPosition
      || !selectedObject.current.currentObjectName
    ) {
      return;
    }
    
    const intersect: Intersection<Object3D<Object3DEventMap>> | null = onGetIntersectObjectByName(selectedObject.current.currentObjectName)

    if (!intersect) {
      return;
    }

    const { object, uv } = intersect;

    if(!uv || !object || !(object as Mesh).name) {
      return
    }

    const pointVec2 = uvToVec2(uv);
    const fabricPoint = vec2ToPoint(pointVec2);

    const offset = new fabric.Point(
      fabricPoint.x - selectedObject.current.oldPosition.x,
      fabricPoint.y - selectedObject.current.oldPosition.y
    )
    const movingObject = getObjectByObjectId(fabricCanvas, selectedObject.current.objectId) as ICustomFabricObject;
    if(selectedControl.current) {
      selectedControl.current.pointerMove = true;
      if(selectedControl.current.moving) {
        selectedControl.current.moving({
          object: movingObject,
          control: selectedControl.current,
          offset
        })
        onActiveObject(movingObject)
        fabricCanvas.renderAll();
      }
      selectedObject.current.oldPosition = fabricPoint;
      onActiveObject(movingObject)
      return;
    }

    if(!movingObject.isLock) {
      moveObjectWithOffset(movingObject, offset);
      selectedObject.current.oldPosition = fabricPoint;
      onActiveObject(movingObject);
      fabricCanvas.renderAll();
    }
  }, [onActiveObject, onGetIntersectObjectByName])

  const onPointerDown = useCallback(() => {
    const intersect: Intersection<Object3D<Object3DEventMap>> | null = onGetIntersectObject()

    if (!intersect) {
      return;
    }

    const { object, uv } = intersect;

    if(!uv || !object || !(object as Mesh).name) {
      return
    }

    // const canvas = textures[name]?.canvas
    const pointVec2 = uvToVec2(uv, fabricCanvas.getWidth())
    const fabricPoint = vec2ToPoint(pointVec2)

    selectedControl.current = getControlAtPoint(fabricCanvas, fabricPoint) as ICustomFabricObjectControl;

    if(selectedControl.current) {
      (controls as OrbitControlsProps).enabled = false;
      selectedObject.current.oldPosition = fabricPoint;
      selectedControl.current.pointerDown = true;
      selectedControl.current.pointerMove = false;
      return;
    }

    const objIns = getObjectAtPoint(fabricCanvas, fabricPoint) as ICustomFabricObject;

    if(!objIns) {
      selectedObject.current = {
        canvas: null,
        objectId: null,
        oldPosition: null,
        currentObjectName: null
      }
      onActiveObject(null)
      return
    }

    selectedObject.current = {
      canvas: fabricCanvas,
      objectId: objIns.objectId,
      oldPosition: fabricPoint,
      currentObjectName: object.name
    };
    (controls as any).enabled = false;
    onActiveObject(null)
    onActiveObject(objIns)

    if(boundingRect) {
      const existControl = getObjectByObjectId(fabricCanvas, boundingRect.objectId)
      if(!existControl) {
        fabricCanvas.add(boundingRect)
      }
    }
    if(tlControl) {
      const existControl = getObjectByObjectId(fabricCanvas, tlControl.objectId)
      if(!existControl) {
        fabricCanvas.add(tlControl)
      }
    }

    if(trControl) {
      const existControl = getObjectByObjectId(fabricCanvas, trControl.objectId)
      if(!existControl) {
        fabricCanvas.add(trControl)
      }
    }

    if(tcControl) {
      const existControl = getObjectByObjectId(fabricCanvas, tcControl.objectId)
      if(!existControl) {
        fabricCanvas.add(tcControl)
      }
    }

    if(blControl) {
      const existControl = getObjectByObjectId(fabricCanvas, blControl.objectId)
      if(!existControl) {
        fabricCanvas.add(blControl)
      }
    }

    if(brControl) {
      const existControl = getObjectByObjectId(fabricCanvas, brControl.objectId)
      if(!existControl) {
        fabricCanvas.add(brControl)
      }
    }
  }, [onGetIntersectObject, controls, onActiveObject, boundingRect, tlControl, trControl, tcControl, blControl, brControl])

  const onPointerUp = useCallback(() => {
    
    (controls as OrbitControlsProps).enabled = true;
    selectedObject.current.oldPosition = null;
    if(selectedControl.current) {
      if(!selectedControl.current.pointerMove
        && selectedObject.current.objectId
        && selectedObject.current.canvas
        && selectedControl.current.click
      ) {
        const object = getObjectByObjectId(selectedObject.current.canvas, selectedObject.current.objectId);
        if(object) {
          selectedControl.current.click({
            object,
            control: selectedControl.current,
            onRefresh: () => {
              onActiveObject(null)
            }
          })
        }
      }
      selectedControl.current.pointerDown = false;
      selectedControl.current.pointerMove = false;
    }

    selectedControl.current = undefined;
  }, [controls, onActiveObject])

  useEffect(() => {
    window.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointermove", onPointerMove)
    return (() => {
      window.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointermove", onPointerMove)
    })
  }, [onPointerDown, onPointerMove, onPointerUp])

  useImperativeHandle<any, IModelRefProps>(ref, () => ({
    onAddText: onAddText,
    onAddImage: onAddImage,
  }))

  return (
    <mesh
      castShadow
      receiveShadow
      name="tshirt"
      geometry={nodes.tshirt.geometry}
      position={[0, 0, 0]}
      dispose={null}
    >
      <meshStandardMaterial attach="material" metalness={0} roughness={0} needsUpdate>
        <canvasTexture
          ref={textureRef}
          needsUpdate
          anisotropy={gl.capabilities.getMaxAnisotropy()}
          attach="map"
          flipY={true}
          center={new Vector2(0.5, 0.5)}
          wrapS={RepeatWrapping}
          repeat={new Vector2(-1, 1)}
          minFilter={LinearFilter}
          magFilter={LinearFilter}
          rotation={Math.PI}
          image={fabricCanvas.getElement()}
        ></canvasTexture>
      </meshStandardMaterial>
    </mesh>
  );
})

export default memo(Model)