import {CircleX, Move, RotateCcw, Scaling, Trash2} from "lucide-react";
import {useEffect, useState} from "react";

export type EditAction = 'move' | 'rotate' | 'resize' | 'delete';

const Button = ({
                    Icon,
                    onClick,
                    active = false,
                }: {
    Icon: any
    onClick: () => void
    active?: boolean
}) => {
    return (
        <button
            onClick={onClick}
            className={`px-2 py-1 h-full flex-center hover:bg-white text-[#333]`}
            style={{color: active ? "white" : "", background: active ? "#26547C" : ""}}
        >
            <Icon className="w-[10px] h-[10px]"/>
        </button>
    )
}

const TransformMenu = ({
                           changeAction,
                            onClose
                       }: {
    action?: EditAction
    changeAction: (change: EditAction) => void,
    onClose: () => void
}) => {

    const [action, setAction] = useState<EditAction>('move')

    useEffect(() => {
        changeAction(action)
    }, [action]);

    return (
        <div className="bg-white/40 rounded-[20px] flex overflow-hidden border-[1px]">
            <Button
                Icon={Move}
                active={action === 'move'}
                onClick={() => setAction("move")}
            />
            <Button
                Icon={RotateCcw}
                active={action === 'rotate'}
                onClick={() => setAction("rotate")}
            />
            <Button
                Icon={Scaling}
                active={action === 'resize'}
                onClick={() => setAction("resize")}
            />
            <Button
                Icon={Trash2}
                active={action === 'delete'}
                onClick={() => setAction("delete")}
            />
            <Button
                Icon={CircleX}
                onClick={() => onClose()}
            />
        </div>
    )
}

export default TransformMenu
