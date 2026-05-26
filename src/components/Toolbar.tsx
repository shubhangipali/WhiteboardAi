import React from "react";
import { ToolType } from "../App";

interface Props {
    tool: ToolType;
    setTool: (tool: ToolType) => void;
    color: string;
    setColor: (color: string) => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onGenerate: (prompt: string) => void;
}
const getButtonStyle = (active: boolean) => ({
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    background: active ? "#6366f1" : "#ffffff",
    color: active ? "#ffffff" : "#111827",
    cursor: "pointer",
    fontWeight: 500,
    transition: "all 0.2s ease",
});


const Toolbar: React.FC<Props> = ({ tool, setTool, color, setColor, onUndo, onRedo, onGenerate }) => {
    return (
        <div style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "white",
            padding: "10px 15px",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            display: "flex",
            gap: "10px",
            zIndex: 1000,
        }}>
            <button style={getButtonStyle(tool === "pen")} onClick={() => setTool("pen")}>Pen</button>
            <button style={getButtonStyle(tool === "rect")} onClick={() => setTool("rect")}>Rect</button>
            <button style={getButtonStyle(tool === "circle")} onClick={() => setTool("circle")}>Circle</button>
            <button style={getButtonStyle(tool === "text")} onClick={() => setTool("text")}>Text</button>

            <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ marginLeft: 10 }}
            />
            <input
                type="text"
                placeholder="Generate diagram..."
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        onGenerate((e.target as HTMLInputElement).value);
                    }
                }}
                style={{ marginLeft: 10 }}
            />

            {/* undo ,redo */}
            <button onClick={onUndo} style={{ marginLeft: 10 }}>Undo</button>
            <button onClick={onRedo} style={{ marginLeft: 10 }}>Redo</button>

        </div>
    );
};

export default Toolbar;