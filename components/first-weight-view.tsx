"use client"
import { useState, useEffect } from 'react'

export function FirstWeightView() {
  const [pendingData, setPendingData] = useState([])
  const [historyData, setHistoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('pending')
  const [customerFilter, setCustomerFilter] = useState('')
const [searchTerm, setSearchTerm] = useState('')
const [filteredPendingData, setFilteredPendingData] = useState([])
const [filteredHistoryData, setFilteredHistoryData] = useState([])

  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxGzl1EP1Vc6C5hB4DyOpmxraeUc0Ar4mAw567VOKlaBk0qwdFxyB37cgiGNiKYXww7/exec"
  const SHEET_NAME = "FMS"

  useEffect(() => {
    fetchSheetData()
  }, []) 

  useEffect(() => {
  // Filter pending data
  let pendingResult = [...pendingData]
  if (customerFilter) {
    pendingResult = pendingResult.filter(item => item.customerName === customerFilter)
  }
  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    pendingResult = pendingResult.filter(item => 
      item.orderNumber.toLowerCase().includes(term) ||
      item.gateEntryNumber.toLowerCase().includes(term) ||
      item.customerName.toLowerCase().includes(term) ||
      item.truckNumber.toLowerCase().includes(term)
    )
  }
  setFilteredPendingData(pendingResult)

  // Filter history data
  let historyResult = [...historyData]
  if (customerFilter) {
    historyResult = historyResult.filter(item => item.customerName === customerFilter)
  }
  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    historyResult = historyResult.filter(item => 
      item.orderNumber.toLowerCase().includes(term) ||
      item.gateEntryNumber.toLowerCase().includes(term) ||
      item.customerName.toLowerCase().includes(term) ||
      item.truckNumber.toLowerCase().includes(term) ||
      item.wbSlipNo.toLowerCase().includes(term)
    )
  }
  setFilteredHistoryData(historyResult)
}, [pendingData, historyData, customerFilter, searchTerm])

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
          
          // Extract data from columns B, C, D, E, F, G, I (indices 1, 2, 3, 4, 5, 6, 8)
          const orderNumber = row[1] || ""
          const gateEntryNumber = row[2] || ""
          const customerName = row[3] || ""
          const truckNumber = row[4] || ""
          const columnF = row[5] || ""
          const columnG = row[6] || ""
          const wbSlipNo = row[8] || ""
          const planned2 = formatDateTime(row[5]) || ""
          
          // Only process rows that have at least some data
          if (orderNumber || gateEntryNumber || customerName || truckNumber) {
            const entry = {
              orderNumber: orderNumber.toString(),
              gateEntryNumber: gateEntryNumber.toString(),
              customerName: customerName.toString(),
              truckNumber: truckNumber.toString(),
              wbSlipNo: wbSlipNo.toString(),
              planned2: planned2
            }
            
            // Pending condition: column F is not null and column G is null
            if (columnF && columnF.toString().trim() !== "" && (!columnG || columnG.toString().trim() === "")) {
              pending.push(entry)
            }
            // History condition: both column F and column G are not null
            else if (columnF && columnF.toString().trim() !== "" && columnG && columnG.toString().trim() !== "") {
              history.push(entry)
            }
          }
        }
        
        setPendingData(pending)
setHistoryData(history)
setFilteredPendingData(pending)
setFilteredHistoryData(history)
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
          <h2 className="text-3xl font-bold tracking-tight">First Weight</h2>
          <p className="text-gray-600">Vehicle weighing before loading</p>
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
          <h2 className="text-3xl font-bold tracking-tight">First Weight</h2>
          <p className="text-gray-600">Vehicle weighing before loading</p>
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
        <h2 className="text-3xl font-bold tracking-tight">First Weight</h2>
        <p className="text-gray-600">Vehicle weighing before loading</p>
      </div>

      <div className="space-y-4">
        {/* Tab Navigation */}
        {/* Filter Controls */}
