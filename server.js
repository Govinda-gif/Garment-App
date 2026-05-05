const express = require("express");
const { createServer: createViteServer } = require("vite");
const path = require("path");
const fs = require("fs");

const USERS_FILE = path.join(process.cwd(), "users.json");
const GROUPS_FILE = path.join(process.cwd(), "groups.json");
const WORK_FILE = path.join(process.cwd(), "work_entries.json");
const EARNINGS_FILE = path.join(process.cwd(), "earnings.json");
const ADVANCES_FILE = path.join(process.cwd(), "advances.json");
const TASKS_FILE = path.join(process.cwd(), "tasks.json");

const DEFAULT_USERS = [
  {
    uid: "admin-uid",
    loginId: "ADMIN",
    password: "ADMIN123",
    name: "System Admin",
    role: "admin",
    status: "active",
    email: "admin@milijuli.com",
  },
];

function getData(file, defaultData) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
  }
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function saveData(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // ================= AUTH =================
  app.post("/api/login", (req, res) => {
    const { loginId, password } = req.body;
    const users = getData(USERS_FILE, DEFAULT_USERS);

    const user = users.find(
      (u) =>
        u.loginId?.toLowerCase() === loginId?.toLowerCase() &&
        u.password === password
    );

    if (user) {
      const { password, ...safeUser } = user;
      res.json({ success: true, user: safeUser });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // ================= USERS =================
  app.get("/api/admin/users", (req, res) => {
    const users = getData(USERS_FILE, DEFAULT_USERS).map(
      ({ password, ...u }) => u
    );
    res.json(users);
  });

  app.post("/api/admin/create-user", (req, res) => {
    const { loginId, password, name, role, groupId, earningWeight } = req.body;
    const users = getData(USERS_FILE, DEFAULT_USERS);

    if (users.find((u) => u.loginId === loginId)) {
      return res.status(400).json({ error: "Login ID exists" });
    }

    const newUser = {
      uid: Date.now().toString(),
      loginId,
      password,
      name,
      role,
      groupId: groupId || null,
      earningWeight: earningWeight || 1,
      status: "active",
      email: `${loginId.toLowerCase()}@milijuli.com`,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveData(USERS_FILE, users);

    res.json({ success: true, user: newUser });
  });

  app.patch("/api/admin/users/:uid", (req, res) => {
    const { uid } = req.params;
    const users = getData(USERS_FILE, DEFAULT_USERS);
    const index = users.findIndex((u) => u.uid === uid);

    if (index === -1) {
      return res.status(404).json({ error: "User not found" });
    }

    users[index] = { ...users[index], ...req.body };
    saveData(USERS_FILE, users);

    res.json({ success: true });
  });

  app.delete("/api/admin/users/:uid", (req, res) => {
    const { uid } = req.params;
    let users = getData(USERS_FILE, DEFAULT_USERS);

    users = users.filter((u) => u.uid !== uid);
    saveData(USERS_FILE, users);

    res.json({ success: true });
  });

  // ================= GROUPS =================
  app.get("/api/admin/groups", (req, res) => {
    res.json(getData(GROUPS_FILE, []));
  });

  app.post("/api/admin/groups", (req, res) => {
    const groups = getData(GROUPS_FILE, []);

    const newGroup = {
      ...req.body,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    groups.push(newGroup);
    saveData(GROUPS_FILE, groups);

    res.json(newGroup);
  });

  app.patch("/api/admin/groups/:id", (req, res) => {
    const { id } = req.params;
    const groups = getData(GROUPS_FILE, []);
    const index = groups.findIndex((g) => g.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Group not found" });
    }

    groups[index] = { ...groups[index], ...req.body };
    saveData(GROUPS_FILE, groups);

    res.json({ success: true });
  });

  app.delete("/api/admin/groups/:id", (req, res) => {
    const { id } = req.params;
    let groups = getData(GROUPS_FILE, []);

    groups = groups.filter((g) => g.id !== id);
    saveData(GROUPS_FILE, groups);

    res.json({ success: true });
  });

  // ================= WORK =================
  app.post("/api/work", (req, res) => {
    const work = getData(WORK_FILE, []);

    const newEntry = {
      ...req.body,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    work.push(newEntry);
    saveData(WORK_FILE, work);

    res.json(newEntry);
  });

  app.get("/api/work", (req, res) => {
    res.json(getData(WORK_FILE, []));
  });

  app.get("/api/work/item-names", (req, res) => {
    const entries = getData(WORK_FILE, []);
    const names = new Set();

    entries.forEach((entry) => {
      entry.items?.forEach((item) => {
        if (item.name) names.add(item.name);
      });
    });

    res.json([...names]);
  });

  app.put("/api/work/:id", (req, res) => {
    const { id } = req.params;
    const work = getData(WORK_FILE, []);
    const index = work.findIndex((w) => w.id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Not found" });
    }

    work[index] = {
      ...work[index],
      ...req.body.entry,
      updatedAt: new Date().toISOString(),
    };

    saveData(WORK_FILE, work);

    res.json({ success: true });
  });

  // ================= EARNINGS =================
  app.post("/api/earnings", (req, res) => {
    const earnings = getData(EARNINGS_FILE, []);

    const newEarning = {
      ...req.body,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    earnings.push(newEarning);
    saveData(EARNINGS_FILE, earnings);

    res.json(newEarning);
  });

  // ================= ADVANCES =================
  app.post("/api/advances", (req, res) => {
    const advances = getData(ADVANCES_FILE, []);

    const newAdvance = {
      ...req.body,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    advances.push(newAdvance);
    saveData(ADVANCES_FILE, advances);

    res.json(newAdvance);
  });

  app.delete("/api/advances/:id", (req, res) => {
    const { id } = req.params;
    let advances = getData(ADVANCES_FILE, []);

    advances = advances.filter((a) => a.id !== id);
    saveData(ADVANCES_FILE, advances);

    res.json({ success: true });
  });

  // ================= TASKS =================
  app.get("/api/tasks", (req, res) => {
    const { uid } = req.query;

    const tasks = getData(TASKS_FILE, [
      {
        id: "1",
        title: "Complete Shift Log",
        status: "pending",
        priority: "high",
        assignedTo: uid,
      },
    ]);

    res.json(tasks.filter((t) => t.assignedTo === uid));
  });

  // ================= START =================
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();