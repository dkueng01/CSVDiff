"use client"

import type React from "react"

import { useRef } from "react"
import { Upload } from "lucide-react"
import type { CSVData } from "@/app/page"

interface FileUploadProps {
  onFileLoad: (data: CSVData) => void
  accept: string
  label: string
}

export function FileUpload({ onFileLoad, accept, label }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
    const lines = text.split("\n").filter((line) => line.trim())
    if (lines.length === 0) return { headers: [], rows: [] }

    const parseCSVLine = (line: string): string[] => {
      const result: string[] = []
      let current = ""
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"'
            i++ // Skip next quote
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === "," && !inQuotes) {
          result.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }

      result.push(current.trim())
      return result
    }

    const headers = parseCSVLine(lines[0])
    const rows = lines.slice(1).map(parseCSVLine)

    return { headers, rows }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { headers, rows } = parseCSV(text)

      onFileLoad({
        headers,
        rows,
        filename: file.name,
      })
    }
    reader.readAsText(file)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type === "text/csv") {
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        const { headers, rows } = parseCSV(text)

        onFileLoad({
          headers,
          rows,
          filename: file.name,
        })
      }
      reader.readAsText(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
    >
      <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-sm font-medium mb-2">{label}</p>
      <p className="text-xs text-muted-foreground">Click to browse or drag and drop your CSV file here</p>
      <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" />
    </div>
  )
}
