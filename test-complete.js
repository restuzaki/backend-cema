/**
 * Comprehensive Test Script for Time Logs and Expenses API
 *
 * This script will:
 * 1. Create a new test project
 * 2. Test all time log and expense endpoints
 * 3. Verify auto-approval, validation, and permissions
 *
 * Usage: node test-complete.js
 */

const axios = require("axios");

// ==============================================
// CONFIGURATION
// ==============================================

const BASE_URL = "http://localhost:5000/api";

// Update these with real tokens
const TOKENS = {
  staff:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGZiNDI1ZDlhNjk5MTZlYzYxYjJhYyIsImVtYWlsIjoic3RhZmZAY2VtYS5jb20iLCJyb2xlIjoic3RhZmYiLCJpYXQiOjE3NjY4MzExODIsImV4cCI6MTc2NjkxNzU4Mn0.d9OKUhgcJLvCkwJrKAgjfokkJwksFryIAKH1SE5L-nI",
  project_manager:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGY2MDUyMWM0YTliYzY5ZjY4Mjg4YSIsImVtYWlsIjoicG1AY2VtYS5jb20iLCJyb2xlIjoicHJvamVjdF9tYW5hZ2VyIiwiaWF0IjoxNzY2ODMxMTk2LCJleHAiOjE3NjY5MTc1OTZ9.-iyq0EpOq4-Sbe82kBZMxetDVUFnEQ0VZ6icsg2ebhs",
  admin:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MjJiZGUzN2IyZWFjZTI3NzFkOTBhYiIsImVtYWlsIjoiYWRtaW5AY2VtYS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NjY4MzEyMTUsImV4cCI6MTc2NjkxNzYxNX0.VkowRwCE4skiuxTOH02MQESncqegc8-4S8OC3XaFufY",
};

// User IDs (decoded from tokens above)
const USER_IDS = {
  staff: "694fb425d9a69916ec61b2ac",
  pm: "694f60521c4a9bc69f68288a",
  admin: "6922bde37b2eace2771d90ab",
};

// Will be set after creating project
let TEST_PROJECT_ID = null;
let SERVICE_ID = null; // You need to get this from your database

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
  log(`\n${"=".repeat(70)}`, colors.yellow);
  log(message, colors.yellow);
  log("=".repeat(70), colors.yellow);
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
// SETUP: Create Test Project
// ==============================================

