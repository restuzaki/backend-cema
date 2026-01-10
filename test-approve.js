/**
 * Simple Test Script for Approve Endpoints
 * Tests expense and task approval functionality
 */

const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

// IMPORTANT: Update these with your actual credentials and IDs
const CONFIG = {
  pm: {
    email: "pm@cema.com",
    password: "12345678",
  },
  staff: {
    email: "staff@cema.com",
    password: "12345678",
  },
  projectId: "PROJ-1766758549756", // Update with real project ID
};

let pmToken = "";
let staffToken = "";

// Helper to make requests
async function request(method, endpoint, data = null, token = "") {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data,
    };

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status,
      error: error.response?.data?.message || error.message,
    };
  }
}

// Step 1: Login
async function login() {
  console.log("\n========================================");
  console.log("🔐 STEP 1: LOGIN");
  console.log("========================================\n");

  // Login PM
  console.log("→ Logging in as PM...");
  const pmLogin = await request("post", "/login", CONFIG.pm);

  if (!pmLogin.success) {
    console.log("❌ PM Login Failed:", pmLogin.error);
    return false;
  }

  // Check different possible response structures
  if (pmLogin.data?.token) {
    pmToken = pmLogin.data.token;
  } else if (pmLogin.data?.data?.token) {
    pmToken = pmLogin.data.data.token;
  } else {
    console.log("❌ PM Login: Token not found in response");
    console.log("Response structure:", JSON.stringify(pmLogin.data, null, 2));
    return false;
  }

  console.log("✅ PM Login Success");
  console.log("   Token:", pmToken.substring(0, 30) + "...");

  // Login Staff
  console.log("\n→ Logging in as Staff...");
  const staffLogin = await request("post", "/login", CONFIG.staff);

  if (!staffLogin.success) {
    console.log("❌ Staff Login Failed:", staffLogin.error);
    return false;
  }

  if (staffLogin.data?.token) {
    staffToken = staffLogin.data.token;
  } else if (staffLogin.data?.data?.token) {
    staffToken = staffLogin.data.data.token;
  } else {
    console.log("❌ Staff Login: Token not found in response");
    return false;
  }

  console.log("✅ Staff Login Success");
  console.log("   Token:", staffToken.substring(0, 30) + "...");

  return true;
}

// Step 2: Test Expense Approval
async function testExpenseApproval() {
  console.log("\n========================================");
  console.log("💰 STEP 2: TEST EXPENSE APPROVAL");
  console.log("========================================\n");

  // Create expense as staff
  console.log("→ Staff creates expense...");
  const expenseData = {
    project_id: CONFIG.projectId,
    title: "Test Materials - " + Date.now(),
    amount: 5000000,
    currency: "IDR",
    category: "MATERIAL",
    date: new Date().toISOString(),
    receipt_url: "https://example.com/receipt.pdf",
  };

  const createResult = await request(
    "post",
    "/expenses",
    expenseData,
    staffToken
  );

  if (!createResult.success) {
    console.log("❌ Create Expense Failed:", createResult.error);
    console.log("   Status:", createResult.status);
    return;
  }

  const expenseId = createResult.data?.data?.id || createResult.data?.id;
  const status = createResult.data?.data?.status || createResult.data?.status;

  console.log("✅ Expense Created");
  console.log("   ID:", expenseId);
  console.log("   Status:", status);

  if (!expenseId) {
    console.log("❌ No expense ID returned");
    return;
  }

  // Approve expense as PM
  console.log("\n→ PM approves expense...");
  const approveResult = await request(
    "put",
    `/expenses/${expenseId}/approve`,
    { status: "APPROVED" },
    pmToken
  );

  if (!approveResult.success) {
    console.log("❌ Approve Failed:", approveResult.error);
    console.log("   Status:", approveResult.status);
    return;
  }

  console.log("✅ Expense Approved");
  console.log(
    "   New Status:",
    approveResult.data?.data?.status || approveResult.data?.status
  );

  // Test rejection
  console.log("\n→ Creating another expense to reject...");
  const createResult2 = await request(
    "post",
    "/expenses",
    {
      ...expenseData,
      title: "Test Equipment - " + Date.now(),
    },
    staffToken
  );

  if (createResult2.success) {
    const expenseId2 = createResult2.data?.data?.id || createResult2.data?.id;
    console.log("✅ Second expense created:", expenseId2);

    console.log("→ PM rejects expense...");
    const rejectResult = await request(
      "put",
      `/expenses/${expenseId2}/approve`,
      {
        status: "REJECTED",
        rejection_note: "Receipt not clear enough",
      },
      pmToken
    );

    if (rejectResult.success) {
      console.log("✅ Expense Rejected");
      console.log("   Reason:", rejectResult.data?.data?.rejection_note);
    } else {
      console.log("❌ Reject Failed:", rejectResult.error);
    }
  }
}

