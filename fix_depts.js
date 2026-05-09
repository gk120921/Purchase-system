const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./backend/procurement.db');

const depts = [
    { id: 1, code: "1000", name: "India Factory", parent: null, manager: "Tai-Chang Chen" },
    { id: 2, code: "1100", name: "Administration Dept.", parent: 1, manager: "Chih-Kao Ku" },
    { id: 3, code: "1200", name: "Quality Assurance Dept.", parent: 1, manager: "Ku Chih-Kao" },
    { id: 4, code: "1300", name: "Production Dept.", parent: 1, manager: "Yi-Chang" },
    { id: 5, code: "1110", name: "Finance Section", parent: 2, manager: "Malar" },
    { id: 6, code: "1120", name: "Purchasing Section", parent: 2, manager: "Joseph" },
    { id: 7, code: "1130", name: "HR & Admin Section", parent: 2, manager: "Godson" },
    { id: 8, code: "1210", name: "QA Section", parent: 3, manager: "Local" },
    { id: 9, code: "1211", name: "QA Group", parent: 8, manager: null },
    { id: 10, code: "1212", name: "System Group", parent: 8, manager: null },
    { id: 11, code: "1310", name: "Terminal Section", parent: 4, manager: "Bill" },
    { id: 12, code: "1311", name: "Stamping Group", parent: 11, manager: null },
    { id: 13, code: "1312", name: "Welding Group", parent: 11, manager: null },
    { id: 14, code: "1313", name: "Plastic Group", parent: 11, manager: null },
    { id: 15, code: "1314", name: "Assembly Group", parent: 11, manager: null },
    { id: 16, code: "1320", name: "Assembly Section", parent: 4, manager: "Yi-Chang" },
    { id: 17, code: "1321", name: "Dispatch Group", parent: 16, manager: null },
    { id: 18, code: "1322", name: "Warehouse Group", parent: 16, manager: null },
    { id: 19, code: "1330", name: "EV Charger Gun Section", parent: 4, manager: "Yi-Chang" },
    { id: 20, code: "1331", name: "EV Charger Gun Group", parent: 19, manager: null }
];

db.serialize(() => {
    db.run('DELETE FROM departments');
    const stmt = db.prepare('INSERT INTO departments (id, dept_code, name, parent_id, manager) VALUES (?, ?, ?, ?, ?)');
    depts.forEach(d => {
        stmt.run(d.id, d.code, d.name, d.parent, d.manager);
    });
    stmt.finalize();
    console.log('Success: Hierarchy re-linked correctly.');
});
db.close();
