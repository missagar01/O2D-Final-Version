"use client"
import { useState, useEffect } from 'react'

export function PaymentView() {
  const [pendingData, setPendingData] = useState([])
  const [historyData, setHistoryData] = useState([])
  const [filteredPendingData, setFilteredPendingData] = useState([])
  const [filteredHistoryData, setFilteredHistoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState("")
  const [receivingMode, setReceivingMode] = useState("")
  const [receivedAmount, setReceivedAmount] = useState("")
  const [nextDateOfCall, setNextDateOfCall] = useState("")
  const [remarks, setRemarks] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [customerFilter, setCustomerFilter] = useState("")
  const [itemFilter, setItemFilter] = useState("") // ✅ Added Item Name filter
  const [deductionAmount, setDeductionAmount] = useState("")

  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxGzl1EP1Vc6C5hB4DyOpmxraeUc0Ar4mAw567VOKlaBk0qwdFxyB37cgiGNiKYXww7/exec"
  const FMS_SHEET_NAME = "FMS"
  const PAYMENT_SHEET_NAME = "Payment Flw-Up"

  const [sortOrder, setSortOrder] = useState('none'); // 'none', 'asc', 'desc'

// Add this function to handle sorting
const handleSort = () => {
  if (sortOrder === 'none') {
    setSortOrder('asc');
  } else if (sortOrder === 'asc') {
    setSortOrder('desc');
  } else {
    setSortOrder('none');
  }
};

// Add this useEffect to apply sorting when sortOrder changes
useEffect(() => {
  if (sortOrder === 'none') {
    setFilteredPendingData([...pendingData]);
    return;
  }

  const sortedData = [...filteredPendingData].sort((a, b) => {
    const nameA = a.customerName.toLowerCase();
    const nameB = b.customerName.toLowerCase();
    
    if (sortOrder === 'asc') {
      return nameA.localeCompare(nameB);
    } else {
      return nameB.localeCompare(nameA);
    }
  });
  
  setFilteredPendingData(sortedData);
}, [sortOrder, pendingData]);

  useEffect(() => {
    fetchSheetData()
  }, [])

  useEffect(() => {
    filterData()
  }, [searchQuery, customerFilter, itemFilter, pendingData, historyData, activeTab]) // ✅ Added itemFilter

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
      hour12: false,
    }).replace(",", "");
  };

  // ✅ Added function to calculate delay days
  const calculateDelay = (dateString) => {
    if (!dateString) return "";
    try {
      const startDate = new Date(dateString);
      const currentDate = new Date();
      const timeDifference = currentDate.getTime() - startDate.getTime();
      const dayDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
      return dayDifference >= 0 ? dayDifference : 0;
    } catch (error) {
      return "";
    }
  };

  const filterData = () => {
    // Filter pending data
    let filteredPending = [...pendingData];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredPending = filteredPending.filter(item => 
        item.planned7.toLowerCase().includes(query) ||
        item.orderNumber.toLowerCase().includes(query) ||
        item.gateEntryNumber.toLowerCase().includes(query) ||
        item.customerName.toLowerCase().includes(query) ||
        item.truckNumber.toLowerCase().includes(query) ||
        item.invoiceNumber.toLowerCase().includes(query) ||
        item.itemName.toLowerCase().includes(query) || // ✅ Added Item Name search
        item.quantity.toLowerCase().includes(query)
      );
    }
    
    if (customerFilter) {
      filteredPending = filteredPending.filter(item => 
        item.customerName === customerFilter
      );
    }

    // ✅ Added Item Name filter
    if (itemFilter) {
      filteredPending = filteredPending.filter(item => 
        item.itemName === itemFilter
      );
    }
    
    setFilteredPendingData(filteredPending);
    
    // Filter history data
    let filteredHistory = [...historyData];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredHistory = filteredHistory.filter(item => 
        item.orderNumber.toLowerCase().includes(query) ||
        item.partyName.toLowerCase().includes(query) ||
        item.paymentStatus.toLowerCase().includes(query) ||
        item.receivingMode.toLowerCase().includes(query) ||
        item.receivedAmount.toLowerCase().includes(query) ||
        item.remarks.toLowerCase().includes(query) ||
        item.nextDateOfCall.toLowerCase().includes(query)
      );
    }
    
    if (customerFilter) {
      filteredHistory = filteredHistory.filter(item => 
        item.partyName === customerFilter
      );
    }
    
    setFilteredHistoryData(filteredHistory);
  }

  const fetchSheetData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch pending data from FMS sheet
      const fmsResponse = await fetch(`${APPS_SCRIPT_URL}?sheet=${FMS_SHEET_NAME}&action=fetch`)
      const fmsResult = await fmsResponse.json()
      
      // Fetch history data from Payment Flw-Up sheet
      const paymentResponse = await fetch(`${APPS_SCRIPT_URL}?sheet=${PAYMENT_SHEET_NAME}&action=fetch`)
      const paymentResult = await paymentResponse.json()
      
      if (fmsResult.success && fmsResult.data) {
        const pending = []
        
        // Start from row 7 (index 6) and process each row for pending data
        for (let i = 6; i < fmsResult.data.length; i++) {
          const row = fmsResult.data[i]
          
          // Extract data from FMS sheet
          const orderNumber = row[1] || ""         // Column B
          const gateEntryNumber = row[2] || ""     // Column C
          const customerName = row[3] || ""        // Column D
          const truckNumber = row[4] || ""         // Column E
          const invoiceNumber = row[21] || ""      // Column U
          const totalAmount = row[29] || ""        // Column AD
          const totalReceived = row[37] || ""      // Column AL
          const balanceAmount = row[38] || ""      // Column AM
          const columnAI = row[34] || ""           // Column AI
          const columnAJ = row[35] || ""           // Column AJ
          const itemName = row[27] || ""           // ✅ Column AB (Item Name)
          const quantity = row[28] || ""           // ✅ Column AC (Quantity)
          const planned7 = formatDateTime(row[34]) || ""
          const delay = calculateDelay(row[34])    // ✅ Calculate delay from Column AI
          
          // Only process rows that have at least some data
          if (orderNumber || gateEntryNumber || customerName || truckNumber) {
            // Pending condition: column AI is not null and column AJ is null
            if (columnAI && columnAI.toString().trim() !== "" && (!columnAJ || columnAJ.toString().trim() === "")) {
              pending.push({
                orderNumber: orderNumber.toString(),
                gateEntryNumber: gateEntryNumber.toString(),
                customerName: customerName.toString(),
                truckNumber: truckNumber.toString(),
                invoiceNumber: invoiceNumber.toString(),
                totalAmount: totalAmount.toString(),
                totalReceived: totalReceived.toString(),
                balanceAmount: balanceAmount.toString(),
                itemName: itemName.toString(),        // ✅ Added Item Name
                quantity: quantity.toString(),        // ✅ Added Quantity
                delay: delay.toString(),              // ✅ Added Delay
                planned7: planned7,
                rowIndex: i + 1
              })
            }
          }
        }
        
        setPendingData(pending)
        setFilteredPendingData(pending)
      }
      
      if (paymentResult.success && paymentResult.data) {
        const history = []
        
        // Process Payment Flw-Up sheet data (columns B to H)
        for (let i = 1; i < paymentResult.data.length; i++) {
          const row = paymentResult.data[i]
          
          // Extract data from Payment Flw-Up sheet (columns B to H)
          const orderNumber = row[1] || ""         // Column B
          const partyName = row[2] || ""           // Column C
          const paymentStatus = row[3] || ""       // Column D
          const receivingMode = row[4] || ""       // Column E
          const receivedAmount = row[5] || ""      // Column F
          const remarks = row[6] || ""             // Column G
          const nextDateOfCall = row[7] || ""      // Column H
          const invoice = row[8] || ""
          const deduction  = row[9] || ""
          
          // Only process rows that have at least some data
          if (orderNumber || partyName) {
            history.push({
              orderNumber: orderNumber.toString(),
              partyName: partyName.toString(),
              paymentStatus: paymentStatus.toString(),
              receivingMode: receivingMode.toString(),
              receivedAmount: receivedAmount.toString(),
              remarks: remarks.toString(),
              nextDateOfCall: nextDateOfCall.toString(),
              invoice: invoice.toString(),
              deduction: deduction.toString(),
              rowIndex: i + 1
            })
          }
        }
        
        setHistoryData(history)
        setFilteredHistoryData(history)
      }
      
      if (!fmsResult.success || !paymentResult.success) {
        setError(fmsResult.error || paymentResult.error || "Failed to fetch data")
      }
    } catch (err) {
      setError("Error fetching data: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleProcessPayment = async () => {
  if (!selectedEntry || !paymentStatus) {
    alert("Please select payment status")
    return
  }

  try {
    setIsSubmitting(true)
    const timestamp = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata'
    });
    
    // Prepare data for Payment Flw-Up sheet
    const rowData = [
      timestamp,                                    // Column A (Timestamp)
      selectedEntry.orderNumber,                    // Column B
      selectedEntry.customerName,                   // Column C (Party Name)
      paymentStatus,                                // Column D
      receivingMode || "",                          // Column E
      receivedAmount || "",                         // Column F
      remarks || "",                                // Column G
      nextDateOfCall || "",                         // Column H
      selectedEntry.invoiceNumber,                  // Column I (Invoice Number)
      deductionAmount || ""                         // Column J (Deduction Amount)
    ]
    
    // Create form data for adding to Payment Flw-Up sheet
    const formData = new FormData()
    formData.append('sheetName', PAYMENT_SHEET_NAME)
    formData.append('action', 'insert')
    formData.append('rowData', JSON.stringify(rowData))

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: formData
    })

    const result = await response.json()
    
    if (result.success) {
      // Reset form
      setSelectedEntry(null)
      setPaymentStatus("")
      setReceivingMode("")
      setReceivedAmount("")
      setDeductionAmount("") // Reset deduction amount
      setNextDateOfCall("")
      setRemarks("")
      setShowDialog(false)
      
      // Refresh data
      await fetchSheetData()
      
      alert("Payment processed successfully!")
    } else {
      alert("Error: " + (result.error || "Failed to process payment"))
    }
  } catch (error) {
    alert("Error processing payment: " + error.message)
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
  setPaymentStatus("")
  setReceivingMode("")
  setReceivedAmount("")
  setDeductionAmount("") // Add this line
  setNextDateOfCall("")
  setRemarks("")
}

  // Get unique customer names for filter dropdown
  const uniqueCustomerNames = [...new Set(pendingData.map(item => item.customerName))].filter(name => name);

  // ✅ Get unique item names for filter dropdown
  const uniqueItemNames = [...new Set(pendingData.map(item => item.itemName))].filter(name => name);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payment</h2>
          <p className="text-gray-600">Payment processing and management</p>
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
          <h2 className="text-3xl font-bold tracking-tight">Payment</h2>
          <p className="text-gray-600">Payment processing and management</p>
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
        <h2 className="text-3xl font-bold tracking-tight">Payment</h2>
        <p className="text-gray-600">Payment processing and management</p>
      </div>

      <div className="space-y-4">
        {/* Search and Filter Controls */}
        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search across all columns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-full sm:w-64">
              <label htmlFor="customer-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Customer
              </label>
              <select
                id="customer-filter"
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Customers</option>
                {uniqueCustomerNames.map((name, index) => (
                  <option key={index} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            {/* ✅ Added Item Name filter dropdown */}
            <div className="w-full sm:w-64">
              <label htmlFor="item-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Item Name
              </label>
              <select
                id="item-filter"
                value={itemFilter}
                onChange={(e) => setItemFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Items</option>
                {uniqueItemNames.map((name, index) => (
                  <option key={index} value={name}>
                    {name}
                  </option>
                ))}
              </select>
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
              <h3 className="text-lg font-semibold">Pending Payments</h3>
              <p className="text-gray-600 text-sm">Invoices awaiting payment</p>
            </div>
            <div className="overflow-x-auto" style={{ maxHeight: '360px', overflowY: 'auto' }}>
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gate Entry Number</th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th> */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={handleSort}>
  Customer Name
  {sortOrder === 'asc' && ' ↑'}
  {sortOrder === 'desc' && ' ↓'}
</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Truck Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice Number</th>
                    {/* ✅ Added new columns */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delay (Days)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Received</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPendingData.length > 0 ? (
                    filteredPendingData.map((entry, index) => (
                      <tr key={entry.gateEntryNumber || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{entry.planned7}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{entry.orderNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.gateEntryNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.customerName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.truckNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {entry.invoiceNumber}
                          </span>
                        </td>
                        {/* ✅ Added new columns data */}
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.itemName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            parseInt(entry.delay) > 7 
                              ? 'bg-red-100 text-red-800' 
                              : parseInt(entry.delay) > 3 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {entry.delay} days
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{entry.totalAmount}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-green-600">{entry.totalReceived}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-red-600">{entry.balanceAmount}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => openDialog(entry)}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                          >
                            Process
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={13} className="px-6 py-8 text-center text-gray-500">
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
              <h3 className="text-lg font-semibold">Payment History</h3>
              <p className="text-gray-600 text-sm">Processed payments</p>
            </div>
            <div className="overflow-x-auto" style={{ maxHeight: '380px', overflowY: 'auto' }}>
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receiving Mode</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Date Of Call</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deduction Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredHistoryData.length > 0 ? (
                    filteredHistoryData.map((entry, index) => (
                      <tr key={entry.orderNumber || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{entry.orderNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.partyName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            entry.paymentStatus.toLowerCase() === 'received' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {entry.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.receivingMode}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-green-600">{entry.receivedAmount}</td>
                        <td className="px-6 py-4 whitespace-nowrap max-w-xs truncate text-gray-900">{entry.remarks}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.nextDateOfCall}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.invoice}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">{entry.deductionamount}</td>
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

      {/* Dialog Modal */}
      {showDialog && selectedEntry && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Process Payment</h3>
        <p className="text-gray-600 text-sm">Process payment for invoice {selectedEntry.invoiceNumber}</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select payment status</option>
            <option value="Follow Up">Follow Up</option>
            <option value="Received">Received</option>
          </select>
        </div>

        {paymentStatus === "Follow Up" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Next Date of Call</label>
              <input
                type="date"
                value={nextDateOfCall}
                onChange={(e) => setNextDateOfCall(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
          </>
        )}

        {paymentStatus === "Received" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Receiving Mode</label>
              <select
                value={receivingMode}
                onChange={(e) => setReceivingMode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select receiving mode</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Received Amount</label>
              <input
                type="text"
                placeholder="Enter received amount"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Deduction Amount</label>
              <input
                type="text"
                placeholder="Enter deduction amount (if any)"
                value={deductionAmount}
                onChange={(e) => setDeductionAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
          </>
        )}
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
          onClick={handleProcessPayment}
          disabled={isSubmitting || !paymentStatus}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? "Processing..." : "Process Payment"}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  )
}
