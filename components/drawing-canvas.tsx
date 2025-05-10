"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Eraser, Trash2, Download, Palette } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type DrawingCanvasProps = {
  onSave: (imageData: string) => void
}

export function DrawingCanvas({ onSave }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState("#000000")
  const [brushSize, setBrushSize] = useState(5)
  const [mode, setMode] = useState<"draw" | "erase">("draw")

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Set initial canvas background to white
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Handle window resize
    const handleResize = () => {
      const imageData = canvas.toDataURL()
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight

      // Redraw the canvas
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      img.src = imageData
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setIsDrawing(true)

    // Get mouse position
    const rect = canvas.getBoundingClientRect()
    let x, y

    if ("touches" in e) {
      // Touch event
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      // Mouse event
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    ctx.beginPath()
    ctx.moveTo(x, y)

    // Set drawing style
    if (mode === "draw") {
      ctx.strokeStyle = color
      ctx.lineWidth = brushSize
    } else {
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = brushSize * 2
    }

    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Get mouse position
    const rect = canvas.getBoundingClientRect()
    let x, y

    if ("touches" in e) {
      // Touch event
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      // Mouse event
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const saveDrawing = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const imageData = canvas.toDataURL("image/png")
    onSave(imageData)
  }

  const downloadDrawing = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const imageData = canvas.toDataURL("image/png")
    const link = document.createElement("a")
    link.download = "drawing.png"
    link.href = imageData
    link.click()
  }

  return (
    <div className="flex flex-col space-y-2">
      <div className="border rounded-md overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-64 touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <Palette className="h-4 w-4" style={{ color }} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
              <div className="space-y-2">
                <div className="grid grid-cols-6 gap-1">
                  {[
                    "#000000",
                    "#FF0000",
                    "#00FF00",
                    "#0000FF",
                    "#FFFF00",
                    "#FF00FF",
                    "#00FFFF",
                    "#FFA500",
                    "#800080",
                    "#008000",
                    "#800000",
                    "#008080",
                  ].map((c) => (
                    <button
                      key={c}
                      className="w-8 h-8 rounded-full border"
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
                <div className="space-y-1">
                  <label className="text-sm">Brush Size: {brushSize}</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number.parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant={mode === "erase" ? "secondary" : "outline"}
            size="icon"
            onClick={() => setMode(mode === "draw" ? "erase" : "draw")}
          >
            <Eraser className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={clearCanvas}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={downloadDrawing}>
            <Download className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={saveDrawing}>
            Send Drawing
          </Button>
        </div>
      </div>
    </div>
  )
}
