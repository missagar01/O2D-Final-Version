"use client"
import { useState, useEffect } from 'react'

export function LoadVehicleView() {
  const [pendingData, setPendingData] = useState([])
  const [historyData, setHistoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [supervisorName, setSupervisorName] = useState("")
  const [remarks, setRemarks] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [supervisorOptions, setSupervisorOptions] = useState([]) // New state for supervisor names

  const [itemName, setItemName] = useState("")
  const [qualityController, setQualityController] = useState("")
  const [itemOptions, setItemOptions] = useState([])
  const [qualityControllerOptions, setQualityControllerOptions] = useState([])
  const [itemCount, setItemCount] = useState(1);
const [selectedItems, setSelectedItems] = useState([]);
  const [newItems, setNewItems] = useState([])
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxGzl1EP1Vc6C5hB4DyOpmxraeUc0Ar4mAw567VOKlaBk0qwdFxyB37cgiGNiKYXww7/exec"
  const SHEET_NAME = "FMS"

  useEffect(() => {
    fetchSheetData()
    fetchSupervisorNames() // Fetch supervisor names on component mount
  }, [])

  const fetchSupervisorNames = async () => {
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?sheet=Login&action=fetch`)
      const result = await response.json()

      if (result.success && result.data) {
        const supervisors = []
        const items = []
        const qualityControllers = []

        // Process each row starting from row 1 (index 0)
        const firstRow = result.data.slice(1)

        for (let i = 0; i < firstRow.length; i++) {
          const row = firstRow[i]
          const supervisorName = row[3] // Column D is index 3 (0-based)
          const itemName = row[4] // Column E is index 4 (0-based)
          const qualityControllerName = row[5] // Column F is index 5 (0-based)

          if (supervisorName && supervisorName.toString().trim() !== "") {
            supervisors.push(supervisorName.toString().trim())
          }

          if (itemName && itemName.toString().trim() !== "") {
            items.push(itemName.toString().trim())
          }

          if (qualityControllerName && qualityControllerName.toString().trim() !== "") {
            qualityControllers.push(qualityControllerName.toString().trim())
          }
        }

        // Remove duplicates and set the options
        const uniqueSupervisors = [...new Set(supervisors)]
        const uniqueItems = [...new Set(items)]
        const uniqueQualityControllers = [...new Set(qualityControllers)]

        setSupervisorOptions(uniqueSupervisors)
        setItemOptions(uniqueItems)
        setQualityControllerOptions(uniqueQualityControllers)
      }
    } catch (err) {
      console.error("Error fetching supervisor names:", err)
      // Fallback to hardcoded options if fetch fails
      setSupervisorOptions(["John Doe", "Jane Smith", "Mike Johnson", "Sarah Wilson"])
      setItemOptions(["Item 1", "Item 2", "Item 3"])
      setQualityControllerOptions(["QC 1", "QC 2", "QC 3"])
    }
  }



  const formatDateTime = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false, // 24-hour format
    }).replace(",", ""); // removes extra comma
  };


  const fetchSheetData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${APPS_SCRIPT_URL}?sheet=${SHEET_NAME}&action=fetch`)
      const result = await response.json()

      if (result.success && result.data) {
        const pending = []
        const history = []

        // Start from row 7 (index 6) and process each row
        for (let i = 6; i < result.data.length; i++) {
          const row = result.data[i]

          // Extract data from columns B, C, D, E, I, J, K, M, N (indices 1, 2, 3, 4, 8, 9, 10, 12, 13)
          const orderNumber = row[1] || ""
          const gateEntryNumber = row[2] || ""
          const customerName = row[3] || ""
          const truckNumber = row[4] || ""
          const wbSlipNo = row[8] || ""
          const columnJ = row[9] || ""
          const columnK = row[10] || ""
          const supervisorNameData = row[12] || ""
          const remarksData = row[13] || ""
          const planned3 = formatDateTime(row[9]) || ""
          const itemName = row[41] || ""

          // Only process rows that have at least some data
          if (orderNumber || gateEntryNumber || customerName || truckNumber) {
            const entry = {
              orderNumber: orderNumber.toString(),
              gateEntryNumber: gateEntryNumber.toString(),
              customerName: customerName.toString(),
              truckNumber: truckNumber.toString(),
              wbSlipNo: wbSlipNo.toString(),
              supervisorName: supervisorNameData.toString(),
              remarks: remarksData.toString(),
              itemName: itemName.toString(),
              planned3: planned3,

              rowIndex: i + 1 // Store actual row number for updates
            }

            // Pending condition: column J is not null and column K is null
            if (columnJ && columnJ.toString().trim() !== "" && (!columnK || columnK.toString().trim() === "")) {
              pending.push(entry)
            }
            // History condition: both column J and column K are not null
            else if (columnJ && columnJ.toString().trim() !== "" && columnK && columnK.toString().trim() !== "") {
              history.push(entry)
            }
          }
        }

        setPendingData(pending)
        setHistoryData(history)
      } else {
        setError(result.error || "Failed to fetch data")
      }
    } catch (err) {
      setError("Error fetching data: " + err.message)
    } finally {
      setLoading(false)
    }
  }
const addItemDuplicate = () => {
  if (itemName && itemCount < 10) {
    setSelectedItems([...selectedItems, itemName]);
    setItemCount(itemCount + 1);
  }
};

const removeItem = (index) => {
  const updatedItems = selectedItems.filter((_, i) => i !== index);
  setSelectedItems(updatedItems);
  setItemCount(itemCount - 1);
};




