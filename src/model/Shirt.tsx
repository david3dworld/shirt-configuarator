import {ChangeEventHandler, Suspense, useRef, useState} from 'react';
import { fabric } from 'fabric';
import {Canvas as ThreeCanvas} from '@react-three/fiber';
import {Center, OrbitControls} from "@react-three/drei";
import {Button} from "@/components/ui/button.tsx";
import Model, { IModelRefProps } from './Model';


export function Shirt() {
    // const {nodes} = useGLTF(modelGltf) as any;

    const [textInput, setTextInput] = useState('Your Text Here');
    const [ isLoadModel, setIsLoadModel ] = useState(false);
    const canvas2dRef = useRef<any>();
    const modelRef = useRef<IModelRefProps>();

    // const [, updateState] = useState<number>(0);

    // const textureRef = useRef() as any;

    // useEffect(() => {
    //     const fabricCanvas = new Canvas('design-canvas', {
    //         width: 600,
    //         height: 600,
    //         backgroundColor: '#ffffff',
    //     });

    //     const text = new FabricText('Your Text Here', {
    //         left: 200,
    //         top: 200,
    //         fontSize: 40,
    //         fill: 'red',
    //     });
    //     fabricCanvas.add(text);
    //     canvas2dRef.current = fabricCanvas;

    //     return () => {
    //         void canvas2dRef.current.dispose();
    //     };
    // }, []);

    const updateText = () => {
        const textObj = canvas2dRef.current.getObjects('text')[0];
        textObj.set({text: textInput});
        canvas2dRef.current.renderAll();
    };

    const handleLogoUpload: ChangeEventHandler<HTMLInputElement> = (e) => {
        if(!modelRef.current || !modelRef.current.onAddImage) {
            return;
        }
        const reader = new FileReader();
        reader.onload = function (e) {

            const src = e.target?.result as string;
            if(src && modelRef.current) {
                modelRef.current.onAddImage(src)
            }
            // const image = new Image();
            // image.src = e.target?.result as string;
            // image.onload = function () {
            //     const img = new fabric.Image(image);
            //     img.set({
            //         left: 100,
            //         top: 60
            //     });
            //     img.scaleToWidth(200);
            //     canvas2dRef.current.add(img);
            // }
        }
        reader.readAsDataURL(e.target.files![0]);
    };

    // // TODO resolve texture loading
    // useEffect(() => {
    //     // setTimeout(() => {
    //     //     textureRef.current.needsUpdate = true;
    //     //     updateState(prev => ++prev);
    //     // }, 10000)

    //     setInterval(() => {
    //         textureRef.current.needsUpdate = true;
    //         updateState(prev => ++prev);
    //     }, 500)

    // }, []);

    const exportCanvas = () => {
        const svgData = canvas2dRef.current.toSVG();
        const blob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'custom-design.svg';
        link.click();
    };

    function addText() {
        if(!modelRef.current) {
            return;
        }

        modelRef.current.onAddText(textInput)
    }

    return (
        <div className="m-5">
            <label htmlFor="text-input">Enter Text: </label>
            <input
                type="text"
                id="text-input"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
            />

            <br/><br/>

            <Button variant="outline" onClick={addText}>Add Text</Button>
            {/* <Button variant="outline" onClick={updateText}>Update Text</Button> */}

            <br/><br/>

            <label htmlFor="logo-upload">Upload Logo: </label>
            <input type="file" id="logo-upload" accept="image/*" onChange={handleLogoUpload}/>

            <br/><br/>

            <div className="flex h-[600px] gap-3">
                <canvas id="design-canvas" className="border" ref={canvas2dRef}></canvas>

                <ThreeCanvas camera={{position: [0, 0, 1]}} className="border grow !w-[0]">
                    <ambientLight/>
                    <pointLight position={[10, 10, 10]}/>

                    <OrbitControls makeDefault/>
                    <Suspense fallback={null}>
                        <Model ref={modelRef} />
                    </Suspense>
                </ThreeCanvas>
            </div>


            <br/>

            <Button onClick={exportCanvas}>Export as PNG</Button>
        </div>
    );
}
