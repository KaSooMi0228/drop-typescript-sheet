import EventEmitter from "events";
import * as React from "react";
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import componentId from "./componentId";

type Props = {
    children: any;
};

const emitter = new EventEmitter();

export function useDroppableId(
    callback: (from: number, to: number, combine: boolean) => void,
    providedDroppableId?: string
) {
    const droppableId = providedDroppableId || componentId();
    React.useEffect(() => {
        function handler(detail: any) {
            callback(detail.from, detail.to, detail.combine);
        }
        emitter.on(droppableId, handler);

        return () => {
            emitter.off(droppableId, handler);
        };
    }, [droppableId, callback]);
    return droppableId;
}

export function useTransDrop(
    source: string,
    destination: string,
    callback: (from: number, to: number) => void,
    providedDroppableId?: string
) {
    const eventId = source + "->" + destination;
    React.useEffect(() => {
        function handler(detail: any) {
            callback(detail.from, detail.to);
        }
        emitter.on(eventId, handler);

        return () => {
            emitter.off(eventId, handler);
        };
    }, [eventId, callback]);
}

export function DndWrapper(props: Props) {
    function onDragEnd(result: DropResult) {
        if (
            result.source &&
            result.destination &&
            result.source.droppableId === result.destination.droppableId
        ) {
            emitter.emit(result.source.droppableId, {
                from: result.source.index,
                to: result.destination.index,
                combine: false,
            });
        } else if (
            result.source &&
            result.combine &&
            result.source.droppableId === result.combine.droppableId
        ) {
            emitter.emit(result.source.droppableId, {
                from: result.source.index,
                to: parseInt(
                    result.combine.draggableId.substring(
                        result.combine.draggableId.lastIndexOf("-") + 1
                    ),
                    0
                ),
                combine: true,
            });
        } else if (result.source && result.destination) {
            emitter.emit(
                result.source.droppableId +
                    "->" +
                    result.destination.droppableId,
                {
                    from: result.source.index,
                    to: result.destination.index,
                    combine: false,
                }
            );
        }
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            {props.children}
        </DragDropContext>
    );
}
