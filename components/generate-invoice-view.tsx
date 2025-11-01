"use client"
import { useState, useEffect } from 'react'

export function GenerateInvoiceView() {
  const [pendingData, setPendingData] = useState([])
  const [historyData, setHistoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('pending')

  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxGzl1EP1Vc6C5hB4DyOpmxraeUc0Ar4mAw567VOKlaBk0qwdFxyB37cgiGNiKYXww7/exec"
  const SHEET_NAME = "FMS"

  useEffect(() => {
    fetchSheetData()
  }, [])

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
          
          // Extract data from all required columns
          const orderNumber = row[1] || ""        // Column B
          const gateEntryNumber = row[2] || ""    // Column C
          const customerName = row[3] || ""       // Column D
          const truckNumber = row[4] || ""        // Column E
          const wbSlipNo = row[8] || ""          // Column I
          const supervisorName = row[12] || ""    // Column M
          const remarks = row[13] || ""          // Column N
          const finalWeight = row[16] || ""      // Column Q
          const columnS = row[18] || ""          // Column S
          const columnT = row[19] || ""          // Column T
          const planned5 = formatDateTime(row[18]) || ""
          
          // Additional columns for history (assuming positions)
          const invoiceNumber = row[20] || ""    // Column U
          const invoiceDate = row[21] || ""      // Column V
          const brokerName = row[22] || ""       // Column W
          const salesPerson = row[23] || ""      // Column X
          const loadedTruckNumber = row[24] || "" // Column Y
          const itemName = row[25] || ""         // Column Z
          const quantity = row[26] || ""         // Column AA
          const amount = row[27] || ""           // Column AB
          const state = row[28] || ""            // Column AC
          
          // Only process rows that have at least some data
          if (orderNumber || gateEntryNumber || customerName || truckNumber) {
            // Pending condition: column S is not null and column T is null
            if (columnS && columnS.toString().trim() !== "" && (!columnT || columnT.toString().trim() === "")) {
              pending.push({
                orderNumber: orderNumber.toString(),
                gateEntryNumber: gateEntryNumber.toString(),
                customerName: customerName.toString(),
                truckNumber: truckNumber.toString(),
                wbSlipNo: wbSlipNo.toString(),
                supervisorName: supervisorName.toString(),
                remarks: remarks.toString(),
                finalWeight: finalWeight.toString(),
                planned5: planned5,
                rowIndex: i + 1
              })
            }
            // History condition: both column S and column T are not null
            else if (columnS && columnS.toString().trim() !== "" && columnT && columnT.toString().trim() !== "") {
              history.push({
                orderNumber: orderNumber.toString(),
                gateEntryNumber: gateEntryNumber.toString(),
                customerName: customerName.toString(),
                truckNumber: truckNumber.toString(),
                wbSlipNo: wbSlipNo.toString(),
                supervisorName: supervisorName.toString(),
                remarks: remarks.toString(),
                finalWeight: finalWeight.toString(),
                invoiceNumber: invoiceNumber.toString(),
                invoiceDate: invoiceDate.toString(),
                brokerName: brokerName.toString(),
                salesPerson: salesPerson.toString(),
                loadedTruckNumber: loadedTruckNumber.toString(),
                itemName: itemName.toString(),
                quantity: quantity.toString(),
                amount: amount.toString(),
                state: state.toString(),
                rowIndex: i + 1
              })
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Generate Invoice</h2>
          <p className="text-gray-600">Invoice generation and management</p>
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
          <h2 className="text-3xl font-bold tracking-tight">Generate Invoice</h2>
          <p className="text-gray-600">Invoice generation and management</p>
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
        <h2 className="text-3xl font-bold tracking-tight">Generate Invoice</h2>
        <p className="text-gray-600">Invoice generation and management</p>
      </div>

      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending ({pendingData.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
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
              <h3 className="text-lg font-semibold">Pending Invoice Generation</h3>
              <p className="text-gray-600 text-sm">Orders ready for invoice generation</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gate Entry Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Truck Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WB Slip No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingData.length > 0 ? (
                    pendingData.map((entry, index) => (
                      <tr key={entry.gateEntryNumber || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{entry.planned5}</td>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            {entry.finalWeight}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
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
              <h3 className="text-lg font-semibold">Invoice History</h3>
              <p className="text-gray-600 text-sm">Generated invoices</p>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Weight</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Broker Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Person</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loaded Truck Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {historyData.length > 0 ? (
                    historyData.map((entry, index) => (
                      <tr key={entry.invoiceNumber || index} className="hover:bg-gray-50">
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            {entry.finalWeight}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                            {entry.invoiceNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.invoiceDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.brokerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.salesPerson}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.loadedTruckNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.itemName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {entry.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-green-600">{entry.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.state}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={17} className="px-6 py-8 text-center text-gray-500">
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
    </div>
  )
}