<div className="bg-white p-4 rounded-lg shadow border mb-4">
  <div className="flex flex-col sm:flex-row gap-4">
    <div className="w-full sm:w-auto">
      <label htmlFor="customer-filter" className="block text-sm font-medium text-gray-700 mb-1">
        Filter by Customer
      </label>
      <select
        id="customer-filter"
        value={customerFilter}
        onChange={(e) => setCustomerFilter(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Customers</option>
        {[...new Set([...pendingData, ...historyData].map(item => item.customerName))].filter(name => name).sort().map((name, index) => (
          <option key={index} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
    
    <div className="w-full sm:flex-1">
      <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 mb-1">
        Search
      </label>
      <input
        id="search-filter"
        type="text"
        placeholder="Search by order number, gate entry, customer, truck number..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      />
    </div>
    
    <div className="flex items-end">
      <button
        onClick={() => {
          setCustomerFilter('')
          setSearchTerm('')
        }}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
      >
        Clear Filters
      </button>
    </div>
  </div>
</div>

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
      Pending ({filteredPendingData.length})
    </button>
    <button
      onClick={() => setActiveTab('history')}
      className={`py-2 px-1 border-b-2 font-medium text-sm ${
        activeTab === 'history'
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      History ({filteredHistoryData.length})
    </button>
  </nav>
</div>

        {/* Pending Tab Content */}
        {activeTab === 'pending' && (
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Pending First Weight</h3>
              <p className="text-gray-600 text-sm">Vehicles waiting for first weighing</p>
            </div>
            <div className="overflow-x-auto mobile-card-view" style={{ maxHeight: '350px', overflowY: 'auto' }}>
  {/* Desktop Table View */}
  <table className="w-full hidden md:table">
    <thead className="bg-gray-50 border-b">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gate Entry Number</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Truck Number</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {filteredPendingData.length > 0 ? (
        filteredPendingData.map((entry, index) => (
          <tr key={entry.gateEntryNumber || index} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{entry.orderNumber}</td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.gateEntryNumber}</td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.customerName}</td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.truckNumber}</td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.planned2}</td>
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

  {/* Mobile Card View */}
  <div className="md:hidden">
    {filteredPendingData.length > 0 ? (
      filteredPendingData.map((entry, index) => (
        <div key={entry.gateEntryNumber || index} className="mobile-card">
          <div className="mobile-card-row">
            <span className="mobile-card-label">Order Number:</span>
            <span className="mobile-card-value">{entry.orderNumber}</span>
          </div>
          <div className="mobile-card-row">
            <span className="mobile-card-label">Gate Entry Number:</span>
            <span className="mobile-card-value">{entry.gateEntryNumber}</span>
          </div>
          <div className="mobile-card-row">
            <span className="mobile-card-label">Customer Name:</span>
            <span className="mobile-card-value">{entry.customerName}</span>
          </div>
          <div className="mobile-card-row">
            <span className="mobile-card-label">Truck Number:</span>
            <span className="mobile-card-value">{entry.truckNumber}</span>
          </div>
          <div className="mobile-card-row">
            <span className="mobile-card-label">Planned:</span>
            <span className="mobile-card-value">{entry.planned2}</span>
          </div>
        </div>
      ))
    ) : (
      <div className="px-6 py-8 text-center text-gray-500">
        No pending records found
      </div>
    )}
  </div>
</div>
          </div>
        )}

        {/* History Tab Content */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">First Weight History</h3>
              <p className="text-gray-600 text-sm">Completed first weighing records</p>
            </div>
            <div className="overflow-x-auto mobile-card-view" style={{ maxHeight: '350px', overflowY: 'auto' }}>
  {/* Desktop Table View */}
  <table className="w-full hidden md:table">
    <thead className="bg-gray-50 border-b">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gate Entry Number</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Truck Number</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WB Slip No</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {filteredHistoryData.length > 0 ? (
        filteredHistoryData.map((entry, index) => (
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
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
            No history records found
          </td>
        </tr>
      )}
    </tbody>
  </table>

  {/* Mobile Card View */}
  <div className="md:hidden">
    {filteredHistoryData.length > 0 ? (
      filteredHistoryData.map((entry, index) => (
        <div key={entry.gateEntryNumber || index} className="mobile-card">
          <div className="mobile-card-row">
            <span className="mobile-card-label">Order Number:</span>
            <span className="mobile-card-value">{entry.orderNumber}</span>
          </div>
          <div className="mobile-card-row">
            <span className="mobile-card-label">Gate Entry Number:</span>
            <span className="mobile-card-value">{entry.gateEntryNumber}</span>
          </div>
          <div className="mobile-card-row">
            <span className="mobile-card-label">Customer Name:</span>
            <span className="mobile-card-value">{entry.customerName}</span>
          </div>
          <div className="mobile-card-row">
            <span className="mobile-card-label">Truck Number:</span>
            <span className="mobile-card-value">{entry.truckNumber}</span>
          </div>
          <div className="mobile-card-row">
            <span className="mobile-card-label">WB Slip No:</span>
            <span className="mobile-card-value">
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {entry.wbSlipNo}
              </span>
            </span>
          </div>
        </div>
      ))
    ) : (
      <div className="px-6 py-8 text-center text-gray-500">
        No history records found
      </div>
    )}
  </div>
</div>
          </div>
        )}
      </div>
    </div>
  )
}