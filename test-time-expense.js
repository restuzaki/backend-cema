/**
 * Test Script for Time Logs and Expenses API
 *
 * Prerequisites:
 * 1. Server must be running (node src/server.js)
 * 2. You need valid JWT tokens for different roles (staff, project_manager, admin)
 * 3. You need a valid project ID in the database
 *
 * Usage: node test-time-expense.js
 */

const axios = require("axios");

// ==============================================
// CONFIGURATION - UPDATE THESE VALUES
// ==============================================

const BASE_URL = "http://localhost:5000/api";

// TODO: Replace with real tokens from your auth system
const TOKENS = {
  staff:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGZiNDI1ZDlhNjk5MTZlYzYxYjJhYyIsImVtYWlsIjoic3RhZmZAY2VtYS5jb20iLCJyb2xlIjoic3RhZmYiLCJpYXQiOjE3NjY4MzExODIsImV4cCI6MTc2NjkxNzU4Mn0.d9OKUhgcJLvCkwJrKAgjfokkJwksFryIAKH1SE5L-nI",
  project_manager:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGY2MDUyMWM0YTliYzY5ZjY4Mjg4YSIsImVtYWlsIjoicG1AY2VtYS5jb20iLCJyb2xlIjoicHJvamVjdF9tYW5hZ2VyIiwiaWF0IjoxNzY2ODMxMTk2LCJleHAiOjE3NjY5MTc1OTZ9.-iyq0EpOq4-Sbe82kBZMxetDVUFnEQ0VZ6icsg2ebhs",
  admin:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MjJiZGUzN2IyZWFjZTI3NzFkOTBhYiIsImVtYWlsIjoiYWRtaW5AY2VtYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjY4MzEyMTUsImV4cCI6MTc2NjkxNzYxNX0.VkowRwCE4skiuxTOH02MQESncqegc8-4S8OC3XaFufY",
};

// TODO: Replace with a real project ID from your database
const TEST_PROJECT_ID = "PROJ-1766758549756";

// ==============================================
// HELPER FUNCTIONS
// ==============================================

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logSection(message) {
  log(`\n${"=".repeat(60)}`, colors.yellow);
  log(message, colors.yellow);
  log("=".repeat(60), colors.yellow);
}

async function makeRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {},
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status,
    };
  }
}

// ==============================================
// TEST FUNCTIONS
// ==============================================

async function testCreateTimeLogAsStaff() {
  logSection("TEST 1: Create Time Log as Staff (Should be PENDING)");

  const timeLogData = {
    project_id: TEST_PROJECT_ID,
    start_at: new Date("2025-12-27T09:00:00Z"),
    end_at: new Date("2025-12-27T17:00:00Z"),
    description: "Frontend development - Staff submission",
  };

  const result = await makeRequest(
    "POST",
    "/time-logs",
    timeLogData,
    TOKENS.staff
  );

  if (result.success) {
    logSuccess("Time log created successfully");
    logInfo(`Status: ${result.data.data.status}`);
    logInfo(`Duration: ${result.data.data.duration_minutes} minutes`);

    if (result.data.data.status === "PENDING") {
      logSuccess("✓ Correct: Status is PENDING for staff");
    } else {
      logError("✗ Wrong: Status should be PENDING for staff");
    }

    return result.data.data.id;
  } else {
    logError(`Failed: ${JSON.stringify(result.error)}`);
    return null;
  }
}

async function testCreateTimeLogAsPM() {
  logSection("TEST 2: Create Time Log as PM (Should be APPROVED)");

  const timeLogData = {
    project_id: TEST_PROJECT_ID,
    start_at: new Date("2025-12-27T10:00:00Z"),
    end_at: new Date("2025-12-27T12:00:00Z"),
    description: "Project review - PM submission",
  };

  const result = await makeRequest(
    "POST",
    "/time-logs",
    timeLogData,
    TOKENS.project_manager
  );

  if (result.success) {
    logSuccess("Time log created successfully");
    logInfo(`Status: ${result.data.data.status}`);
    logInfo(`Duration: ${result.data.data.duration_minutes} minutes`);
    logInfo(`Approved by: ${result.data.data.approved_by || "N/A"}`);

    if (result.data.data.status === "APPROVED") {
      logSuccess("✓ Correct: Status is APPROVED for PM");
    } else {
      logError("✗ Wrong: Status should be APPROVED for PM");
    }

    return result.data.data.id;
  } else {
    logError(`Failed: ${JSON.stringify(result.error)}`);
    return null;
  }
}

async function testCreateExpense() {
  logSection("TEST 3: Create Expense with Amount Rounding");

  const expenseData = {
    project_id: TEST_PROJECT_ID,
    title: "Transportation to client site",
    amount: 123.456, // Should be rounded to 123.46
    currency: "IDR",
    category: "TRANSPORTATION",
    date: new Date("2025-12-27"),
  };

  const result = await makeRequest(
    "POST",
    "/expenses",
    expenseData,
    TOKENS.staff
  );

  if (result.success) {
    logSuccess("Expense created successfully");
    logInfo(`Amount (original): 123.456`);
    logInfo(`Amount (stored): ${result.data.data.amount}`);

    if (result.data.data.amount === 123.46) {
      logSuccess("✓ Correct: Amount rounded to 2 decimals");
    } else {
      logError("✗ Wrong: Amount not properly rounded");
    }

    return result.data.data.id;
  } else {
    logError(`Failed: ${JSON.stringify(result.error)}`);
    return null;
  }
}

