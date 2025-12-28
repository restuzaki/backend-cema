/**
 * Test Script for Pagination
 *
 * Tests pagination functionality for Tasks, Time Logs, and Expenses
 *
 * Prerequisites:
 * 1. Server must be running
 * 2. You need valid JWT tokens for testing
 * 3. You need a valid project ID with tasks/logs/expenses
 *
 * Usage: node test-pagination.js
 */

const axios = require("axios");

// ==============================================
// CONFIGURATION
// ==============================================

const BASE_URL = "http://localhost:5000/api";

// Update with real token
const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NGY2MDUyMWM0YTliYzY5ZjY4Mjg4YSIsImVtYWlsIjoicG1AY2VtYS5jb20iLCJyb2xlIjoicHJvamVjdF9tYW5hZ2VyIiwiaWF0IjoxNzY2ODMxMTk2LCJleHAiOjE3NjY5MTc1OTZ9.-iyq0EpOq4-Sbe82kBZMxetDVUFnEQ0VZ6icsg2ebhs";

// Update with real project ID
const TEST_PROJECT_ID = "PROJ-1766832671578";

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
  magenta: "\x1b[35m",
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

function logData(message) {
  log(message, colors.magenta);
}

async function makeRequest(method, endpoint, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {},
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

// Extract pagination from response (at top level due to sendResponse merge)
function getPagination(responseData) {
  return {
    currentPage: responseData.currentPage,
    totalPages: responseData.totalPages,
    totalItems: responseData.totalItems,
    itemsPerPage: responseData.itemsPerPage,
    hasNextPage: responseData.hasNextPage,
    hasPreviousPage: responseData.hasPreviousPage,
  };
}

function validatePagination(pagination, expectedPage, expectedLimit) {
  const checks = [];

  if (pagination.currentPage === expectedPage) {
    checks.push({
      name: "currentPage",
      pass: true,
      value: pagination.currentPage,
    });
  } else {
    checks.push({
      name: "currentPage",
      pass: false,
      expected: expectedPage,
      actual: pagination.currentPage,
    });
  }

  if (pagination.itemsPerPage === expectedLimit) {
    checks.push({
      name: "itemsPerPage",
      pass: true,
      value: pagination.itemsPerPage,
    });
  } else {
    checks.push({
      name: "itemsPerPage",
      pass: false,
      expected: expectedLimit,
      actual: pagination.itemsPerPage,
    });
  }

  if (typeof pagination.totalPages === "number") {
    checks.push({
      name: "totalPages",
      pass: true,
      value: pagination.totalPages,
    });
  } else {
    checks.push({ name: "totalPages", pass: false, value: "not a number" });
  }

  if (typeof pagination.totalItems === "number") {
    checks.push({
      name: "totalItems",
      pass: true,
      value: pagination.totalItems,
    });
  } else {
    checks.push({ name: "totalItems", pass: false, value: "not a number" });
  }

  if (typeof pagination.hasNextPage === "boolean") {
    checks.push({
      name: "hasNextPage",
      pass: true,
      value: pagination.hasNextPage,
    });
  } else {
    checks.push({ name: "hasNextPage", pass: false, value: "not a boolean" });
  }

  if (typeof pagination.hasPreviousPage === "boolean") {
    checks.push({
      name: "hasPreviousPage",
      pass: true,
      value: pagination.hasPreviousPage,
    });
  } else {
    checks.push({
      name: "hasPreviousPage",
      pass: false,
      value: "not a boolean",
    });
  }

  return checks;
}

// ==============================================
// TEST FUNCTIONS
// ==============================================

async function test1_TasksDefaultPagination() {
  logSection("TEST 1: Tasks - Default Pagination (page 1, limit 20)");

  const result = await makeRequest(
    "GET",
    `/tasks/project/${TEST_PROJECT_ID}`,
    TOKEN
  );

  if (result.success) {
    logSuccess(`Retrieved ${result.data.data.length} tasks`);

    const pagination = getPagination(result.data);
    logInfo(`Total items: ${pagination.totalItems}`);
    logInfo(`Total pages: ${pagination.totalPages}`);

    const checks = validatePagination(pagination, 1, 20);
    checks.forEach((check) => {
      if (check.pass) {
        logSuccess(`✓ ${check.name}: ${check.value}`);
      } else {
        logError(
          `✗ ${check.name}: expected ${check.expected}, got ${check.actual}`
        );
      }
    });

    if (result.data.data.length <= 20) {
      logSuccess("✓ Data count respects limit");
    } else {
      logError(`✗ Data count exceeds limit: ${result.data.data.length}`);
    }
  } else {
    logError(`Failed: ${JSON.stringify(result.error)}`);
  }
}

async function test2_TasksCustomPagination() {
  logSection("TEST 2: Tasks - Custom Pagination (page 2, limit 5)");

  const result = await makeRequest(
    "GET",
    `/tasks/project/${TEST_PROJECT_ID}?page=2&limit=5`,
    TOKEN
  );

  if (result.success) {
    logSuccess(`Retrieved ${result.data.data.length} tasks`);
    logData(`Query: page=2, limit=5`);

    const pagination = getPagination(result.data);
    const checks = validatePagination(pagination, 2, 5);
    checks.forEach((check) => {
      if (check.pass) {
        logSuccess(`✓ ${check.name}: ${check.value}`);
      } else {
        logError(
          `✗ ${check.name}: expected ${check.expected}, got ${check.actual}`
        );
      }
    });

    if (result.data.data.length <= 5) {
      logSuccess("✓ Data count respects custom limit");
    } else {
      logError(`✗ Data count exceeds limit: ${result.data.data.length}`);
    }

    if (pagination.currentPage === 2) {
      logSuccess("✓ Correct page returned");
    } else {
      logError("✗ Wrong page returned");
    }
  } else {
    logError(`Failed: ${JSON.stringify(result.error)}`);
  }
}

async function test3_TimeLogsDefaultPagination() {
  logSection("TEST 3: Time Logs - Default Pagination (page 1, limit 20)");

  const result = await makeRequest(
    "GET",
    `/time-logs?project_id=${TEST_PROJECT_ID}`,
    TOKEN
  );

  if (result.success) {
    logSuccess(`Retrieved ${result.data.data.length} time logs`);

    const pagination = getPagination(result.data);
    logInfo(`Total items: ${pagination.totalItems}`);
    logInfo(`Total pages: ${pagination.totalPages}`);

    const checks = validatePagination(pagination, 1, 20);
    checks.forEach((check) => {
      if (check.pass) {
        logSuccess(`✓ ${check.name}: ${check.value}`);
      } else {
        logError(
          `✗ ${check.name}: expected ${check.expected}, got ${check.actual}`
        );
      }
    });
  } else {
    logError(`Failed: ${JSON.stringify(result.error)}`);
  }
}

async function test4_TimeLogsWithFilters() {
  logSection(
    "TEST 4: Time Logs - Pagination with Filters (status=PENDING, page=1, limit=10)"
  );

  const result = await makeRequest(
    "GET",
    `/time-logs?project_id=${TEST_PROJECT_ID}&status=PENDING&page=1&limit=10`,
    TOKEN
  );

  if (result.success) {
    logSuccess(`Retrieved ${result.data.data.length} pending time logs`);
    logData(`Query: status=PENDING, page=1, limit=10`);

    const pagination = getPagination(result.data);
    const checks = validatePagination(pagination, 1, 10);
    checks.forEach((check) => {
      if (check.pass) {
        logSuccess(`✓ ${check.name}: ${check.value}`);
      } else {
        logError(
          `✗ ${check.name}: expected ${check.expected}, got ${check.actual}`
        );
      }
    });

    // Verify all items are PENDING
    const allPending = result.data.data.every(
      (log) => log.status === "PENDING"
    );
    if (allPending) {
      logSuccess("✓ All logs have PENDING status");
    } else {
      logError("✗ Some logs do not have PENDING status");
    }
  } else {
    logError(`Failed: ${JSON.stringify(result.error)}`);
  }
}

async function test5_ExpensesDefault() {
  logSection("TEST 5: Expenses - Default Pagination (page 1, limit 20)");

  const result = await makeRequest(
    "GET",
    `/expenses?project_id=${TEST_PROJECT_ID}`,
    TOKEN
  );

  if (result.success) {
    logSuccess(`Retrieved ${result.data.data.length} expenses`);

    const pagination = getPagination(result.data);
    logInfo(`Total items: ${pagination.totalItems}`);
    logInfo(`Total pages: ${pagination.totalPages}`);

    const checks = validatePagination(pagination, 1, 20);
    checks.forEach((check) => {
      if (check.pass) {
        logSuccess(`✓ ${check.name}: ${check.value}`);
      } else {
        logError(
          `✗ ${check.name}: expected ${check.expected}, got ${check.actual}`
        );
      }
    });
  } else {
    logError(`Failed: ${JSON.stringify(result.error)}`);
  }
}

async function test6_MaxLimit() {
  logSection(
    "TEST 6: Test MAX_LIMIT (requesting limit=150, should cap at 100)"
  );

  const result = await makeRequest(
    "GET",
    `/expenses?project_id=${TEST_PROJECT_ID}&limit=150`,
    TOKEN
  );

  if (result.success) {
    logSuccess(`Retrieved ${result.data.data.length} expenses`);
    logData(`Requested: limit=150`);

    const pagination = getPagination(result.data);
    if (pagination.itemsPerPage === 100) {
      logSuccess("✓ PASS: Limit capped at MAX_LIMIT (100)");
    } else {
      logError(`✗ FAIL: Expected limit 100, got ${pagination.itemsPerPage}`);
    }
  } else {
    logError(`Failed: ${JSON.stringify(result.error)}`);
  }
}

async function test7_NavigationFlags() {
  logSection("TEST 7: Navigation Flags - Test hasNextPage and hasPreviousPage");

  // Test first page
  const page1 = await makeRequest("GET", `/time-logs?page=1&limit=5`, TOKEN);

  if (page1.success) {
    const pagination1 = getPagination(page1.data);
    logInfo("Page 1:");

    if (pagination1.hasPreviousPage === false) {
      logSuccess("✓ Page 1: hasPreviousPage = false (correct)");
    } else {
      logError("✗ Page 1: hasPreviousPage should be false");
    }

    if (pagination1.totalPages > 1) {
      if (pagination1.hasNextPage === true) {
        logSuccess("✓ Page 1: hasNextPage = true (correct)");
      } else {
        logError("✗ Page 1: hasNextPage should be true when more pages exist");
      }
    }
  }

  // Test middle page (if exists)
  const page2 = await makeRequest("GET", `/time-logs?page=2&limit=5`, TOKEN);

  if (page2.success) {
    const pagination2 = getPagination(page2.data);

    if (pagination2.totalPages > 2) {
      logInfo("\nPage 2:");

      if (pagination2.hasPreviousPage === true) {
        logSuccess("✓ Page 2: hasPreviousPage = true (correct)");
      } else {
        logError("✗ Page 2: hasPreviousPage should be true");
      }

      if (pagination2.hasNextPage === true) {
        logSuccess("✓ Page 2: hasNextPage = true (correct)");
      } else {
        logError("✗ Page 2: hasNextPage should be true when more pages exist");
      }
    }
  }
}

async function test8_EmptyResults() {
  logSection("TEST 8: Empty Results - Pagination with no matches");

  const result = await makeRequest(
    "GET",
    `/time-logs?status=NONEXISTENT&page=1&limit=20`,
    TOKEN
  );

  if (result.success) {
    logInfo(`Retrieved ${result.data.data.length} logs`);

    if (result.data.data.length === 0) {
      logSuccess("✓ Empty array returned");
    } else {
      logError("✗ Should return empty array");
    }

    const pagination = getPagination(result.data);
    if (pagination.totalItems === 0) {
      logSuccess("✓ totalItems = 0");
    } else {
      logError("✗ totalItems should be 0");
    }

    if (pagination.totalPages === 0) {
      logSuccess("✓ totalPages = 0");
    } else {
      logError("✗ totalPages should be 0");
    }
  } else {
    logError(`Failed: ${JSON.stringify(result.error)}`);
  }
}

// ==============================================
// MAIN TEST RUNNER
// ==============================================

async function runAllTests() {
  log("\n🧪 PAGINATION FUNCTIONALITY TESTS\n", colors.blue);
  log("ℹ️  NOTE: Please restart server before running tests!\n", colors.cyan);

  try {
    await test1_TasksDefaultPagination();
    await test2_TasksCustomPagination();
    await test3_TimeLogsDefaultPagination();
    await test4_TimeLogsWithFilters();
    await test5_ExpensesDefault();
    await test6_MaxLimit();
    await test7_NavigationFlags();
    await test8_EmptyResults();

    logSection("TEST SUMMARY");
    logSuccess("All pagination tests completed!");
    logInfo("Review results above for any failures");
    log("");
  } catch (error) {
    logError(`\nUnexpected error: ${error.message}`);
    console.error(error);
  }
}

// Run tests
runAllTests();
