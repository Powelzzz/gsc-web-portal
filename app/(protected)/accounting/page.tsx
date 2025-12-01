export default function AccountingDashboard() {
  return (
    <div className="space-y-8">

      {/* PAGE TITLE */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Accounting Dashboard</h1>
        <p className="text-gray-500">Overview of accounting operations</p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        <div className="bg-white p-6 shadow rounded-xl">
          <p className="text-sm text-gray-500">Total Clients</p>
          <h2 className="text-3xl font-bold mt-2">38</h2>
        </div>

        <div className="bg-white p-6 shadow rounded-xl">
          <p className="text-sm text-gray-500">Unpaid Invoices</p>
          <h2 className="text-3xl font-bold mt-2 text-red-600">12</h2>
        </div>

        <div className="bg-white p-6 shadow rounded-xl">
          <p className="text-sm text-gray-500">Payments This Month</p>
          <h2 className="text-3xl font-bold mt-2">₱185,500</h2>
        </div>

        <div className="bg-white p-6 shadow rounded-xl">
          <p className="text-sm text-gray-500">Pending Deposits</p>
          <h2 className="text-3xl font-bold mt-2">3</h2>
        </div>

      </div>

      {/* QUICK ACTIONS */}
      <div>
        <h3 className="text-xl font-semibold mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

          <a
            href="/accounting/rates"
            className="bg-white p-6 shadow rounded-xl hover:bg-gray-50 transition"
          >
            <h4 className="text-lg font-semibold">Encode Rates per Client</h4>
            <p className="text-gray-500 text-sm">Add or update client service rates.</p>
          </a>

          <a
            href="/accounting/billing/generate"
            className="bg-white p-6 shadow rounded-xl hover:bg-gray-50 transition"
          >
            <h4 className="text-lg font-semibold">Generate Billing / Invoice</h4>
            <p className="text-gray-500 text-sm">Create client billing statements.</p>
          </a>

          <a
            href="/accounting/payments/encode"
            className="bg-white p-6 shadow rounded-xl hover:bg-gray-50 transition"
          >
            <h4 className="text-lg font-semibold">Encode Received Payments</h4>
            <p className="text-gray-500 text-sm">Record payments received.</p>
          </a>

          <a
            href="/accounting/payments/collected"
            className="bg-white p-6 shadow rounded-xl hover:bg-gray-50 transition"
          >
            <h4 className="text-lg font-semibold">Payment Collection Report</h4>
            <p className="text-gray-500 text-sm">View all client payments.</p>
          </a>

          <a
            href="/accounting/reports/unpaid-billing"
            className="bg-white p-6 shadow rounded-xl hover:bg-gray-50 transition"
          >
            <h4 className="text-lg font-semibold">Unpaid Billing Report</h4>
            <p className="text-gray-500 text-sm">Monitor outstanding accounts.</p>
          </a>

          <a
            href="/accounting/reports/soa"
            className="bg-white p-6 shadow rounded-xl hover:bg-gray-50 transition"
          >
            <h4 className="text-lg font-semibold">Statement of Accounts</h4>
            <p className="text-gray-500 text-sm">Generate SOA per client.</p>
          </a>

        </div>
      </div>

    </div>
  );
}
