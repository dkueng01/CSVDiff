"use client"

import { useState } from "react"
import { FileUpload } from "@/components/file-upload"
import { ComparisonResults } from "@/components/comparison-results"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export interface CSVData {
  headers: string[]
  rows: string[][]
  filename: string
}

export interface ComparisonResult {
  type: "added" | "removed" | "modified" | "unchanged"
  rowIndex: number
  data: string[]
  originalData?: string[]
}

export default function CSVComparePage() {
  const [file1Data, setFile1Data] = useState<CSVData | null>(null)
  const [file2Data, setFile2Data] = useState<CSVData | null>(null)
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[] | null>(null)

  const compareCSVs = () => {
    if (!file1Data || !file2Data) return

    const results: ComparisonResult[] = []
    const maxRows = Math.max(file1Data.rows.length, file2Data.rows.length)

    for (let i = 0; i < maxRows; i++) {
      const row1 = file1Data.rows[i]
      const row2 = file2Data.rows[i]

      if (!row1 && row2) {
        // Row exists only in file 2 (added)
        results.push({
          type: "added",
          rowIndex: i,
          data: row2,
        })
      } else if (row1 && !row2) {
        // Row exists only in file 1 (removed)
        results.push({
          type: "removed",
          rowIndex: i,
          data: row1,
        })
      } else if (row1 && row2) {
        // Both rows exist, check if they're different
        const isDifferent = row1.some((cell, cellIndex) => cell !== row2[cellIndex]) || row1.length !== row2.length

        if (isDifferent) {
          results.push({
            type: "modified",
            rowIndex: i,
            data: row2,
            originalData: row1,
          })
        }
      }
    }

    setComparisonResults(results)
  }

  const resetComparison = () => {
    setFile1Data(null)
    setFile2Data(null)
    setComparisonResults(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-balance">CSV File Comparison</h1>
          <p className="text-muted-foreground mt-2 text-pretty">
            Compare two CSV files and visualize the differences. All processing happens locally in your browser.
          </p>
        </div>

        {!comparisonResults ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  Original File
                </CardTitle>
                <CardDescription>Upload the first CSV file to compare</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload onFileLoad={setFile1Data} accept=".csv" label="Choose original CSV file" />
                {file1Data && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">{file1Data.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {file1Data.rows.length} rows, {file1Data.headers.length} columns
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-chart-2"></div>
                  Comparison File
                </CardTitle>
                <CardDescription>Upload the second CSV file to compare against</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload onFileLoad={setFile2Data} accept=".csv" label="Choose comparison CSV file" />
                {file2Data && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">{file2Data.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {file2Data.rows.length} rows, {file2Data.headers.length} columns
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}

        {file1Data && file2Data && !comparisonResults && (
          <div className="text-center">
            <button
              onClick={compareCSVs}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Compare Files
            </button>
          </div>
        )}

        {comparisonResults && (
          <ComparisonResults
            results={comparisonResults}
            file1Data={file1Data!}
            file2Data={file2Data!}
            onReset={resetComparison}
          />
        )}
      </div>
    </div>
  )
}
