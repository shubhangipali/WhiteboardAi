import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Stage, Layer, Line, Rect, Circle, Text, Transformer } from "react-konva";
import { v4 as uuidv4 } from "uuid";
import { ToolType } from "../App";
import { Arrow } from "react-konva";

// ✅ Shape Type
type ShapeType = "rect" | "circle" | "text" | "arrow";


interface Shape {
    id: string;
    type: ShapeType;

    x?: number;
    y?: number;

    points?: number[]; // for arrow

    color: string;
    width?: number;
    height?: number;
    radius?: number;
    text?: string;
}


interface Props {
    tool: ToolType;
    color: string;
}

const CanvasBoard = forwardRef(({
    tool,
    color,
}: Props, ref: React.Ref<any>) => {
    const [lines, setLines] = useState<any[]>([]);
    const [shapes, setShapes] = useState<Shape[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [historyStep, setHistoryStep] = useState(-1);

    const stageRef = useRef<any>(null);
    const transformerRef = useRef<any>(null);
    const shapeRefs = useRef<any>({});
    const [stageScale, setStageScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);


    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        // Save empty board as first state
        saveToHistory([], []);
    }, []);
    /* eslint-enable react-hooks/exhaustive-deps */

    // ✅ Attach transformer to selected shape
    useEffect(() => {
        if (selectedId && transformerRef.current) {
            const node = shapeRefs.current[selectedId];
            if (node) {
                transformerRef.current.nodes([node]);
                transformerRef.current.getLayer().batchDraw();
            }
        }
    }, [selectedId]);

    useImperativeHandle(ref, () => ({
        undo: handleUndo,
        redo: handleRedo,
        generateDiagram,
    }));
    // ✅ Save history on changes
    const saveToHistory = (newLines: any[], newShapes: any[]) => {
        const newState = {
            lines: [...newLines],
            shapes: [...newShapes],
        };

        setHistory((prevHistory) => {
            const updated = prevHistory.slice(0, historyStep + 1);
            updated.push(newState);
            return updated;
        });

        setHistoryStep((prevStep) => prevStep + 1);
    };
    // ================= DRAWING =================

    const handleMouseDown = (e: any) => {
        const stage = e.target.getStage();
        const clickedOnEmpty = e.target === stage;
        if (!clickedOnEmpty) {
            // setSelectedId(null);
            setIsPanning(true);
            setSelectedId(null);
            return;
        }
        setSelectedId(null);
        const pos = stage.getPointerPosition();

        if (tool === "pen") {
            setIsDrawing(true);
            setLines([...lines, { points: [pos.x, pos.y], color }]);
            return
        }

        let newShape: Shape | null = null;

        if (tool === "rect") {
            newShape = {

                id: uuidv4(),
                type: "rect",
                x: pos.x,
                y: pos.y,
                width: 100,
                height: 100,
                color,
            };
        }

        if (tool === "circle") {
            newShape = {
                id: uuidv4(),
                type: "circle",
                x: pos.x,
                y: pos.y,
                radius: 50,
                color,
            };
        }

        if (tool === "text") {
            newShape = {
                id: uuidv4(),
                type: "text",
                x: pos.x,
                y: pos.y,
                text: "Edit me",
                color,
            };
        }

        if (newShape) {
            const newShapes = [...shapes, newShape];
            setShapes(newShapes);
            saveToHistory(lines, newShapes);
        }

    };

    const handleMouseMove = (e: any) => {
        const stage = stageRef.current;

        // 🔥 1. PAN LOGIC
        if (isPanning) {
            document.body.style.cursor = "grabbing";

            setStagePos((prev) => ({
                x: prev.x + e.evt.movementX,
                y: prev.y + e.evt.movementY,
            }));

            return; // ❗ VERY IMPORTANT (stop here)
        }

        // 🔥 2. RESET CURSOR WHEN NOT PANNING
        document.body.style.cursor = "default";

        // 🔥 3. DRAWING LOGIC (PEN)
        if (!isDrawing || tool !== "pen") return;

        const point = stage.getPointerPosition();

        let lastLine = lines[lines.length - 1];
        lastLine.points = lastLine.points.concat([point.x, point.y]);

        lines.splice(lines.length - 1, 1, lastLine);
        setLines([...lines]);
    };


    const handleMouseUp = () => {
        setIsPanning(false);
        if (tool === "pen" && isDrawing) {
            setIsDrawing(false);    
            saveToHistory(lines, shapes);
        }
    };
    const handleUndo = () => {
        console.log("undo clicked, current step:", historyStep);

        setHistoryStep((prevStep) => {
            if (prevStep <= 0) return prevStep;

            const newStep = prevStep - 1;
            const prevState = history[newStep];

            if (prevState) {
                setLines(prevState.lines);
                setShapes(prevState.shapes);
            }

            return newStep;
        });
    };
    const handleRedo = () => {
        console.log("Redo clicked, current step:", historyStep);
        setHistoryStep((prevStep) => {
            if (prevStep >= history.length - 1) return prevStep;

            const newStep = prevStep + 1;
            const nextState = history[newStep];

            if (nextState) {
                setLines(nextState.lines);
                setShapes(nextState.shapes);
            }

            return newStep;
        });
    };

    const mockAI = (prompt: string) => {
        if (prompt.toLowerCase().includes("login")) {
            return [
                "User enters credentials",
                "Validate input",
                "Send API request",
                "Check database",
                "Return response",
            ];
        }

        if (prompt.toLowerCase().includes("payment")) {
            return [
                "User selects product",
                "Enter payment details",
                "Process payment",
                "Confirm transaction",
            ];
        }

        return ["Start", "Process", "End"];
    };

    const generateDiagram = async (prompt: string) => {
        let generated: any = [];

        try {
            const response = await fetch("http://localhost:5000/generate-diagram", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                const body = await response.text();
                console.error("OpenAI backend non-ok response:", response.status, body);
                throw new Error(`OpenAI backend error: ${response.status}`);
            }

            const text = await response.text();
            let data: any;
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                console.error("Invalid JSON from backend:", text, parseError);
                throw parseError;
            }

            if (Array.isArray(data)) {
                generated = data.map((item: any) =>
                    typeof item === "string" ? { text: item } : item
                );
            } else {
                throw new Error("Invalid response from OpenAI backend");
            }
        } catch (err) {
            console.error("AI generation failed, using fallback mock:", err);
            generated = mockAI(prompt).map((text: string) => ({ text }));
        }

        if (!generated.length) {
            generated = mockAI(prompt).map((text: string) => ({ text }));
        }

        const centerX = window.innerWidth / 2;
        const newShapes: Shape[] = [];
        const arrows: Shape[] = [];

        generated.forEach((item: any, index: number) => {
            const x = centerX - 70;
            const y = 100 + index * 120;

            // 🔷 BOX
            newShapes.push({
                id: uuidv4(),
                type: "rect",
                x,
                y,
                width: 140,
                height: 60,
                text: item.text,
                color: "#ffffff",
            });

            // 🔥 ARROW BETWEEN BOXES
            if (index > 0) {
                arrows.push({
                    id: uuidv4(),
                    type: "arrow",
                    points: [
                        x + 70,        // center of prev box
                        y - 60,        // top of current
                        x + 70,
                        y,             // start of current
                    ],
                    color: "#4f46e5",
                });
            }
        });

        const allShapes = [...newShapes, ...arrows];
        setShapes(allShapes);
        saveToHistory(lines, allShapes);
    };

    // ================= RENDER =================


    //handle zoom

    const handleWheel = (e: any) => {
        e.evt.preventDefault();

        const scaleBy = 1.05;
        const stage = stageRef.current;
        const oldScale = stageScale;

        const pointer = stage.getPointerPosition();

        const mousePointTo = {
            x: (pointer.x - stagePos.x) / oldScale,
            y: (pointer.y - stagePos.y) / oldScale,
        };

        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

        setStageScale(newScale);

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };

        setStagePos(newPos);
    };


    return (
        <Stage
            width={window.innerWidth}
            height={window.innerHeight}
            ref={stageRef}
            scaleX={stageScale}
            scaleY={stageScale}
            x={stagePos.x}
            y={stagePos.y}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{
                background: "#f1f5f9",
                backgroundImage: `
    radial-gradient(circle, #d1d5db 1px, transparent 1px)
  `,
                backgroundSize: "20px 20px",
            }}
        >
            <Layer>
                {/* ✏️ Lines */}
                {lines.map((line, i) => (
                    <Line
                        key={i}
                        points={line.points}
                        stroke={line.color}
                        strokeWidth={2}
                        tension={0.5}
                        lineCap="round"

                    />
                ))}

                {/* 🧱 Shapes */}
                {shapes.map((shape) => {
                    // 🔷 RECT
                    // if (shape.type === "rect") {
                    //     return (
                    //         <Rect
                    //             key={shape.id}
                    //             ref={(node: any) => (shapeRefs.current[shape.id] = node)}
                    //             x={shape.x}
                    //             y={shape.y}
                    //             width={shape.width}
                    //             height={shape.height}
                    //             // fill={shape.color}
                    //             fill="#ffffff"
                    //             stroke={selectedId === shape.id ? "#4f46e5" : "#e5e7eb"}
                    //             // fill="#ffffff"
                    //             // stroke={selectedId === shape.id ? "#4f46e5" : "#e5e7eb"}
                    //             strokeWidth={2}
                    //             cornerRadius={14}
                    //             shadowColor="#000"
                    //             shadowBlur={10}
                    //             shadowOpacity={0.08}
                    //             shadowOffset={{ x: 0, y: 4 }}
                    //             draggable
                    //             onClick={() => setSelectedId(shape.id)}

                    //             onMouseEnter={(e: any) => {
                    //                 document.body.style.cursor = "grab";

                    //                 e.target.to({
                    //                     scaleX: 1.04,
                    //                     scaleY: 1.04,
                    //                     duration: 0.1,
                    //                 });
                    //             }}

                    //             onMouseLeave={(e: any) => {
                    //                 document.body.style.cursor = "default";

                    //                 e.target.to({
                    //                     scaleX: 1,
                    //                     scaleY: 1,
                    //                     duration: 0.1,
                    //                 });
                    //             }}

                    //             onDragEnd={(e: any) => {
                    //                 const updated = shapes.map((s) =>
                    //                     s.id === shape.id
                    //                         ? { ...s, x: e.target.x(), y: e.target.y() }
                    //                         : s
                    //                 );
                    //                 setShapes(updated);
                    //                 saveToHistory(lines, updated);
                    //             }}
                    //             onTransformEnd={() => {
                    //                 const node = shapeRefs.current[shape.id];
                    //                 const scaleX = node.scaleX();
                    //                 const scaleY = node.scaleY();

                    //                 node.scaleX(1);
                    //                 node.scaleY(1);

                    //                 const updated = shapes.map((s) =>
                    //                     s.id === shape.id
                    //                         ? {
                    //                             ...s,
                    //                             x: node.x(),
                    //                             y: node.y(),
                    //                             width: Math.max(5, node.width() * scaleX),
                    //                             height: Math.max(5, node.height() * scaleY),
                    //                         }
                    //                         : s
                    //                 );
                    //                 setShapes(updated);
                    //                 saveToHistory(lines, updated);
                    //             }}
                    //         />
                    //     );
                    // }
                    if (shape.type === "rect") {
                        return (
                            <React.Fragment key={shape.id}>
                                {/* RECT */}
                                <Rect
                                    ref={(node: any) => (shapeRefs.current[shape.id] = node)}
                                    x={shape.x}
                                    y={shape.y}
                                    width={shape.width}
                                    height={shape.height}
                                    fill={shape.color || "#ffffff"}
                                    stroke={selectedId === shape.id ? "#4f46e5" : "#e5e7eb"}
                                    strokeWidth={2}
                                    cornerRadius={14}
                                    shadowColor="#000"
                                    shadowBlur={10}
                                    shadowOpacity={0.08}
                                    shadowOffset={{ x: 0, y: 4 }}
                                    draggable
                                    onClick={() => setSelectedId(shape.id)}

                                    onMouseEnter={(e: any) => {
                                        document.body.style.cursor = "grab";
                                        e.target.to({ scaleX: 1.04, scaleY: 1.04, duration: 0.1 });
                                    }}

                                    onMouseLeave={(e: any) => {
                                        document.body.style.cursor = "default";
                                        e.target.to({ scaleX: 1, scaleY: 1, duration: 0.1 });
                                    }}

                                    onDragEnd={(e: any) => {
                                        const updated = shapes.map((s) =>
                                            s.id === shape.id
                                                ? { ...s, x: e.target.x(), y: e.target.y() }
                                                : s
                                        );
                                        setShapes(updated);
                                        saveToHistory(lines, updated);
                                    }}
                                />

                                {/* TEXT INSIDE RECT */}
                                {shape.text && (
                                    <Text
                                        x={shape.x}
                                        y={shape.y}
                                        width={shape.width}
                                        height={shape.height}
                                        text={shape.text}
                                        fill="#111"
                                        fontSize={16}
                                        fontFamily="Inter, system-ui"
                                        align="center"
                                        verticalAlign="middle"
                                        listening={false}
                                    />
                                )}
                            </React.Fragment>
                        );
                    }

                    // 🔵 CIRCLE
                    if (shape.type === "circle") {
                        return (
                            <Circle
                                key={shape.id}
                                ref={(node: any) => (shapeRefs.current[shape.id] = node)}
                                x={shape.x}
                                y={shape.y}
                                radius={shape.radius}
                                fill={shape.color}
                                onMouseEnter={(e: any) => {
                                    document.body.style.cursor = "grab";

                                    e.target.to({
                                        scaleX: 1.04,
                                        scaleY: 1.04,
                                        duration: 0.1,
                                    });
                                }}

                                onMouseLeave={(e: any) => {
                                    document.body.style.cursor = "default";
                                    e.target.to({
                                        scaleX: 1,
                                        scaleY: 1,
                                        duration: 0.1,
                                    });
                                }}
                                draggable
                                onClick={() => setSelectedId(shape.id)}
                                onDragEnd={(e: any) => {
                                    const updated = shapes.map((s) =>
                                        s.id === shape.id
                                            ? { ...s, x: e.target.x(), y: e.target.y() }
                                            : s
                                    );
                                    setShapes(updated);
                                    saveToHistory(lines, updated);
                                }}
                                onTransformEnd={() => {
                                    const node = shapeRefs.current[shape.id];
                                    const scaleX = node.scaleX();

                                    node.scaleX(1);
                                    node.scaleY(1);

                                    const updated = shapes.map((s) =>
                                        s.id === shape.id
                                            ? {
                                                ...s,
                                                x: node.x(),
                                                y: node.y(),
                                                radius: Math.max(5, shape.radius! * scaleX),
                                            }
                                            : s
                                    );

                                    setShapes(updated);
                                    saveToHistory(lines, updated);
                                }}
                            />
                        );
                    }

                    // 🔤 TEXT
                    if (shape.type === "text") {
                        return (
                            <Text
                                key={shape.id}
                                ref={(node: any) => (shapeRefs.current[shape.id] = node)}
                                x={shape.x}
                                y={shape.y}
                                text={shape.text}
                                fill={shape.color}

                                fontSize={14}
                                fontFamily="Inter, system-ui"

                                align="center"
                                verticalAlign="middle"
                                width={shape.width}
                                height={shape.height}
                                draggable
                                onClick={() => setSelectedId(shape.id)}
                            />
                        );
                    }
                    if (shape.type === "arrow") {
                        return (
                            <Arrow
                                key={shape.id}
                                points={shape.points || []}
                                stroke={shape.color}
                                fill={shape.color}
                                pointerLength={8}
                                pointerWidth={8}
                                strokeWidth={2}
                                lineCap="round"
                                lineJoin="round"

                            />
                        );
                    }

                    return null;
                })}

                {/* 🔲 Transformer */}
                <Transformer ref={transformerRef} />
            </Layer>
        </Stage>
    );
});

export default CanvasBoard;