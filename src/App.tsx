import React, { useRef, useState } from "react";
import CanvasBoard from "./components/CanvasBoard";
// import { CanvasBoard } from "./components/CanvasBoard";
import Toolbar from "./components/Toolbar";

export type ToolType = "pen" | "rect" | "circle" | "text";

function App() {
  const [tool, setTool] = useState<ToolType>("pen");
  const [color, setColor] = useState("black");
  const canvasRef = useRef<any>(null);

  const handleGenerate = async (prompt: string) => {
    await canvasRef.current?.generateDiagram(prompt);
  };
  return (
    <div>
      <Toolbar tool={tool} setTool={setTool} color={color} setColor={setColor}
        onRedo={() => canvasRef.current?.redo()}
        onUndo={() => canvasRef.current?.undo()}
        onGenerate={handleGenerate}
      />
      <CanvasBoard ref={canvasRef} tool={tool} color={color} />

    </div>
  );
}

export default App;