"use client"
import { useState, useEffect } from 'react'

export function GateEntryView() {
  const [gateEntryData, setGateEntryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxGzl1EP1Vc6C5hB4DyOpmxraeUc0Ar4mAw567VOKlaBk0qwdFxyB37cgiGNiKYXww7/exec"
  const SHEET_NAME = "FMS"

  useEffect(() => {
    fetchSheetData()
  }, [])

  const fetchSheetData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${APPS_SCRIPT_URL}?sheet=${SHEET_NAME}&action=fetch`)
      const result = await response.json()
      
      if (result.success && result.data) {
        // Process the data - skip to row 7 (index 6) and get columns B, C, D, E (indices 1, 2, 3, 4)
        const processedData = []
        
        // Start from row 7 (index 6) and process each row
        for (let i = 6; i < result.data.length; i++) {
          const row = result.data[i]
          
          // Extract data from columns B, C, D, E (indices 1, 2, 3, 4)
          const orderNumber = row[1] || ""
          const gateEntryNumber = row[2] || ""
          const customerName = row[3] || ""
          const truckNumber = row[4] || ""
          
          // Only add rows that have at least some data
          if (orderNumber || gateEntryNumber || customerName || truckNumber) {
            processedData.push({
              orderNumber: orderNumber.toString(),
              gateEntryNumber: gateEntryNumber.toString(),
              customerName: customerName.toString(),
              truckNumber: truckNumber.toString(),
              status: "Active" // Default status as requested
            })
          }
        }
        
        setGateEntryData(processedData)
      } else {
        setError(result.error || "Failed to fetch data")
      }
    } catch (err) {
      setError("Error fetching data: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gate Entry</h2>
          <p className="text-muted-foreground">Vehicle entry records</p>
        </div>
        
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Gate Entry Records</h3>
            <p className="text-gray-600 text-sm">Loading data from Google Sheets...</p>
          </div>
          <div className="px-6 py-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gate Entry</h2>
          <p className="text-muted-foreground">Vehicle entry records</p>
        </div>
        
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Gate Entry Records</h3>
            <p className="text-gray-600 text-sm">Error loading data</p>
          </div>
          <div className="px-6 py-8">
            <div className="text-center">
              <p className="text-red-500 mb-4">Error: {error}</p>
              <button 
                onClick={fetchSheetData}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gate Entry</h2>
        <p className="text-muted-foreground">Vehicle entry records</p>
      </div>
      
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Gate Entry Records</h3>
          <p className="text-gray-600 text-sm">
            All vehicles that have entered the facility ({gateEntryData.length} records)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gate Entry Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Truck Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {gateEntryData.length > 0 ? (
                gateEntryData.map((entry, index) => (
                  <tr key={entry.gateEntryNumber || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{entry.orderNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.gateEntryNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.truckNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}