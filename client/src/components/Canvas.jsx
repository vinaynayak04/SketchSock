import React, { useRef, useState, useEffect } from "react";

const COLORS = [
  "#000000", "#555555", "#aaaaaa", "#ffffff", // Grayscale
  "#ef4444", "#f97316", "#eab308", "#22c55e", // Warm / Brights
  "#06b6d4", "#3b82f6", "#6366f1", "#a855f7", // Cools
  "#ec4899", "#78350f", "#451a03", "#0f172a"  // Pink, Browns, Slates
];

const BRUSH_SIZES = [
  { label: "S", value: 3 },
  { label: "M", value: 8 },
  { label: "L", value: 15 },
  { label: "XL", value: 28 }
];

export default function Canvas({ socket, roomCode, isDrawer, drawerName }) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(8);
  const [isEraser, setIsEraser] = useState(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Internal resolution
  const INTERNAL_WIDTH = 800;
  const INTERNAL_HEIGHT = 600;

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = INTERNAL_WIDTH;
    canvas.height = INTERNAL_HEIGHT;

    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.lineJoin = "round";
    contextRef.current = context;

    // Clear to white background initially
    clearLocalCanvas();

    // Request canvas history when joining/mounting
    if (socket && roomCode) {
      socket.emit("request-canvas-history", { roomCode });
    }
  }, [socket, roomCode]);

  // Handle Socket Events for Syncing
  useEffect(() => {
    if (!socket) return;

    const handleRemoteStroke = (stroke) => {
      drawStrokeOnContext(stroke);
    };

    const handleRemoteClear = () => {
      clearLocalCanvas();
    };

    const handleRemoteRedraw = (history) => {
      clearLocalCanvas();
      history.forEach((stroke) => {
        drawStrokeOnContext(stroke);
      });
    };

    socket.on("draw-stroke", handleRemoteStroke);
    socket.on("canvas-clear", handleRemoteClear);
    socket.on("canvas-redraw", handleRemoteRedraw);

    return () => {
      socket.off("draw-stroke", handleRemoteStroke);
      socket.off("canvas-clear", handleRemoteClear);
      socket.off("canvas-redraw", handleRemoteRedraw);
    };
  }, [socket]);

  const clearLocalCanvas = () => {
    const ctx = contextRef.current;
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
    }
  };

  const drawStrokeOnContext = (stroke) => {
    const ctx = contextRef.current;
    if (!ctx) return;

    ctx.beginPath();
    ctx.strokeStyle = stroke.mode === "erase" ? "#ffffff" : stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.moveTo(stroke.lastX, stroke.lastY);
    ctx.lineTo(stroke.x, stroke.y);
    ctx.stroke();
    ctx.closePath();
  };

  // Helper to map client coordinates to internal 800x600 resolution
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
    // Support mouse or touch
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * INTERNAL_WIDTH;
    const y = ((clientY - rect.top) / rect.height) * INTERNAL_HEIGHT;

    return { x, y };
  };

  const startDrawing = (e) => {
    if (!isDrawer) return;
    
    // Prevent default scroll behaviors on touch devices
    if (e.cancelable) e.preventDefault();

    const pos = getCoordinates(e);
    if (!pos) return;

    setIsDrawing(true);
    lastPosRef.current = pos;
  };

  const draw = (e) => {
    if (!isDrawing || !isDrawer) return;
    if (e.cancelable) e.preventDefault();

    const pos = getCoordinates(e);
    if (!pos) return;

    const stroke = {
      x: pos.x,
      y: pos.y,
      lastX: lastPosRef.current.x,
      lastY: lastPosRef.current.y,
      color: color,
      size: brushSize,
      mode: isEraser ? "erase" : "draw"
    };

    // Draw locally
    drawStrokeOnContext(stroke);

    // Emit to server
    if (socket) {
      socket.emit("draw-stroke", { roomCode, stroke });
    }

    lastPosRef.current = pos;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Button handlers
  const handleClear = () => {
    if (!isDrawer) return;
    clearLocalCanvas();
    if (socket) {
      socket.emit("canvas-clear", { roomCode });
    }
  };

  const handleUndo = () => {
    if (!isDrawer) return;
    // Emit undo, server will compute and send back canvas-redraw
    if (socket) {
      socket.emit("canvas-undo", { roomCode });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, width: "100%" }}>
      {/* Canvas board */}
      <div className="canvas-container" style={{ touchAction: "none" }}>
        <canvas
          ref={canvasRef}
          className="canvas-element"
          style={{ touchAction: "none" }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      {/* Drawing Toolbar (Only drawer can see/interact with controls) */}
      {isDrawer && (
        <div className="canvas-tools">
          <div className="tool-group">
            {/* Color grid */}
            <div className="color-swatches">
              {COLORS.map((c) => (
                <div
                  key={c}
                  className={`swatch ${color === c && !isEraser ? "active" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    setColor(c);
                    setIsEraser(false);
                  }}
                  title={c}
                />
              ))}
            </div>
          </div>

          <div className="tool-group">
            {/* Eraser */}
            <button
              className={`btn btn-secondary ${isEraser ? "btn-primary" : ""}`}
              onClick={() => setIsEraser(true)}
              style={{ padding: "8px 12px", fontSize: "0.85rem" }}
              title="Eraser"
            >
              🧽 Eraser
            </button>
            
            {/* Brush sizes */}
            <div className="brush-sizes" style={{ marginLeft: "8px" }}>
              {BRUSH_SIZES.map((size) => (
                <button
                  key={size.label}
                  className={`size-btn ${brushSize === size.value && !isEraser ? "active" : ""}`}
                  onClick={() => {
                    setBrushSize(size.value);
                    setIsEraser(false);
                  }}
                  title={`Size ${size.label}`}
                >
                  <div
                    className="brush-preview-dot"
                    style={{
                      width: `${Math.max(2, size.value / 1.5)}px`,
                      height: `${Math.max(2, size.value / 1.5)}px`,
                      backgroundColor: brushSize === size.value && !isEraser ? "var(--text-primary)" : "var(--text-secondary)"
                    }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="tool-group">
            <button
              className="btn btn-secondary"
              onClick={handleUndo}
              style={{ padding: "8px 12px", fontSize: "0.85rem" }}
              title="Undo last stroke"
            >
              ↩️ Undo
            </button>
            <button
              className="btn btn-danger"
              onClick={handleClear}
              style={{ padding: "8px 12px", fontSize: "0.85rem" }}
              title="Clear Canvas"
            >
              🗑️ Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
