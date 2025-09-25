"use client"

import { ArrowLeft, Download, FileText, Info, TrendingUp, TrendingDown, Edit3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { CSVData, ComparisonResult } from "@/app/page"

interface ComparisonResultsProps {
  results: ComparisonResult[]
  file1Data: CSVData
  file2Data: CSVData
  onReset: () => void
}

export function ComparisonResults({ results, file1Data, file2Data, onReset }: ComparisonResultsProps) {
  const changedResults = results.filter((r) => r.type !== "unchanged")

  const stats = {
    added: results.filter((r) => r.type === "added").length,
    removed: results.filter((r) => r.type === "removed").length,
    modified: results.filter((r) => r.type === "modified").length,
    unchanged: results.filter((r) => r.type === "unchanged").length,
  }

  const detailedStats = {
    totalRows: results.length,
    totalChanges: stats.added + stats.removed + stats.modified,
    changePercentage: (((stats.added + stats.removed + stats.modified) / results.length) * 100).toFixed(1),
    fieldChanges: changedResults.reduce((acc, result) => {
      if (result.type === "modified" && result.originalData) {
        const changes = result.data.filter((value, index) => value !== result.originalData![index]).length
        return acc + changes
      }
      return acc
    }, 0),
  }

  const exportResults = () => {
    const csvContent = [
      ["Row", "Status", "Field", "Original Value", "New Value", "Change Type"].join(","),
      ...results.flatMap((result) => {
        if (result.type === "added") {
          return result.data.map((value, index) =>
            [
              result.rowIndex + 1,
              "added",
              file2Data.headers[index] || `Column ${index + 1}`,
              "",
              `"${value}"`,
              "new field",
            ].join(","),
          )
        } else if (result.type === "removed") {
          return (
            result.originalData?.map((value, index) =>
              [
                result.rowIndex + 1,
                "removed",
                file1Data.headers[index] || `Column ${index + 1}`,
                `"${value}"`,
                "",
                "deleted field",
              ].join(","),
            ) || []
          )
        } else if (result.type === "modified" && result.originalData) {
          return result.data
            .map((value, index) => {
              const originalValue = result.originalData![index] || ""
              if (value !== originalValue) {
                return [
                  result.rowIndex + 1,
                  "modified",
                  file1Data.headers[index] || `Column ${index + 1}`,
                  `"${originalValue}"`,
                  `"${value}"`,
                  "field changed",
                ].join(",")
              }
              return null
            })
            .filter(Boolean)
        }
        return []
      }),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "detailed-comparison-results.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const getRowClassName = (type: ComparisonResult["type"]) => {
    switch (type) {
      case "added":
        return "bg-green-50 border-l-4 border-l-green-500"
      case "removed":
        return "bg-red-50 border-l-4 border-l-red-500"
      case "modified":
        return "bg-yellow-50 border-l-4 border-l-yellow-500"
      default:
        return "bg-muted/30"
    }
  }

  const getBadgeVariant = (type: ComparisonResult["type"]) => {
    switch (type) {
      case "added":
        return "default" as const
      case "removed":
        return "destructive" as const
      case "modified":
        return "secondary" as const
      default:
        return "outline" as const
    }
  }

  // Get all unique headers from both files
  const allHeaders = Array.from(new Set([...file1Data.headers, ...file2Data.headers]))

  const columnAnalysis = {
    file1Only: file1Data.headers.filter((h) => !file2Data.headers.includes(h)),
    file2Only: file2Data.headers.filter((h) => !file1Data.headers.includes(h)),
    common: file1Data.headers.filter((h) => file2Data.headers.includes(h)),
    hasDifferences:
      file1Data.headers.length !== file2Data.headers.length ||
      !file1Data.headers.every((h) => file2Data.headers.includes(h)),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onReset}
          className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to file selection
        </button>
        <button
          onClick={exportResults}
          className="flex items-center gap-2 cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export Detailed Results
        </button>
      </div>

      {columnAnalysis.hasDifferences && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Info className="h-5 w-5" />
              Column Structure Differences Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-yellow-700">
              The two CSV files have different column structures. This may affect comparison accuracy.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium text-yellow-800 mb-2">Common Columns ({columnAnalysis.common.length})</p>
                <div className="space-y-1">
                  {columnAnalysis.common.length > 0 ? (
                    columnAnalysis.common.map((col, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs mr-1 mb-1">
                        {col}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-yellow-600 italic">No common columns</span>
                  )}
                </div>
              </div>

              <div>
                <p className="font-medium text-yellow-800 mb-2">
                  Only in {file1Data.filename} ({columnAnalysis.file1Only.length})
                </p>
                <div className="space-y-1">
                  {columnAnalysis.file1Only.length > 0 ? (
                    columnAnalysis.file1Only.map((col, idx) => (
                      <Badge key={idx} variant="destructive" className="text-xs mr-1 mb-1">
                        {col}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-yellow-600 italic">None</span>
                  )}
                </div>
              </div>

              <div>
                <p className="font-medium text-yellow-800 mb-2">
                  Only in {file2Data.filename} ({columnAnalysis.file2Only.length})
                </p>
                <div className="space-y-1">
                  {columnAnalysis.file2Only.length > 0 ? (
                    columnAnalysis.file2Only.map((col, idx) => (
                      <Badge key={idx} variant="default" className="text-xs mr-1 mb-1">
                        {col}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-yellow-600 italic">None</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5" />
              Comparison Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Rows</p>
                <p className="text-2xl font-bold">{detailedStats.totalRows}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Changes</p>
                <p className="text-2xl font-bold text-blue-600">{detailedStats.totalChanges}</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Change Rate</p>
                <p className="text-xl font-semibold">{detailedStats.changePercentage}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Field Changes</p>
                <p className="text-xl font-semibold text-orange-600">{detailedStats.fieldChanges}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Change Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Added Rows</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{stats.added}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800">Removed Rows</span>
                </div>
                <span className="text-2xl font-bold text-red-600">{stats.removed}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Edit3 className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Modified Rows</span>
                </div>
                <span className="text-2xl font-bold text-yellow-600">{stats.modified}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detailed Changes ({changedResults.length} rows with changes)
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              File 1: {file1Data.filename} ({file1Data.rows.length} rows, {file1Data.headers.length} columns)
            </span>
            <span>•</span>
            <span>
              File 2: {file2Data.filename} ({file2Data.rows.length} rows, {file2Data.headers.length} columns)
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {/* Header row */}
            <div
              className="grid gap-2 p-3 bg-muted rounded-lg font-medium text-sm"
              style={{ gridTemplateColumns: `60px 100px repeat(${allHeaders.length}, 1fr)` }}
            >
              <div>Row</div>
              <div>Status</div>
              {allHeaders.map((header, index) => {
                const inFile1 = file1Data.headers.includes(header)
                const inFile2 = file2Data.headers.includes(header)

                return (
                  <div key={index} className="truncate flex items-center gap-1">
                    <span>{header}</span>
                    {!inFile1 && (
                      <Badge variant="destructive" className="text-xs px-1 py-0">
                        F2
                      </Badge>
                    )}
                    {!inFile2 && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        F1
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>

            {changedResults.map((result, index) => (
              <div
                key={index}
                className={`grid gap-2 p-3 rounded-lg text-sm ${getRowClassName(result.type)}`}
                style={{ gridTemplateColumns: `60px 100px repeat(${allHeaders.length}, 1fr)` }}
              >
                <div className="font-mono">{result.rowIndex + 1}</div>
                <div>
                  <Badge variant={getBadgeVariant(result.type)} className="text-xs">
                    {result.type}
                  </Badge>
                </div>
                {allHeaders.map((header, headerIndex) => {
                  const file1HeaderIndex = file1Data.headers.indexOf(header)
                  const file2HeaderIndex = file2Data.headers.indexOf(header)

                  const cellValue = file2HeaderIndex >= 0 ? result.data[file2HeaderIndex] || "" : ""
                  const originalValue = file1HeaderIndex >= 0 ? result.originalData?.[file1HeaderIndex] || "" : ""

                  const hasChanged = result.type === "modified" && cellValue !== originalValue
                  const columnMissingInFile1 = file1HeaderIndex === -1
                  const columnMissingInFile2 = file2HeaderIndex === -1

                  return (
                    <div key={headerIndex} className="truncate">
                      {columnMissingInFile1 && result.type !== "removed" ? (
                        <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded border">
                          <span className="font-medium">New Column:</span> {cellValue || "(empty)"}
                        </div>
                      ) : columnMissingInFile2 && result.type !== "added" ? (
                        <div className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded border">
                          <span className="font-medium">Missing Column:</span> {originalValue || "(empty)"}
                        </div>
                      ) : hasChanged ? (
                        <div className="space-y-1">
                          <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded border">
                            <span className="font-medium">Old:</span> {originalValue || "(empty)"}
                          </div>
                          <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border">
                            <span className="font-medium">New:</span> {cellValue || "(empty)"}
                          </div>
                        </div>
                      ) : result.type === "added" ? (
                        <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border">
                          <span className="font-medium">Added:</span> {cellValue || "(empty)"}
                        </div>
                      ) : result.type === "removed" ? (
                        <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded border">
                          <span className="font-medium">Removed:</span> {originalValue || "(empty)"}
                        </div>
                      ) : (
                        <div>{cellValue}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
