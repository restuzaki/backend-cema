const { hasPermission } = require("./policies/abacPolicies");
const ROLES = require("./config/roles");

console.log("\n====== FULL PERMISSION VERIFICATION ======\n");

// --- MOCK DATA FACTORIES ---
const mockUser = (role, id = "u1") => ({ id, role });

const mockProject = ({
  manager_id = "manager1",
  client_id = "client1",
  team_members = [],
  budget = 500000,
} = {}) => ({
  id: "proj1",
  manager_id,
  client_id,
  team_members,
  financials: { budget_total: budget },
});

// --- SCENARIOS ---
const scenarios = [
  // ================= ADMIN =================
  {
    role: ROLES.ADMIN,
    action: "create",
    desc: "Admin can CREATE project",
    expected: true,
  },
  {
    role: ROLES.ADMIN,
    action: "view",
    desc: "Admin can VIEW any project",
    project: mockProject(),
    expected: true,
  },
  {
    role: ROLES.ADMIN,
    action: "update",
    desc: "Admin can UPDATE any project (even big budget)",
    project: mockProject({ budget: 99999999 }),
    expected: true,
  },
  {
    role: ROLES.ADMIN,
    action: "delete",
    desc: "Admin can DELETE any project",
    project: mockProject(),
    expected: true,
  },

  // ================= PROJECT MANAGER =================
  {
    role: ROLES.PROJECT_MANAGER,
    id: "pm1",
    action: "create",
    desc: "Manager can CREATE project",
    expected: true,
  },
  {
    role: ROLES.PROJECT_MANAGER,
    id: "pm1",
    action: "view",
    desc: "Manager can VIEW OWN project",
    project: mockProject({ manager_id: "pm1" }),
    expected: true,
  },
  {
    role: ROLES.PROJECT_MANAGER,
    id: "pm1",
    action: "view",
    desc: "Manager CANNOT VIEW OTHER project",
    project: mockProject({ manager_id: "other" }),
    expected: false,
  },
  {
    role: ROLES.PROJECT_MANAGER,
    id: "pm1",
    action: "update",
    desc: "Manager can UPDATE OWN project (Small Budget)",
    project: mockProject({ manager_id: "pm1", budget: 900000 }),
    expected: true,
  },
  {
    role: ROLES.PROJECT_MANAGER,
    id: "pm1",
    action: "update",
    desc: "Manager CANNOT UPDATE OWN project (Big Budget > 1M)",
    project: mockProject({ manager_id: "pm1", budget: 1500000 }),
    expected: false,
  },
  {
    role: ROLES.PROJECT_MANAGER,
    id: "pm1",
    action: "update",
    desc: "Manager CANNOT UPDATE OTHER project",
    project: mockProject({ manager_id: "other", budget: 100 }),
    expected: false,
  },
  {
    role: ROLES.PROJECT_MANAGER,
    id: "pm1",
    action: "delete",
    desc: "Manager CANNOT DELETE project (even own)",
    project: mockProject({ manager_id: "pm1" }),
    expected: false,
  },

  // ================= TEAM MEMBER =================
  {
    role: ROLES.TEAM_MEMBER,
    id: "team1",
    action: "create",
    desc: "Team Member CANNOT CREATE project",
    expected: false,
  },
  {
    role: ROLES.TEAM_MEMBER,
    id: "team1",
    action: "view",
    desc: "Team Member can VIEW ASSIGNED project",
    project: mockProject({ team_members: ["team1", "other"] }),
    expected: true,
  },
  {
    role: ROLES.TEAM_MEMBER,
    id: "team1",
    action: "view",
    desc: "Team Member CANNOT VIEW UNASSIGNED project",
    project: mockProject({ team_members: ["other"] }),
    expected: false,
  },
  {
    role: ROLES.TEAM_MEMBER,
    id: "team1",
    action: "update",
    desc: "Team Member CANNOT UPDATE project",
    project: mockProject({ team_members: ["team1"] }),
    expected: false,
  },
  {
    role: ROLES.TEAM_MEMBER,
    id: "team1",
    action: "delete",
    desc: "Team Member CANNOT DELETE project",
    project: mockProject({ team_members: ["team1"] }),
    expected: false,
  },

  // ================= CLIENT =================
  {
    role: ROLES.CLIENT,
    id: "client1",
    action: "create",
    desc: "Client can CREATE project (Request)",
    expected: true,
  },
  {
    role: ROLES.CLIENT,
    id: "client1",
    action: "view",
    desc: "Client can VIEW OWN project",
    project: mockProject({ client_id: "client1" }),
    expected: true,
  },
  {
    role: ROLES.CLIENT,
    id: "client1",
    action: "view",
    desc: "Client CANNOT VIEW OTHER project",
    project: mockProject({ client_id: "other" }),
    expected: false,
  },
  {
    role: ROLES.CLIENT,
    id: "client1",
    action: "update",
    desc: "Client CANNOT UPDATE project",
    project: mockProject({ client_id: "client1" }),
    expected: false,
  },
  {
    role: ROLES.CLIENT,
    id: "client1",
    action: "delete",
    desc: "Client CANNOT DELETE project",
    project: mockProject({ client_id: "client1" }),
    expected: false,
  },
];

// --- EXECUTION ---
let passedCount = 0;
let failedCount = 0;

console.log(
  "Role".padEnd(15) +
    "| Action".padEnd(10) +
    "| Result".padEnd(8) +
    "| Scenario"
);
console.log("-".repeat(80));

scenarios.forEach((s) => {
  const user = mockUser(s.role, s.id);
  const result = hasPermission(user, "projects", s.action, s.project);
  const passed = result === s.expected;

  if (passed) passedCount++;
  else failedCount++;

  const status = passed ? "✅ PASS" : "❌ FAIL";
  console.log(
    `${s.role.padEnd(15)} | ${s.action.padEnd(10)} | ${status.padEnd(8)} | ${
      s.desc
    }`
  );

  if (!passed) {
    console.log(`   Expect: ${s.expected}, Got: ${result}`);
  }
});

console.log("-".repeat(80));
if (failedCount === 0) {
  console.log(`\n🎉 SUCCESS: All ${passedCount} checks passed.`);
} else {
  console.error(`\n🔥 FAILURE: ${failedCount} checks failed.`);
  process.exit(1);
}