const handleLoadVehicle = async () => {
  if (!selectedEntry || !supervisorName || !itemName || !qualityController) {
    alert("Please fill all required fields")
    return
  }

  try {
    setIsSubmitting(true)
    
    const currentDate = new Date().toISOString().split('T')[0]
    
    const formData = new FormData()
    formData.append('sheetName', SHEET_NAME)
    formData.append('action', 'update')
    formData.append('rowIndex', selectedEntry.rowIndex.toString())
    
    const rowData = new Array(50).fill('')
    rowData[10] = currentDate
    rowData[12] = supervisorName
    rowData[13] = remarks || ''

    // Column AQ (index 42) - All Items as comma-separated string
    const allItems = []
    if (itemName) allItems.push(itemName)
    if (selectedItems.length > 0) {
      const validNewItems = selectedItems.filter(item => item.trim() !== "")
      allItems.push(...validNewItems)
      // Update dropdown options with new items
      setItemOptions(prev => [...new Set([...prev, ...validNewItems])]) // Using Set to avoid duplicates
    }

    rowData[42] = allItems.join(', ') // Simple comma-separated string instead of JSON

    rowData[43] = qualityController // Column AR - Normal text
    
    formData.append('rowData', JSON.stringify(rowData))

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: formData
    })

    const result = await response.json()
    
    if (result.success) {
      setSelectedEntry(null)
      setSupervisorName("")
      setRemarks("")
      setItemName("")
      setQualityController("")
      setSelectedItems([]) // Clear selectedItems instead of newItems
      setItemCount(1) // Reset item count
      setShowDialog(false)
      
      await fetchSheetData()
      
      alert("Loading completed successfully!")
    } else {
      alert("Error: " + (result.error || "Failed to update"))
    }
  } catch (error) {
    alert("Error submitting data: " + error.message)
  } finally {
    setIsSubmitting(false)
  }
}

  const openDialog = (entry) => {
    setSelectedEntry(entry)
    setShowDialog(true)
  }

  const closeDialog = () => {
    setShowDialog(false)
    setSelectedEntry(null)
    setSupervisorName("")
    setRemarks("")
    setItemName("")
    setQualityController("")
    setNewItems([]) // Clear new items when closing dialog
  }
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Load Vehicle</h2>
          <p className="text-gray-600">Vehicle loading as per loading slip</p>
        </div>

        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Loading Data</h3>
            <p className="text-gray-600 text-sm">Fetching data from Google Sheets...</p>
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
          <h2 className="text-3xl font-bold tracking-tight">Load Vehicle</h2>
          <p className="text-gray-600">Vehicle loading as per loading slip</p>
        </div>

        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Error Loading Data</h3>
            <p className="text-gray-600 text-sm">Unable to fetch data from Google Sheets</p>
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
        <h2 className="text-3xl font-bold tracking-tight">Load Vehicle</h2>
        <p className="text-gray-600">Vehicle loading as per loading slip</p>
      </div>

      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Pending ({pendingData.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              History ({historyData.length})
            </button>
          </nav>
        </div>

        {/* Pending Tab Content */}
        {activeTab === 'pending' && (
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Pending Loading</h3>
              <p className="text-gray-600 text-sm">Vehicles waiting for loading</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gate Entry Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Truck Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingData.length > 0 ? (
                    pendingData.map((entry, index) => (
                      <tr key={entry.gateEntryNumber || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{entry.orderNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.gateEntryNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.customerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.truckNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.itemName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.planned3}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => openDialog(entry)}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                          >
                            Load
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No pending records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* History Tab Content */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Loading History</h3>
              <p className="text-gray-600 text-sm">Completed loading records</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gate Entry Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Truck Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WB Slip No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {historyData.length > 0 ? (
                    historyData.map((entry, index) => (
                      <tr key={entry.gateEntryNumber || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{entry.orderNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.gateEntryNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.customerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.truckNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {entry.wbSlipNo}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.supervisorName}</td>
                        <td className="px-6 py-4 whitespace-nowrap max-w-xs truncate text-gray-900">{entry.remarks}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        No history records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
{showDialog && selectedEntry && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-96 overflow-y-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Load Vehicle</h3>
        <p className="text-gray-600 text-sm">Complete loading details for {selectedEntry.truckNumber}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
          <div className="flex space-x-2">
            <select
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select item</option>
              {itemOptions.map((name, index) => (
                <option key={index} value={name}>{name}</option>
              ))}
            </select>
            <button
              onClick={addItemDuplicate}
              className="px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
              disabled={!itemName || itemCount >= 10}
            >
              Add Item ({itemCount}/10)
            </button>
          </div>
        </div>

        {/* Additional Item Dropdowns */}
        {selectedItems.length > 0 && (
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Items ({selectedItems.length}/10):
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {selectedItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <select
                    value={item}
                    onChange={(e) => {
                      const updatedItems = [...selectedItems];
                      updatedItems[index] = e.target.value;
                      setSelectedItems(updatedItems);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select item</option>
                    {itemOptions.map((name, optionIndex) => (
                      <option key={optionIndex} value={name}>{name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeItem(index)}
                    className="px-2 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setSelectedItems([]);
                setItemCount(1);
              }}
              className="mt-2 px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
            >
              Clear All
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Quality Controller</label>
          <select
            value={qualityController}
            onChange={(e) => setQualityController(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select quality controller</option>
            {qualityControllerOptions.map((name, index) => (
              <option key={index} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor Name</label>
          <select
            value={supervisorName}
            onChange={(e) => setSupervisorName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select supervisor</option>
            {supervisorOptions.map((name, index) => (
              <option key={index} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
          <textarea
            placeholder="Enter any remarks..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          onClick={closeDialog}
          disabled={isSubmitting}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleLoadVehicle}
          disabled={isSubmitting || !supervisorName || !itemName || !qualityController}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Complete Loading"}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  )
}