async function setupTestProject() {
  logSection("SETUP: Creating Test Project");

  // First, get a service ID from database
  const servicesResult = await makeRequest(
    "GET",
    "/services",
    null,
    TOKENS.admin
  );

  if (
    !servicesResult.success ||
    !servicesResult.data.data ||
    servicesResult.data.data.length === 0
  ) {
    logError("No services found in database. Please create a service first.");
    return false;
  }

  SERVICE_ID = servicesResult.data.data[0]._id;
  logInfo(`Using service ID: ${SERVICE_ID}`);

  const projectData = {
    name: `Test Project - ${Date.now()}`,
    description: "Auto-generated test project for time logs and expenses",
    admin_id: USER_IDS.admin,
    client_id: USER_IDS.admin, // Using admin as client for simplicity
    clientName: "Admin Client",
    manager_id: USER_IDS.pm,
    managerName: "Test PM",
    serviceType: SERVICE_ID,
    startDate: new Date(),
    financials: {
      budget_total: 100000,
    },
  };

  const result = await makeRequest(
    "POST",
    "/projects",
    projectData,
    TOKENS.admin
  );

  if (result.success) {
    TEST_PROJECT_ID = result.data.data.id;
    logSuccess(`Test project created: ${TEST_PROJECT_ID}`);
    return true;
  } else {
    logError(`Failed to create project: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// ==============================================
// TESTS
// ==============================================

async function test1_CreateTimeLogAsStaff() {
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
    logInfo(`ID: ${result.data.data.id}`);
    logInfo(`Status: ${result.data.data.status}`);
    logInfo(`Duration: ${result.data.data.duration_minutes} minutes`);

    if (result.data.data.status === "PENDING") {
      logSuccess("✓ PASS: Status is PENDING for staff");
    } else {
      logError("✗ FAIL: Status should be PENDING for staff");
    }

    if (result.data.data.duration_minutes === 480) {
      logSuccess(
        "✓ PASS: Duration auto-calculated correctly (8 hours = 480 min)"
      );
    } else {
      logError(
        `✗ FAIL: Duration should be 480, got ${result.data.data.duration_minutes}`
      );
    }

    return result.data.data.id;
  } else {
    logError(`✗ FAIL: ${JSON.stringify(result.error)}`);
    return null;
  }
}

async function test2_CreateTimeLogAsPM() {
  logSection("TEST 2: Create Time Log as PM (Should be AUTO-APPROVED)");

  const timeLogData = {
    project_id: TEST_PROJECT_ID,
    start_at: new Date("2025-12-27T10:00:00Z"),
    end_at: new Date("2025-12-27T14:00:00Z"),
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
    logInfo(`ID: ${result.data.data.id}`);
    logInfo(`Status: ${result.data.data.status}`);
    logInfo(`Approved by: ${result.data.data.approved_by || "N/A"}`);

    if (result.data.data.status === "APPROVED") {
      logSuccess("✓ PASS: Status is APPROVED (auto-approval worked)");
    } else {
      logError("✗ FAIL: Status should be APPROVED for PM");
    }

    if (result.data.data.approved_by) {
      logSuccess("✓ PASS: approved_by is set");
    } else {
      logError("✗ FAIL: approved_by should be set");
    }

    return result.data.data.id;
  } else {
    logError(`✗ FAIL: ${JSON.stringify(result.error)}`);
    return null;
  }
}

async function test3_CreateExpenseWithRounding() {
  logSection("TEST 3: Create Expense (Test Amount Rounding)");

  const expenseData = {
    project_id: TEST_PROJECT_ID,
    title: "Transportation to client site",
    amount: 123.456789, // Should be rounded to 123.46
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
    logInfo(`ID: ${result.data.data.id}`);
    logInfo(`Amount (input): 123.456789`);
    logInfo(`Amount (stored): ${result.data.data.amount}`);

    if (result.data.data.amount === 123.46) {
      logSuccess("✓ PASS: Amount rounded to 2 decimals correctly");
    } else {
      logError(
        `✗ FAIL: Amount should be 123.46, got ${result.data.data.amount}`
      );
    }

    return result.data.data.id;
  } else {
    logError(`✗ FAIL: ${JSON.stringify(result.error)}`);
    return null;
  }
}

async function test4_ValidationError() {
  logSection("TEST 4: Validation Error (end_at before start_at)");

  const invalidData = {
    project_id: TEST_PROJECT_ID,
    start_at: new Date("2025-12-27T17:00:00Z"),
    end_at: new Date("2025-12-27T09:00:00Z"), // Before start!
    description: "Invalid time range",
  };

  const result = await makeRequest(
    "POST",
    "/time-logs",
    invalidData,
    TOKENS.staff
  );

  if (!result.success && result.status === 400) {
    logSuccess("✓ PASS: Validation error returned correctly");
    logInfo(`Error: ${JSON.stringify(result.error)}`);
  } else {
    logError("✗ FAIL: Should have returned 400 validation error");
    if (result.success) {
      logError("Request succeeded when it should have failed!");
    }
  }
}

async function test5_ApproveTimeLog(timeLogId) {
  if (!timeLogId) {
    logInfo("Skipping: No time log ID");
    return;
  }

  logSection("TEST 5: PM Approves Staff Time Log");

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
    logSuccess("✓ PASS: PM can approve time logs");
  } else {
    logError(`✗ FAIL: ${JSON.stringify(result.error)}`);
  }
}

async function test6_RejectExpense(expenseId) {
  if (!expenseId) {
    logInfo("Skipping: No expense ID");
    return;
  }

  logSection("TEST 6: PM Rejects Expense (with rejection note)");

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
    logSuccess("✓ PASS: PM can reject expenses with note");
  } else {
    logError(`✗ FAIL: ${JSON.stringify(result.error)}`);
  }
}

async function test7_StaffCannotApprove(timeLogId) {
  if (!timeLogId) {
    logInfo("Skipping: No time log ID");
    return;
  }

  logSection("TEST 7: Staff CANNOT Update Status (Permission Test)");

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
    logSuccess("✓ PASS: Staff correctly denied permission");
    logInfo(`Error: ${JSON.stringify(result.error)}`);
  } else {
    logError("✗ FAIL: Staff should not be able to update status");
  }
}

async function test8_GetTimeLogById(timeLogId) {
  if (!timeLogId) {
    logInfo("Skipping: No time log ID");
    return;
  }

  logSection("TEST 8: Get Time Log by ID");

  const result = await makeRequest(
    "GET",
    `/time-logs/${timeLogId}`,
    null,
    TOKENS.project_manager
  );

  if (result.success) {
    logSuccess("Time log retrieved successfully");
    logInfo(`ID: ${result.data.data.id}`);
    logInfo(`Duration: ${result.data.data.duration_minutes} minutes`);
    logSuccess("✓ PASS: Get by ID works");
  } else {
    logError(`✗ FAIL: ${JSON.stringify(result.error)}`);
  }
}

async function test9_GetAllTimeLogs() {
  logSection("TEST 9: Get All Time Logs (PM sees project logs)");

  const result = await makeRequest(
    "GET",
    `/time-logs?project_id=${TEST_PROJECT_ID}`,
    null,
    TOKENS.project_manager
  );

  if (result.success) {
    logSuccess(`Retrieved ${result.data.data.length} time logs`);
    logSuccess("✓ PASS: Get all time logs works");
  } else {
    logError(`✗ FAIL: ${JSON.stringify(result.error)}`);
  }
}

async function test10_GetExpenseById(expenseId) {
  if (!expenseId) {
    logInfo("Skipping: No expense ID");
    return;
  }

  logSection("TEST 10: Get Expense by ID");

  const result = await makeRequest(
    "GET",
    `/expenses/${expenseId}`,
    null,
    TOKENS.project_manager
  );

  if (result.success) {
    logSuccess("Expense retrieved successfully");
    logInfo(`Amount: ${result.data.data.amount}`);
    logSuccess("✓ PASS: Get expense by ID works");
  } else {
    logError(`✗ FAIL: ${JSON.stringify(result.error)}`);
  }
}

// ==============================================
// MAIN TEST RUNNER
// ==============================================

async function runAllTests() {
  log("\n🧪 COMPREHENSIVE TIME & EXPENSE TRACKING API TESTS\n", colors.blue);

  try {
    // Setup
    const setupSuccess = await setupTestProject();
    if (!setupSuccess) {
      logError("Setup failed. Aborting tests.");
      return;
    }

    // Run all tests
    const staffTimeLogId = await test1_CreateTimeLogAsStaff();
    const pmTimeLogId = await test2_CreateTimeLogAsPM();
    const expenseId = await test3_CreateExpenseWithRounding();

    await test4_ValidationError();
    await test5_ApproveTimeLog(staffTimeLogId);
    await test6_RejectExpense(expenseId);
    await test7_StaffCannotApprove(pmTimeLogId);
    await test8_GetTimeLogById(pmTimeLogId);
    await test9_GetAllTimeLogs();
    await test10_GetExpenseById(expenseId);

    logSection("TEST SUMMARY");
    logSuccess("All tests completed! Review results above.");
    logInfo(`Test project ID: ${TEST_PROJECT_ID}`);
    log("");
  } catch (error) {
    logError(`\nUnexpected error: ${error.message}`);
    console.error(error);
  }
}

// Run tests
runAllTests();