// Step 3: Test Task Approval
async function testTaskApproval() {
  console.log("\n========================================");
  console.log("📋 STEP 3: TEST TASK APPROVAL");
  console.log("========================================\n");

  // Create task as PM
  console.log("→ PM creates task...");
  const taskData = {
    project_id: CONFIG.projectId,
    title: "Test Task - " + Date.now(),
    description: "Testing task approval",
    budget_allocation: 3000000,
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const createResult = await request("post", "/tasks", taskData, pmToken);

  if (!createResult.success) {
    console.log("❌ Create Task Failed:", createResult.error);
    console.log("   Status:", createResult.status);
    return;
  }

  const taskId = createResult.data?.data?.id || createResult.data?.id;

  console.log("✅ Task Created");
  console.log("   ID:", taskId);

  if (!taskId) {
    console.log("❌ No task ID returned");
    return;
  }

  // Mark task as DONE
  console.log("\n→ Marking task as DONE...");
  const doneResult = await request(
    "put",
    `/tasks/${taskId}`,
    { status: "DONE" },
    pmToken
  );

  if (!doneResult.success) {
    console.log("❌ Update Task Failed:", doneResult.error);
    return;
  }

  console.log("✅ Task marked as DONE");

  // Approve task
  console.log("\n→ PM approves task...");
  const approveResult = await request(
    "put",
    `/tasks/${taskId}/approve`,
    { is_approved: true },
    pmToken
  );

  if (!approveResult.success) {
    console.log("❌ Approve Failed:", approveResult.error);
    console.log("   Status:", approveResult.status);
    return;
  }

  console.log("✅ Task Approved");
  console.log("   Approval:", approveResult.data?.data?.approval);

  // Test rejection
  console.log("\n→ Creating another task to reject...");
  const createResult2 = await request(
    "post",
    "/tasks",
    {
      ...taskData,
      title: "Test Task 2 - " + Date.now(),
    },
    pmToken
  );

  if (createResult2.success) {
    const taskId2 = createResult2.data?.data?.id || createResult2.data?.id;
    console.log("✅ Second task created:", taskId2);

    // Mark as DONE
    await request("put", `/tasks/${taskId2}`, { status: "DONE" }, pmToken);

    console.log("→ PM rejects task...");
    const rejectResult = await request(
      "put",
      `/tasks/${taskId2}/approve`,
      {
        is_approved: false,
        rejection_note: "Quality not acceptable",
      },
      pmToken
    );

    if (rejectResult.success) {
      console.log("✅ Task Rejected");
      console.log(
        "   Reason:",
        rejectResult.data?.data?.approval?.rejection_note
      );
    } else {
      console.log("❌ Reject Failed:", rejectResult.error);
    }
  }
}

// Main
async function runTests() {
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║  APPROVE ENDPOINTS TEST SUITE        ║");
  console.log("╚══════════════════════════════════════╝");
  console.log("Base URL:", BASE_URL);
  console.log("Time:", new Date().toLocaleString());

  try {
    // Step 1: Login
    const loginSuccess = await login();
    if (!loginSuccess) {
      console.log("\n❌ FAILED: Could not login. Please check credentials.");
      return;
    }

    // Step 2: Test expenses
    await testExpenseApproval();

    // Step 3: Test tasks
    // await testTaskApproval();

    console.log("\n╔══════════════════════════════════════╗");
    console.log("║  ✅ TEST SUITE COMPLETED             ║");
    console.log("╚══════════════════════════════════════╝\n");
  } catch (error) {
    console.log("\n❌ FATAL ERROR:", error.message);
    console.log("Stack:", error.stack);
  }
}

// Run
runTests();