async function testGetAllTimeLogsAsStaff() {
  logSection("TEST 4: Get All Time Logs as Staff (Should only see own)");

  const result = await makeRequest("GET", "/time-logs", null, TOKENS.staff);

  if (result.success) {
    logSuccess(`Retrieved ${result.data.data.length} time logs`);
    logInfo("Verifying all logs belong to staff user...");
    // Note: Can't verify user_id without knowing staff user's ID
    logInfo("Manual verification needed: Check that all logs are yours");
  } else {
    logError(`Failed: ${JSON.stringify(result.error)}`);
  }
}

async function testGetAllExpenses() {
  logSection("TEST 5: Get All Expenses with Filtering");

  const result = await makeRequest(
    "GET",
    `/expenses?status=PENDING&category=TRANSPORTATION`,
    null,
    TOKENS.staff
  );

  if (result.success) {
    logSuccess(`Retrieved ${result.data.data.length} expenses`);
    logInfo("Filter: status=PENDING, category=TRANSPORTATION");
  } else {
    logError(`Failed: ${JSON.stringify(result.error)}`);
  }
}

async function testApproveTimeLogAsPM(timeLogId) {
  if (!timeLogId) {
    logInfo("Skipping: No time log ID available");
    return;
  }

  logSection("TEST 6: Approve Time Log as PM");

  const updateData = {
    status: "APPROVED",
  };

  const result = await makeRequest(
    "PUT",
    `/time-logs/${timeLogId}`,
    updateData,
    TOKENS.project_manager
  );

  if (result.success) {
    logSuccess("Time log approved successfully");
    logInfo(`Status: ${result.data.data.status}`);
    logInfo(`Approved by: ${result.data.data.approved_by}`);
  } else {
    logError(`Failed: ${JSON.stringify(result.error)}`);
  }
}

async function testRejectExpenseWithNote(expenseId) {
  if (!expenseId) {
    logInfo("Skipping: No expense ID available");
    return;
  }

  logSection("TEST 7: Reject Expense with Rejection Note");

  const updateData = {
    status: "REJECTED",
    rejection_note: "Please provide proper receipt",
  };

  const result = await makeRequest(
    "PUT",
    `/expenses/${expenseId}`,
    updateData,
    TOKENS.project_manager
  );

  if (result.success) {
    logSuccess("Expense rejected successfully");
    logInfo(`Status: ${result.data.data.status}`);
    logInfo(`Rejection note: ${result.data.data.rejection_note}`);
  } else {
    logError(`Failed: ${JSON.stringify(result.error)}`);
  }
}

async function testValidationError() {
  logSection("TEST 8: Validation Error (end_at < start_at)");

  const invalidData = {
    project_id: TEST_PROJECT_ID,
    start_at: new Date("2025-12-27T17:00:00Z"),
    end_at: new Date("2025-12-27T09:00:00Z"), // Before start_at!
    description: "Invalid time range",
  };

  const result = await makeRequest(
    "POST",
    "/time-logs",
    invalidData,
    TOKENS.staff
  );

  if (!result.success && result.status === 400) {
    logSuccess("✓ Correct: Validation error returned");
    logInfo(`Error: ${JSON.stringify(result.error)}`);
  } else {
    logError("✗ Wrong: Should have returned validation error");
  }
}

async function testStaffCannotApprove(timeLogId) {
  if (!timeLogId) {
    logInfo("Skipping: No time log ID available");
    return;
  }

  logSection("TEST 9: Staff Cannot Update Status (Should be 403)");

  const updateData = {
    status: "APPROVED",
  };

  const result = await makeRequest(
    "PUT",
    `/time-logs/${timeLogId}`,
    updateData,
    TOKENS.staff
  );

  if (!result.success && result.status === 403) {
    logSuccess("✓ Correct: Staff denied permission");
    logInfo(`Error: ${JSON.stringify(result.error)}`);
  } else {
    logError("✗ Wrong: Staff should not be able to update status");
  }
}

// ==============================================
// MAIN TEST RUNNER
// ==============================================

async function runAllTests() {
  log("\n🧪 Starting Time & Expense Tracking API Tests\n", colors.blue);

  // Check configuration
  if (TOKENS.staff === "YOUR_STAFF_JWT_TOKEN_HERE") {
    logError(
      "❌ ERROR: Please update TOKENS in the script with real JWT tokens!"
    );
    logInfo("Get tokens by logging in with different user roles");
    process.exit(1);
  }

  if (TEST_PROJECT_ID === "PROJ-1234567890") {
    logError("❌ ERROR: Please update TEST_PROJECT_ID with a real project ID!");
    logInfo("Get a project ID from your database");
    process.exit(1);
  }

  try {
    // Run tests
    const staffTimeLogId = await testCreateTimeLogAsStaff();
    const pmTimeLogId = await testCreateTimeLogAsPM();
    const expenseId = await testCreateExpense();

    await testGetAllTimeLogsAsStaff();
    await testGetAllExpenses();

    await testApproveTimeLogAsPM(staffTimeLogId);
    await testRejectExpenseWithNote(expenseId);

    await testValidationError();
    await testStaffCannotApprove(pmTimeLogId);

    log("\n✅ All tests completed!\n", colors.green);
  } catch (error) {
    logError(`\nUnexpected error: ${error.message}`);
    console.error(error);
  }
}

// Run tests
runAllTests();
