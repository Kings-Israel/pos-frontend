import ExcelJS from 'exceljs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const wb = new ExcelJS.Workbook()
wb.creator = 'POS API Spec Generator'
wb.created = new Date()
wb.modified = new Date()

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const COLORS = {
  headerBg: 'FF1E3A5F',   // dark blue
  headerFg: 'FFFFFFFF',
  sectionBg: 'FFD6E4F0',  // light blue
  sectionFg: 'FF1E3A5F',
  altRow:    'FFF5F9FF',
  white:     'FFFFFFFF',
  get:       'FFD4EDDA',  // green
  post:      'FFFDE8B4',  // yellow
  patch:     'FFFCE5CD',  // orange
  put:       'FFE8D5F5',  // purple
  delete:    'FFFBD9D9',  // red
  ws:        'FFD0EAF8',  // blue
  ok:        'FF28A745',
  warning:   'FFFD7E14',
  danger:    'FFDC3545',
}

function hdr(font = {}) {
  return {
    font: { bold: true, color: { argb: COLORS.headerFg }, size: 11, name: 'Calibri', ...font },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } },
    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
    border: {
      top:    { style: 'thin', color: { argb: 'FF999999' } },
      bottom: { style: 'thin', color: { argb: 'FF999999' } },
      left:   { style: 'thin', color: { argb: 'FF999999' } },
      right:  { style: 'thin', color: { argb: 'FF999999' } },
    },
  }
}

function cell(bgArgb, fgArgb = 'FF111111', extra = {}) {
  return {
    font: { size: 10, name: 'Calibri', color: { argb: fgArgb }, ...extra.font },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } },
    alignment: { vertical: 'middle', wrapText: true, ...extra.alignment },
    border: {
      top:    { style: 'hair', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'hair', color: { argb: 'FFCCCCCC' } },
      left:   { style: 'hair', color: { argb: 'FFCCCCCC' } },
      right:  { style: 'hair', color: { argb: 'FFCCCCCC' } },
    },
    ...extra,
  }
}

function methodColor(method) {
  switch (method) {
    case 'GET':    return COLORS.get
    case 'POST':   return COLORS.post
    case 'PATCH':  return COLORS.patch
    case 'PUT':    return COLORS.put
    case 'DELETE': return COLORS.delete
    case 'WS':     return COLORS.ws
    default:       return COLORS.white
  }
}

function addSectionRow(ws, label, colCount) {
  const r = ws.addRow([label])
  r.height = 22
  for (let c = 1; c <= colCount; c++) {
    const cel = r.getCell(c)
    cel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } }
    cel.font = { bold: true, color: { argb: COLORS.sectionFg }, size: 11, name: 'Calibri' }
    cel.alignment = { vertical: 'middle' }
  }
  if (colCount > 1) ws.mergeCells(r.number, 1, r.number, colCount)
  return r
}

// ─────────────────────────────────────────────
// SHEET 1 – API ENDPOINTS
// ─────────────────────────────────────────────
;(function buildEndpoints() {
  const ws = wb.addWorksheet('API Endpoints', { views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }] })

  ws.columns = [
    { key: 'group',       width: 16  },
    { key: 'method',      width: 9   },
    { key: 'path',        width: 40  },
    { key: 'auth',        width: 14  },
    { key: 'roles',       width: 30  },
    { key: 'description', width: 50  },
    { key: 'reqBody',     width: 55  },
    { key: 'reqParams',   width: 45  },
    { key: 'response',    width: 55  },
    { key: 'notes',       width: 45  },
  ]

  // Title row
  ws.mergeCells('A1:J1')
  const title = ws.getCell('A1')
  title.value = 'Bake & Brew POS — Backend API Specification'
  title.font = { bold: true, size: 14, color: { argb: COLORS.headerFg }, name: 'Calibri' }
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } }
  title.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 30

  // Header row
  const hdrs = ['Group', 'Method', 'Endpoint Path', 'Auth Required', 'Allowed Roles', 'Description', 'Request Body (JSON)', 'Path / Query Params', 'Success Response (200/201)', 'Notes']
  const hRow = ws.addRow(hdrs)
  hRow.height = 30
  hdrs.forEach((_, i) => Object.assign(hRow.getCell(i + 1), hdr()))

  const ENDPOINTS = [
    // ── AUTH ──
    ['AUTH', 'POST', '/api/auth/login',   'No',  'All',                       'Authenticate user. Returns JWT token + user profile.',
     '{\n  "email": "string",\n  "password": "string"\n}',
     '—',
     '{\n  "token": "string (JWT)",\n  "user": { id, name, email, role, avatar }\n}',
     'Store token in Authorization header for all subsequent requests. Passwords must be hashed (bcrypt). Rate-limit to 5 attempts/min.'],

    ['AUTH', 'POST', '/api/auth/logout',  'Yes', 'All',                       'Invalidate the current session token (server-side blacklist or short-lived JWT).',
     '—',
     '—',
     '{ "message": "Logged out" }',
     'If using stateless JWT, clearing client-side token is sufficient. For refresh-token pattern, call this endpoint.'],

    ['AUTH', 'GET',  '/api/auth/me',      'Yes', 'All',                       'Validate token and return current authenticated user.',
     '—',
     '—',
     '{ "user": { id, name, email, role, avatar } }',
     'Used by router guard on app load to restore session.'],

    // ── USERS ──
    ['USERS', 'GET',    '/api/users',        'Yes', 'admin',                      'List all system users.',
     '—',
     'query: ?role=admin|manager|waiter|kitchen|cashier',
     '{ "users": [ User[] ] }',
     'Admin-only. Can filter by role.'],

    ['USERS', 'POST',   '/api/users',        'Yes', 'admin',                      'Create a new POS user account.',
     '{\n  "name": "string",\n  "email": "string",\n  "password": "string",\n  "role": "admin|manager|waiter|kitchen|cashier",\n  "avatar": "string? (URL)"\n}',
     '—',
     '{ "user": User }',
     'Hash password before storing. Email must be unique.'],

    ['USERS', 'GET',    '/api/users/:id',    'Yes', 'admin, self',                'Get a single user by ID.',
     '—',
     'path: id (string)',
     '{ "user": User }',
     'A user can view their own profile; admins can view any.'],

    ['USERS', 'PATCH',  '/api/users/:id',    'Yes', 'admin, self',                'Update user details (name, email, role, avatar).',
     '{\n  "name"?: "string",\n  "email"?: "string",\n  "role"?: "UserRole",\n  "avatar"?: "string"\n}',
     'path: id (string)',
     '{ "user": User }',
     'Only admins can change roles. Self-update limited to name/avatar.'],

    ['USERS', 'PATCH',  '/api/users/:id/password', 'Yes', 'admin, self',           'Change a user\'s password.',
     '{\n  "currentPassword"?: "string",\n  "newPassword": "string"\n}',
     'path: id (string)',
     '{ "message": "Password updated" }',
     'currentPassword required for self-change; admins may omit it.'],

    ['USERS', 'DELETE', '/api/users/:id',    'Yes', 'admin',                      'Delete (or deactivate) a user account.',
     '—',
     'path: id (string)',
     '{ "message": "User deleted" }',
     'Prefer soft-delete (set active=false) to preserve audit trail.'],

    // ── MENU ──
    ['MENU', 'GET',    '/api/menu',                   'Yes', 'All',               'Return all categories and menu items (with modifiers).',
     '—',
     'query: ?categoryId=string, ?available=true|false',
     '{\n  "categories": Category[],\n  "items": MenuItem[]\n}',
     'Items include nested Modifier[] with ModifierOption[].'],

    ['MENU', 'GET',    '/api/menu/categories',         'Yes', 'All',               'List all menu categories.',
     '—',
     '—',
     '{ "categories": Category[] }',
     ''],

    ['MENU', 'POST',   '/api/menu/categories',         'Yes', 'admin, manager',     'Create a new menu category.',
     '{\n  "name": "string",\n  "color": "string (hex)",\n  "icon": "string"\n}',
     '—',
     '{ "category": Category }',
     ''],

    ['MENU', 'PATCH',  '/api/menu/categories/:id',     'Yes', 'admin, manager',     'Update an existing category.',
     '{\n  "name"?: "string",\n  "color"?: "string",\n  "icon"?: "string"\n}',
     'path: id (string)',
     '{ "category": Category }',
     ''],

    ['MENU', 'DELETE', '/api/menu/categories/:id',     'Yes', 'admin',             'Delete a category (only if no items assigned).',
     '—',
     'path: id (string)',
     '{ "message": "Category deleted" }',
     'Return 409 Conflict if category has existing items.'],

    ['MENU', 'GET',    '/api/menu/items/:id',          'Yes', 'All',               'Get a single menu item by ID.',
     '—',
     'path: id (string)',
     '{ "item": MenuItem }',
     ''],

    ['MENU', 'POST',   '/api/menu/items',              'Yes', 'admin, manager',     'Create a new menu item.',
     '{\n  "categoryId": "string",\n  "name": "string",\n  "description": "string",\n  "price": number,\n  "available": boolean,\n  "image"?: "string (URL)",\n  "modifiers"?: Modifier[]\n}',
     '—',
     '{ "item": MenuItem }',
     'modifiers is an array of { id, name, options: [{label, priceAdd}] }.'],

    ['MENU', 'PATCH',  '/api/menu/items/:id',          'Yes', 'admin, manager',     'Partially update a menu item.',
     '{\n  "name"?: "string",\n  "description"?: "string",\n  "price"?: number,\n  "available"?: boolean,\n  "image"?: "string",\n  "modifiers"?: Modifier[]\n}',
     'path: id (string)',
     '{ "item": MenuItem }',
     'Also triggers inventory re-link if modifiers change.'],

    ['MENU', 'DELETE', '/api/menu/items/:id',          'Yes', 'admin',             'Delete a menu item.',
     '—',
     'path: id (string)',
     '{ "message": "Item deleted" }',
     'Consider soft-delete to preserve historical order data.'],

    // ── TABLES ──
    ['TABLES', 'GET',   '/api/tables',              'Yes', 'All',                  'List all tables with current status.',
     '—',
     'query: ?section=string, ?status=available|occupied|reserved|cleaning',
     '{ "tables": Table[] }',
     ''],

    ['TABLES', 'POST',  '/api/tables',              'Yes', 'admin, manager',        'Create a new table.',
     '{\n  "number": number,\n  "capacity": number,\n  "section": "string"\n}',
     '—',
     '{ "table": Table }',
     ''],

    ['TABLES', 'GET',   '/api/tables/:id',          'Yes', 'All',                  'Get a single table.',
     '—',
     'path: id (string)',
     '{ "table": Table }',
     ''],

    ['TABLES', 'PATCH', '/api/tables/:id/status',   'Yes', 'All',                  'Update table status.',
     '{\n  "status": "available|occupied|reserved|cleaning",\n  "reservedFor"?: "string"\n}',
     'path: id (string)',
     '{ "table": Table }',
     'reservedFor is a guest name, required when status = reserved.'],

    ['TABLES', 'PATCH', '/api/tables/:id/assign',   'Yes', 'waiter, manager, admin','Assign an order to a table.',
     '{\n  "orderId": "string | null"\n}',
     'path: id (string)',
     '{ "table": Table }',
     'Pass null orderId to unassign. Table status auto-updates.'],

    ['TABLES', 'DELETE','/api/tables/:id',          'Yes', 'admin',                'Remove a table.',
     '—',
     'path: id (string)',
     '{ "message": "Table deleted" }',
     'Block if table has an active order.'],

    // ── ORDERS ──
    ['ORDERS', 'GET',   '/api/orders',                        'Yes', 'waiter, cashier, manager, admin', 'List orders (default: today\'s active orders).',
     '—',
     'query: ?status=draft|sent|preparing|ready|served|paid|cancelled\n?tableId=string\n?from=ISO8601\n?to=ISO8601\n?limit=number\n?offset=number',
     '{\n  "orders": Order[],\n  "total": number\n}',
     'Paginate for payment history page. Default limit 50.'],

    ['ORDERS', 'POST',  '/api/orders',                        'Yes', 'waiter, manager, admin',           'Create a new order (starts as "draft").',
     '{\n  "tableId"?: "string",\n  "notes"?: "string"\n}',
     '—',
     '{ "order": Order }',
     'serverId is inferred from the authenticated user token.'],

    ['ORDERS', 'GET',   '/api/orders/:id',                    'Yes', 'All',                              'Get a single order with all items.',
     '—',
     'path: id (string)',
     '{ "order": Order }',
     ''],

    ['ORDERS', 'POST',  '/api/orders/:id/items',              'Yes', 'waiter, manager, admin',           'Add an item to an order.',
     '{\n  "menuItemId": "string",\n  "quantity"?: number,\n  "modifiers"?: "string[]",\n  "notes"?: "string"\n}',
     'path: id (string)',
     '{ "order": Order }',
     'Default quantity = 1. Modifiers are label strings like "Extra Shot".'],

    ['ORDERS', 'PATCH', '/api/orders/:id/items/:itemId',      'Yes', 'waiter, manager, admin',           'Update quantity or notes for an order item.',
     '{\n  "quantity"?: number,\n  "notes"?: "string",\n  "modifiers"?: "string[]"\n}',
     'path: id, itemId (strings)',
     '{ "order": Order }',
     'Setting quantity to 0 removes the item.'],

    ['ORDERS', 'DELETE','/api/orders/:id/items/:itemId',      'Yes', 'waiter, manager, admin',           'Remove an item from an order.',
     '—',
     'path: id, itemId (strings)',
     '{ "order": Order }',
     ''],

    ['ORDERS', 'PATCH', '/api/orders/:id',                    'Yes', 'waiter, manager, admin',           'Update order-level fields (discount, tip, notes).',
     '{\n  "discount"?: number,\n  "tip"?: number,\n  "notes"?: "string"\n}',
     'path: id (string)',
     '{ "order": Order }',
     'discount and tip are absolute currency values, not percentages.'],

    ['ORDERS', 'PATCH', '/api/orders/:id/status',             'Yes', 'waiter, kitchen, cashier, manager, admin', 'Advance order through the status workflow.',
     '{\n  "status": "sent|preparing|ready|served|paid|cancelled"\n}',
     'path: id (string)',
     '{ "order": Order }',
     'Sending to "sent" creates a KitchenTicket. Role validation: kitchen can only set preparing/ready; waiter can set served; cashier can set paid.'],

    ['ORDERS', 'POST',  '/api/orders/:id/payment',            'Yes', 'cashier, manager, admin',          'Process payment for an order.',
     '{\n  "method": "cash|card|digital",\n  "amount": number\n}',
     'path: id (string)',
     '{\n  "order": Order,\n  "payment": PaymentRecord\n}',
     'amount should equal orderTotal (subtotal + tax + tip - discount). Change is calculated server-side. Order status auto-sets to "paid".'],

    // ── KITCHEN ──
    ['KITCHEN', 'GET',   '/api/kitchen/tickets',               'Yes', 'kitchen, manager, admin',          'List all active kitchen tickets (not yet served).',
     '—',
     'query: ?priority=normal|high',
     '{ "tickets": KitchenTicket[] }',
     'Sorted oldest-first. Poll every 5s or use WebSocket.'],

    ['KITCHEN', 'PATCH', '/api/kitchen/tickets/:id/items/:idx','Yes', 'kitchen, manager, admin',          'Update the status of a single item within a ticket.',
     '{\n  "status": "pending|preparing|ready"\n}',
     'path: id (string), idx (number)',
     '{ "ticket": KitchenTicket }',
     'idx is the zero-based array index of the item in the ticket.'],

    ['KITCHEN', 'PATCH', '/api/kitchen/tickets/:id/ready',     'Yes', 'kitchen, manager, admin',          'Mark all items in a ticket as ready (bulk action).',
     '—',
     'path: id (string)',
     '{ "ticket": KitchenTicket }',
     'Also triggers notification to waiter (WebSocket event or polling).'],

    ['KITCHEN', 'PATCH', '/api/kitchen/tickets/:id',           'Yes', 'kitchen, manager, admin',          'Update ticket-level priority.',
     '{\n  "priority": "normal|high"\n}',
     'path: id (string)',
     '{ "ticket": KitchenTicket }',
     ''],

    ['KITCHEN', 'WS',    'ws://…/ws/kitchen',                  'Yes', 'kitchen, waiter, manager',         'WebSocket channel for real-time kitchen events.',
     '—',
     '—',
     'Events:\n  ticket:new    → KitchenTicket\n  ticket:updated → KitchenTicket\n  ticket:ready   → { ticketId, orderId }',
     'Authenticate with token in connection query string: ?token=JWT. Falls back to polling /api/kitchen/tickets every 5s if WS unavailable.'],

    // ── PAYMENTS ──
    ['PAYMENTS', 'GET',  '/api/payments',              'Yes', 'cashier, manager, admin',   'List all payment transactions.',
     '—',
     'query: ?from=ISO8601\n?to=ISO8601\n?method=cash|card|digital\n?limit=number\n?offset=number',
     '{\n  "payments": PaymentRecord[],\n  "total": number\n}',
     ''],

    ['PAYMENTS', 'GET',  '/api/payments/:id',          'Yes', 'cashier, manager, admin',   'Get a single payment record.',
     '—',
     'path: id (string)',
     '{ "payment": PaymentRecord }',
     ''],

    ['PAYMENTS', 'POST', '/api/payments/:id/refund',   'Yes', 'manager, admin',            'Issue a full or partial refund.',
     '{\n  "amount": number,\n  "reason": "string"\n}',
     'path: id (string)',
     '{ "refund": RefundRecord }',
     'Updates the linked order status to "cancelled" on full refund.'],

    // ── INVENTORY ──
    ['INVENTORY', 'GET',   '/api/inventory',                'Yes', 'manager, admin',         'List all inventory items.',
     '—',
     'query: ?category=ingredient|beverage|packaging|cleaning\n?status=ok|low|critical|out',
     '{ "items": InventoryItem[] }',
     ''],

    ['INVENTORY', 'POST',  '/api/inventory',                'Yes', 'manager, admin',         'Create a new inventory item.',
     '{\n  "name": "string",\n  "category": "ingredient|beverage|packaging|cleaning",\n  "unit": "string",\n  "currentStock": number,\n  "minStock": number,\n  "maxStock": number,\n  "costPerUnit": number,\n  "supplier"?: "string",\n  "linkedMenuItems"?: [{ menuItemId, usagePerOrder }]\n}',
     '—',
     '{ "item": InventoryItem }',
     ''],

    ['INVENTORY', 'GET',   '/api/inventory/:id',            'Yes', 'manager, admin',         'Get a single inventory item.',
     '—',
     'path: id (string)',
     '{ "item": InventoryItem }',
     ''],

    ['INVENTORY', 'PATCH', '/api/inventory/:id',            'Yes', 'manager, admin',         'Update inventory item details.',
     '{\n  "name"?: "string",\n  "minStock"?: number,\n  "maxStock"?: number,\n  "costPerUnit"?: number,\n  "supplier"?: "string",\n  "linkedMenuItems"?: [{ menuItemId, usagePerOrder }]\n}',
     'path: id (string)',
     '{ "item": InventoryItem }',
     ''],

    ['INVENTORY', 'POST',  '/api/inventory/:id/restock',    'Yes', 'manager, admin',         'Add stock for an item.',
     '{\n  "quantity": number,\n  "notes"?: "string"\n}',
     'path: id (string)',
     '{ "item": InventoryItem, "movement": StockMovement }',
     'Records a StockMovement of type "restock".'],

    ['INVENTORY', 'POST',  '/api/inventory/:id/adjust',     'Yes', 'manager, admin',         'Manual stock adjustment (positive or negative).',
     '{\n  "quantity": number,\n  "type": "adjustment|waste",\n  "reason": "string"\n}',
     'path: id (string)',
     '{ "item": InventoryItem, "movement": StockMovement }',
     'Negative quantity for waste/shrinkage.'],

    ['INVENTORY', 'GET',   '/api/inventory/movements',      'Yes', 'manager, admin',         'List stock movement history.',
     '—',
     'query: ?itemId=string\n?type=deduction|restock|adjustment|waste\n?from=ISO8601\n?to=ISO8601\n?limit=number',
     '{ "movements": StockMovement[] }',
     'Movements are auto-created when orders are paid (deduction).'],

    // ── REPORTS ──
    ['REPORTS', 'GET', '/api/reports/daily',   'Yes', 'manager, admin', 'Daily sales summary with hourly breakdown, top items, and server stats.',
     '—',
     'query: ?date=YYYY-MM-DD (defaults to today)',
     '{\n  "summary": DailySales,\n  "hourly": HourlyDataPoint[],\n  "popularItems": PopularItem[],\n  "serverStats": ServerStat[]\n}',
     'DailySales includes paymentBreakdown by method.'],

    ['REPORTS', 'GET', '/api/reports/weekly',  'Yes', 'manager, admin', 'Weekly sales summary (7 days ending today or ?endDate).',
     '—',
     'query: ?endDate=YYYY-MM-DD',
     '{\n  "summary": WeeklySummary\n}',
     'WeeklySummary contains days[], totalRevenue, totalOrders, bestDay.'],

    ['REPORTS', 'GET', '/api/reports/monthly', 'Yes', 'manager, admin', 'Monthly aggregated report.',
     '—',
     'query: ?year=number&month=number (1-12)',
     '{\n  "weeks": WeeklySummary[],\n  "totals": DailySales\n}',
     'Optional stretch endpoint for future reporting needs.'],
  ]

  let rowIdx = 0
  let currentGroup = ''

  for (const ep of ENDPOINTS) {
    const [group, method, path2, auth, roles, desc, body, params, resp, notes] = ep

    if (group !== currentGroup) {
      addSectionRow(ws, `  ${group}`, 10)
      currentGroup = group
      rowIdx++
    }

    const row = ws.addRow([group, method, path2, auth, roles, desc, body, params, resp, notes])
    row.height = method === 'WS' ? 80 : 60

    const bg = rowIdx % 2 === 0 ? COLORS.white : COLORS.altRow

    // group col
    row.getCell(1).style = cell(bg, 'FF555555', { font: { italic: true, size: 9, name: 'Calibri' }, alignment: { horizontal: 'center', vertical: 'middle' } })
    // method col
    row.getCell(2).style = cell(methodColor(method), 'FF000000', { font: { bold: true, size: 10, name: 'Calibri', color: { argb: 'FF000000' } }, alignment: { horizontal: 'center', vertical: 'middle' } })
    // path col
    row.getCell(3).style = cell(bg, 'FF1A1A1A', { font: { name: 'Courier New', size: 9, color: { argb: 'FF1A1A1A' } }, alignment: { vertical: 'middle', wrapText: true } })
    // auth col
    row.getCell(4).style = cell(bg, 'FF333333', { alignment: { horizontal: 'center', vertical: 'middle' } })
    // roles
    row.getCell(5).style = cell(bg, 'FF333333', { alignment: { vertical: 'middle', wrapText: true } })
    // desc
    row.getCell(6).style = cell(bg, 'FF111111', { alignment: { vertical: 'middle', wrapText: true } })
    // req body
    row.getCell(7).style = cell(bg, 'FF2C3E50', { font: { name: 'Courier New', size: 8, color: { argb: 'FF2C3E50' } }, alignment: { vertical: 'top', wrapText: true } })
    // params
    row.getCell(8).style = cell(bg, 'FF2C3E50', { font: { name: 'Courier New', size: 8, color: { argb: 'FF2C3E50' } }, alignment: { vertical: 'top', wrapText: true } })
    // response
    row.getCell(9).style = cell(bg, 'FF27AE60', { font: { name: 'Courier New', size: 8, color: { argb: 'FF27AE60' } }, alignment: { vertical: 'top', wrapText: true } })
    // notes
    row.getCell(10).style = cell(bg, 'FF555555', { font: { italic: true, size: 9, name: 'Calibri' }, alignment: { vertical: 'top', wrapText: true } })

    rowIdx++
  }
})()

// ─────────────────────────────────────────────
// SHEET 2 – DATA MODELS
// ─────────────────────────────────────────────
;(function buildModels() {
  const ws = wb.addWorksheet('Data Models', { views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }] })

  ws.columns = [
    { key: 'model',       width: 20  },
    { key: 'field',       width: 25  },
    { key: 'type',        width: 22  },
    { key: 'required',    width: 11  },
    { key: 'example',     width: 30  },
    { key: 'description', width: 60  },
    { key: 'constraints', width: 45  },
  ]

  ws.mergeCells('A1:G1')
  const title = ws.getCell('A1')
  title.value = 'Bake & Brew POS — Data Models (Database Schema Reference)'
  title.font = { bold: true, size: 14, color: { argb: COLORS.headerFg }, name: 'Calibri' }
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } }
  title.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 30

  const hdrs2 = ['Model / Table', 'Field', 'Type', 'Required', 'Example Value', 'Description', 'Constraints / Notes']
  const hRow = ws.addRow(hdrs2)
  hRow.height = 30
  hdrs2.forEach((_, i) => Object.assign(hRow.getCell(i + 1), hdr()))

  const MODELS = [
    // USER
    ['User', 'id',         'string (UUID)',  'Yes', 'usr_01HXZ…',      'Primary key',                               'UUID v4. Generated server-side.'],
    ['User', 'name',       'string',         'Yes', 'Jane Smith',       'Display name',                              'max 100 chars'],
    ['User', 'email',      'string',         'Yes', 'jane@example.com', 'Login email',                               'Unique, lowercase, valid email format'],
    ['User', 'passwordHash','string',        'Yes', '$2b$10$…',         'bcrypt hash (not exposed in API)',           'Never returned in API responses'],
    ['User', 'role',       'enum',           'Yes', 'waiter',           'System role',                               'admin | manager | waiter | kitchen | cashier'],
    ['User', 'avatar',     'string (URL)',   'No',  'https://…/img.png','Profile picture URL',                       'Nullable'],
    ['User', 'active',     'boolean',        'Yes', 'true',             'Soft-delete flag',                          'Default true. Set false instead of hard deleting.'],
    ['User', 'createdAt',  'string (ISO)',   'Yes', '2025-01-10T08:00Z','Record creation timestamp',                 'Set automatically by DB'],
    ['User', 'updatedAt',  'string (ISO)',   'Yes', '2025-06-15T10:30Z','Last modification timestamp',               'Updated by DB trigger or ORM hook'],

    // CATEGORY
    ['Category', 'id',    'string (UUID)',   'Yes', 'cat_beverages',    'Primary key',                               'UUID v4'],
    ['Category', 'name',  'string',          'Yes', 'Beverages',        'Display name shown in POS',                 'max 50 chars, unique'],
    ['Category', 'color', 'string (hex)',    'Yes', '#3B82F6',          'Background color for category badge',       'CSS hex color, e.g. #RRGGBB'],
    ['Category', 'icon',  'string',          'Yes', 'Coffee',           'Lucide icon name',                          'Must match a valid lucide-vue-next icon key'],

    // MENUITEM
    ['MenuItem', 'id',           'string (UUID)',  'Yes', 'item_latte_001',   'Primary key',                        'UUID v4'],
    ['MenuItem', 'categoryId',   'string (UUID)',  'Yes', 'cat_beverages',    'FK → Category.id',                   'Must exist in categories table'],
    ['MenuItem', 'name',         'string',         'Yes', 'Caramel Latte',    'Item name on menu',                  'max 100 chars'],
    ['MenuItem', 'description',  'string',         'Yes', 'Espresso with…',   'Short description',                  'max 255 chars'],
    ['MenuItem', 'price',        'decimal(10,2)',  'Yes', '4.50',             'Base price in local currency',       '> 0'],
    ['MenuItem', 'available',    'boolean',        'Yes', 'true',             'Whether item is currently orderable','Default true'],
    ['MenuItem', 'image',        'string (URL)',   'No',  'https://…/img.jpg','Product image URL',                  'Nullable'],
    ['MenuItem', 'modifiers',    'JSON / relation','No',  '(see Modifier)',   'Customisation options',              'Stored as JSON array or separate Modifier table'],

    // MODIFIER
    ['Modifier', 'id',    'string (UUID)',   'Yes', 'mod_milk_type',    'Primary key',                               'UUID v4'],
    ['Modifier', 'menuItemId','string (UUID)','Yes','item_latte_001',   'FK → MenuItem.id',                          ''],
    ['Modifier', 'name',  'string',          'Yes', 'Milk Type',        'Modifier group label',                      'max 50 chars'],
    ['Modifier', 'options','JSON array',     'Yes', '[{label:"Oat",priceAdd:0.5}]','Array of ModifierOption',        'Each option: { label: string, priceAdd: decimal }'],

    // TABLE
    ['Table', 'id',           'string (UUID)', 'Yes', 'tbl_001',         'Primary key',                             'UUID v4'],
    ['Table', 'number',       'integer',       'Yes', '5',               'Physical table number',                   'Unique per location'],
    ['Table', 'capacity',     'integer',       'Yes', '4',               'Max seated guests',                       '1–50'],
    ['Table', 'section',      'string',        'Yes', 'Indoor',          'Area name',                               'e.g. Indoor, Outdoor, Bar'],
    ['Table', 'status',       'enum',          'Yes', 'available',       'Current state',                           'available | occupied | reserved | cleaning'],
    ['Table', 'currentOrderId','string (UUID)','No',  'ord_abc123',      'FK → Order.id (nullable)',                 'Set when occupied'],
    ['Table', 'reservedFor',  'string',        'No',  'Smith party',     'Guest name for reservation',              'Nullable; set when status = reserved'],

    // ORDER
    ['Order', 'id',         'string (UUID)', 'Yes', 'ord_abc123',       'Primary key',                             'UUID v4'],
    ['Order', 'tableId',    'string (UUID)', 'No',  'tbl_001',          'FK → Table.id (nullable for takeaway)',   'Nullable'],
    ['Order', 'tableName',  'string',        'No',  'Table 5',          'Denormalised table label for display',    'Computed from Table'],
    ['Order', 'serverId',   'string (UUID)', 'Yes', 'usr_jane',         'FK → User.id (the waiter)',               'Inferred from auth token'],
    ['Order', 'status',     'enum',          'Yes', 'draft',            'Workflow stage',                          'draft→sent→preparing→ready→served→paid|cancelled'],
    ['Order', 'discount',   'decimal(10,2)', 'Yes', '0.00',             'Absolute discount amount',                'Default 0, ≥ 0'],
    ['Order', 'tip',        'decimal(10,2)', 'Yes', '2.50',             'Tip amount',                              'Default 0, ≥ 0'],
    ['Order', 'notes',      'string',        'No',  'No onions',        'Order-level special instructions',        'Nullable, max 500 chars'],
    ['Order', 'createdAt',  'string (ISO)',  'Yes', '2025-06-15T12:00Z','Creation time',                           ''],
    ['Order', 'updatedAt',  'string (ISO)',  'Yes', '2025-06-15T12:30Z','Last update time',                        ''],

    // ORDER ITEM
    ['OrderItem', 'id',          'string (UUID)', 'Yes', 'oi_xyz789',     'Primary key',                           'UUID v4'],
    ['OrderItem', 'orderId',     'string (UUID)', 'Yes', 'ord_abc123',    'FK → Order.id',                         ''],
    ['OrderItem', 'menuItemId',  'string (UUID)', 'Yes', 'item_latte_001','FK → MenuItem.id',                      ''],
    ['OrderItem', 'name',        'string',        'Yes', 'Caramel Latte', 'Snapshot of name at time of order',     'Denormalised to preserve history'],
    ['OrderItem', 'price',       'decimal(10,2)', 'Yes', '4.50',          'Snapshot of base price',                'Denormalised'],
    ['OrderItem', 'quantity',    'integer',       'Yes', '2',             'Number of units ordered',               '≥ 1'],
    ['OrderItem', 'modifiers',   'JSON array',    'No',  '["Oat Milk","Extra Shot"]','Chosen modifier labels',     'Stored as string array'],
    ['OrderItem', 'notes',       'string',        'No',  'No whipped cream','Item-level special instructions',     'Nullable, max 255 chars'],

    // KITCHEN TICKET
    ['KitchenTicket', 'id',          'string (UUID)', 'Yes', 'kt_def456',     'Primary key',                       'UUID v4'],
    ['KitchenTicket', 'orderId',     'string (UUID)', 'Yes', 'ord_abc123',    'FK → Order.id',                     'One ticket per order (or per course)'],
    ['KitchenTicket', 'tableNumber', 'integer',       'No',  '5',             'Denormalised for KDS display',      'Nullable for takeaway'],
    ['KitchenTicket', 'priority',    'enum',          'Yes', 'normal',        'Urgency level',                     'normal | high'],
    ['KitchenTicket', 'createdAt',   'string (ISO)',  'Yes', '2025-06-15T12:05Z','When ticket was created',        ''],
    ['KitchenTicket', 'items',       'JSON / relation','Yes','(see KitchenTicketItem)','The items to prepare',     ''],

    // KITCHEN TICKET ITEM
    ['KitchenTicketItem','ticketId', 'string (UUID)', 'Yes', 'kt_def456',     'FK → KitchenTicket.id',             ''],
    ['KitchenTicketItem','name',     'string',        'Yes', 'Caramel Latte', 'Item name snapshot',                ''],
    ['KitchenTicketItem','quantity', 'integer',       'Yes', '2',             'Units to prepare',                  ''],
    ['KitchenTicketItem','modifiers','JSON array',    'No',  '["Oat Milk"]',  'Modifier labels',                   ''],
    ['KitchenTicketItem','notes',    'string',        'No',  'No whipped cream','Special instructions',            ''],
    ['KitchenTicketItem','status',   'enum',          'Yes', 'pending',       'Cooking progress',                  'pending | preparing | ready'],

    // PAYMENT RECORD
    ['PaymentRecord', 'id',        'string (UUID)', 'Yes', 'pay_ghi012',     'Primary key',                        'UUID v4'],
    ['PaymentRecord', 'orderId',   'string (UUID)', 'Yes', 'ord_abc123',     'FK → Order.id',                      ''],
    ['PaymentRecord', 'method',    'enum',          'Yes', 'card',           'Payment method used',                'cash | card | digital'],
    ['PaymentRecord', 'amount',    'decimal(10,2)', 'Yes', '22.80',          'Total charged',                      'Must equal orderTotal'],
    ['PaymentRecord', 'tip',       'decimal(10,2)', 'Yes', '2.50',           'Tip component (denormalised)',        ''],
    ['PaymentRecord', 'tax',       'decimal(10,2)', 'Yes', '1.60',           'Tax component',                      'Calculated at 8% server-side'],
    ['PaymentRecord', 'discount',  'decimal(10,2)', 'Yes', '0.00',           'Discount applied',                   ''],
    ['PaymentRecord', 'cashierId', 'string (UUID)', 'Yes', 'usr_cashier1',   'FK → User.id',                       'Inferred from auth token'],
    ['PaymentRecord', 'processedAt','string (ISO)', 'Yes', '2025-06-15T13:00Z','Payment timestamp',                ''],

    // INVENTORY ITEM
    ['InventoryItem', 'id',             'string (UUID)', 'Yes', 'inv_milk_001',  'Primary key',                    'UUID v4'],
    ['InventoryItem', 'name',           'string',        'Yes', 'Whole Milk',    'Item name',                      'max 100 chars'],
    ['InventoryItem', 'category',       'enum',          'Yes', 'ingredient',    'Inventory category',             'ingredient | beverage | packaging | cleaning'],
    ['InventoryItem', 'unit',           'string',        'Yes', 'litres',        'Measurement unit',               'e.g. litres, kg, units, boxes'],
    ['InventoryItem', 'currentStock',   'decimal(10,3)', 'Yes', '15.500',        'Current stock level',            '≥ 0'],
    ['InventoryItem', 'minStock',       'decimal(10,3)', 'Yes', '5.000',         'Low-stock alert threshold',      '> 0'],
    ['InventoryItem', 'maxStock',       'decimal(10,3)', 'Yes', '50.000',        'Maximum stocking capacity',      '> minStock'],
    ['InventoryItem', 'costPerUnit',    'decimal(10,4)', 'Yes', '0.9500',        'Cost price per unit',            '> 0'],
    ['InventoryItem', 'supplier',       'string',        'No',  'Dairy Farm Co', 'Supplier name',                  'Nullable, max 100 chars'],
    ['InventoryItem', 'linkedMenuItems','JSON',          'No',  '[{menuItemId,usagePerOrder}]','Menu items that consume this inventory','Array of { menuItemId: string, usagePerOrder: number }'],
    ['InventoryItem', 'lastUpdated',    'string (ISO)',  'Yes', '2025-06-15T07:00Z','Last stock change timestamp', ''],

    // STOCK MOVEMENT
    ['StockMovement', 'id',               'string (UUID)', 'Yes', 'mov_jkl345',   'Primary key',                  'UUID v4'],
    ['StockMovement', 'inventoryItemId',  'string (UUID)', 'Yes', 'inv_milk_001', 'FK → InventoryItem.id',         ''],
    ['StockMovement', 'inventoryItemName','string',        'Yes', 'Whole Milk',   'Denormalised name snapshot',    ''],
    ['StockMovement', 'type',             'enum',          'Yes', 'deduction',    'Movement type',                 'deduction | restock | adjustment | waste'],
    ['StockMovement', 'quantity',         'decimal(10,3)', 'Yes', '-1.500',       'Change amount (negative = out)','Use sign to indicate direction'],
    ['StockMovement', 'reason',           'string',        'Yes', 'Order #1023',  'Human-readable reason',         'max 255 chars'],
    ['StockMovement', 'orderId',          'string (UUID)', 'No',  'ord_abc123',   'FK → Order.id (for deductions)','Nullable'],
    ['StockMovement', 'performedBy',      'string (UUID)', 'Yes', 'usr_mgr01',    'FK → User.id',                  'Inferred from auth token'],
    ['StockMovement', 'timestamp',        'string (ISO)',  'Yes', '2025-06-15T13:05Z','When movement occurred',    ''],
  ]

  let lastModel = ''
  let rowIdx = 0

  for (const [model, field, type, req, example, desc, constraints] of MODELS) {
    if (model !== lastModel) {
      addSectionRow(ws, `  ${model}`, 7)
      lastModel = model
      rowIdx++
    }

    const row = ws.addRow([model, field, type, req, example, desc, constraints])
    row.height = 22

    const bg = rowIdx % 2 === 0 ? COLORS.white : COLORS.altRow
    const reqColor = req === 'Yes' ? 'FF28A745' : 'FFFD7E14'

    row.getCell(1).style = cell(bg, 'FF888888', { font: { italic: true, size: 9, name: 'Calibri' }, alignment: { horizontal: 'center', vertical: 'middle' } })
    row.getCell(2).style = cell(bg, 'FF1A1A1A', { font: { bold: true, name: 'Courier New', size: 9, color: { argb: 'FF1A1A1A' } }, alignment: { vertical: 'middle' } })
    row.getCell(3).style = cell(bg, 'FF1565C0', { font: { name: 'Courier New', size: 9, color: { argb: 'FF1565C0' } }, alignment: { vertical: 'middle' } })
    row.getCell(4).style = cell(bg, reqColor,   { font: { bold: true, size: 10, name: 'Calibri', color: { argb: reqColor } }, alignment: { horizontal: 'center', vertical: 'middle' } })
    row.getCell(5).style = cell(bg, 'FF555555', { font: { name: 'Courier New', size: 9, color: { argb: 'FF555555' } }, alignment: { vertical: 'middle' } })
    row.getCell(6).style = cell(bg, 'FF111111', { alignment: { vertical: 'middle', wrapText: true } })
    row.getCell(7).style = cell(bg, 'FF666666', { font: { italic: true, size: 9, name: 'Calibri', color: { argb: 'FF666666' } }, alignment: { vertical: 'middle', wrapText: true } })

    rowIdx++
  }
})()

// ─────────────────────────────────────────────
// SHEET 3 – AUTH & ROLES
// ─────────────────────────────────────────────
;(function buildAuth() {
  const ws = wb.addWorksheet('Auth & Roles')

  ws.columns = [
    { key: 'feature',  width: 40 },
    { key: 'admin',    width: 12 },
    { key: 'manager',  width: 12 },
    { key: 'waiter',   width: 12 },
    { key: 'kitchen',  width: 12 },
    { key: 'cashier',  width: 12 },
  ]

  ws.mergeCells('A1:F1')
  const title = ws.getCell('A1')
  title.value = 'Bake & Brew POS — Role-Based Access Control Matrix'
  title.font = { bold: true, size: 14, color: { argb: COLORS.headerFg }, name: 'Calibri' }
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } }
  title.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 30

  const hRow = ws.addRow(['Feature / Action', 'Admin', 'Manager', 'Waiter', 'Kitchen', 'Cashier'])
  hRow.height = 28
  ;['Feature / Action', 'Admin', 'Manager', 'Waiter', 'Kitchen', 'Cashier'].forEach((_, i) => Object.assign(hRow.getCell(i + 1), hdr()))

  const Y = '✓'
  const N = '—'
  const MATRIX = [
    // [feature, admin, manager, waiter, kitchen, cashier]
    ['─── AUTHENTICATION ───',       '',  '',  '',  '',  ''],
    ['Login / Logout',               Y,   Y,   Y,   Y,   Y],
    ['View own profile',             Y,   Y,   Y,   Y,   Y],
    ['─── USER MANAGEMENT ───',      '',  '',  '',  '',  ''],
    ['List all users',               Y,   N,   N,   N,   N],
    ['Create / Delete users',        Y,   N,   N,   N,   N],
    ['Edit any user',                Y,   N,   N,   N,   N],
    ['Edit own profile',             Y,   Y,   Y,   Y,   Y],
    ['─── MENU MANAGEMENT ───',      '',  '',  '',  '',  ''],
    ['View menu',                    Y,   Y,   Y,   Y,   Y],
    ['Create / Delete items & categories', Y, Y,  N,  N,  N],
    ['Edit items / toggle availability',   Y, Y,  N,  N,  N],
    ['─── TABLE MANAGEMENT ───',     '',  '',  '',  '',  ''],
    ['View tables',                  Y,   Y,   Y,   N,   N],
    ['Create / Delete tables',       Y,   Y,   N,   N,   N],
    ['Update table status',          Y,   Y,   Y,   N,   N],
    ['Assign order to table',        Y,   Y,   Y,   N,   N],
    ['─── ORDER MANAGEMENT ───',     '',  '',  '',  '',  ''],
    ['View orders',                  Y,   Y,   Y,   N,   Y],
    ['Create new order',             Y,   Y,   Y,   N,   N],
    ['Add / remove items',           Y,   Y,   Y,   N,   N],
    ['Apply discount / tip',         Y,   Y,   N,   N,   N],
    ['Send order to kitchen',        Y,   Y,   Y,   N,   N],
    ['Cancel order',                 Y,   Y,   Y,   N,   N],
    ['─── KITCHEN ───',              '',  '',  '',  '',  ''],
    ['View kitchen tickets',         Y,   Y,   N,   Y,   N],
    ['Update item / ticket status',  Y,   Y,   N,   Y,   N],
    ['Set ticket priority',          Y,   Y,   N,   Y,   N],
    ['─── PAYMENTS ───',             '',  '',  '',  '',  ''],
    ['Process payment',              Y,   Y,   N,   N,   Y],
    ['View payment history',         Y,   Y,   N,   N,   Y],
    ['Issue refund',                 Y,   Y,   N,   N,   N],
    ['─── INVENTORY ───',            '',  '',  '',  '',  ''],
    ['View inventory',               Y,   Y,   N,   N,   N],
    ['Add / edit inventory items',   Y,   Y,   N,   N,   N],
    ['Restock / adjust stock',       Y,   Y,   N,   N,   N],
    ['View movement history',        Y,   Y,   N,   N,   N],
    ['─── REPORTS ───',              '',  '',  '',  '',  ''],
    ['Daily / weekly reports',       Y,   Y,   N,   N,   N],
    ['Server performance stats',     Y,   Y,   N,   N,   N],
  ]

  for (const [feature, admin, manager, waiter, kitchen, cashier] of MATRIX) {
    const isSection = feature.startsWith('───')
    const row = ws.addRow([feature, admin, manager, waiter, kitchen, cashier])
    row.height = isSection ? 22 : 18

    if (isSection) {
      for (let c = 1; c <= 6; c++) {
        const cel = row.getCell(c)
        cel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } }
        cel.font = { bold: true, color: { argb: COLORS.sectionFg }, size: 10, name: 'Calibri' }
        cel.alignment = { vertical: 'middle' }
      }
    } else {
      row.getCell(1).style = cell(COLORS.white, 'FF111111', { alignment: { vertical: 'middle' } })
      for (let c = 2; c <= 6; c++) {
        const val = row.getCell(c).value
        const isY = val === Y
        row.getCell(c).style = cell(
          isY ? 'FFD4EDDA' : 'FFFDF0F0',
          isY ? 'FF155724' : 'FFAAAAAA',
          { font: { bold: isY, size: 12, name: 'Calibri', color: { argb: isY ? 'FF155724' : 'FFAAAAAA' } }, alignment: { horizontal: 'center', vertical: 'middle' } }
        )
      }
    }
  }
})()

// ─────────────────────────────────────────────
// SHEET 4 – BUSINESS RULES
// ─────────────────────────────────────────────
;(function buildRules() {
  const ws = wb.addWorksheet('Business Rules')

  ws.columns = [
    { key: 'area',    width: 22 },
    { key: 'rule',    width: 55 },
    { key: 'formula', width: 55 },
    { key: 'notes',   width: 45 },
  ]

  ws.mergeCells('A1:D1')
  const title = ws.getCell('A1')
  title.value = 'Bake & Brew POS — Business Logic & Calculation Rules'
  title.font = { bold: true, size: 14, color: { argb: COLORS.headerFg }, name: 'Calibri' }
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } }
  title.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 30

  const hRow = ws.addRow(['Area', 'Rule', 'Formula / Condition', 'Implementation Notes'])
  hRow.height = 28
  ;['Area', 'Rule', 'Formula / Condition', 'Implementation Notes'].forEach((_, i) => Object.assign(hRow.getCell(i + 1), hdr()))

  const RULES = [
    ['Order Pricing',  'Subtotal',              'subtotal = Σ (item.price × item.quantity)',                              'Sum of all OrderItem (price × quantity). Modifier priceAdd values already included in item.price snapshot.'],
    ['Order Pricing',  'Discount',              'discountedSubtotal = subtotal - discount',                              'discount is an absolute value in currency. Validate: discount ≤ subtotal.'],
    ['Order Pricing',  'Tax (GST/VAT)',          'tax = discountedSubtotal × 0.08',                                     'Tax rate = 8%. Store rate in config, not hardcoded. Calculate server-side; client displays result.'],
    ['Order Pricing',  'Tip',                   'Tip entered as absolute amount',                                       'Frontend allows % shortcuts (e.g. 10%, 15%) but sends absolute value to API.'],
    ['Order Pricing',  'Order Total',           'total = discountedSubtotal + tax + tip',                               'This is the amount charged in /payment. Validate that payment.amount ≈ total (±0.01 for rounding).'],
    ['Order Workflow', 'Status transitions',    'draft → sent → preparing → ready → served → paid\n         └─────────────────────────────────────→ cancelled',  'Only forward transitions allowed (except cancelled which can come from any non-paid state). Validate on PATCH /orders/:id/status.'],
    ['Order Workflow', 'Kitchen ticket creation','Ticket created when status changes draft → sent',                     'Copy order items into KitchenTicket. Set all KitchenTicketItem.status = pending.'],
    ['Order Workflow', 'Stock deduction',       'Deduct inventory when status changes to paid',                         'Use InventoryItem.linkedMenuItems[].usagePerOrder × OrderItem.quantity. Log StockMovement type="deduction".'],
    ['Inventory',      'Stock status: out',     'currentStock = 0',                                                     'Display as "Out of Stock". Auto-set linked MenuItem.available = false.'],
    ['Inventory',      'Stock status: critical','currentStock ≤ minStock',                                              'Send alert (email/push). Show red badge in UI.'],
    ['Inventory',      'Stock status: low',     'currentStock ≤ minStock × 1.5',                                       'Show orange badge. No auto-action required.'],
    ['Inventory',      'Stock status: ok',      'currentStock > minStock × 1.5',                                       'Show green badge.'],
    ['Inventory',      'Restock upper bound',   'After restock, currentStock ≤ maxStock',                              'Warn (but allow) if restock would exceed maxStock.'],
    ['Reports',        'Daily report date',     '?date=YYYY-MM-DD, defaults to current server date',                   'Aggregate all paid orders for that date. Group by hour for hourly breakdown.'],
    ['Reports',        'Popular items ranking', 'ORDER BY quantitySold DESC LIMIT 10',                                  'Only count items from paid orders in the date range.'],
    ['Reports',        'Server stats',          'Group paid orders by serverId; calc SUM(total), COUNT, AVG, SUM(tip)', 'Used in Reports view server performance table.'],
    ['Reports',        'Weekly report',         'Last 7 calendar days ending on ?endDate (default today)',             'Returns DailySales per day + aggregated totals.'],
    ['Payments',       'Change calculation',    'change = payment.amount - orderTotal (cash payments only)',           'Return change field in payment response for cash POS display.'],
    ['Payments',       'Refund',                'Full refund: amount = original payment amount',                       'Partial refunds allowed if amount ≤ original. Update Order.status = cancelled on full refund.'],
    ['Tables',         'Table auto-status',     'When order assigned → status = occupied\nWhen order unassigned → status = available', 'Handle in PATCH /tables/:id/assign server-side.'],
    ['Security',       'JWT expiry',            'Token expires after 8 hours (configurable)',                           'Use refresh-token pattern for long shifts. Store secret in env var.'],
    ['Security',       'Role enforcement',      'Check role on every protected route',                                  'Return 403 Forbidden (not 404) when role is insufficient.'],
    ['Security',       'Rate limiting',         '5 login attempts per IP per minute',                                   'Return 429 Too Many Requests with Retry-After header.'],
  ]

  for (const [area, rule, formula, notes] of RULES) {
    const row = ws.addRow([area, rule, formula, notes])
    row.height = formula.includes('\n') ? 46 : 30

    row.getCell(1).style = cell(COLORS.sectionBg, COLORS.sectionFg, { font: { bold: true, size: 10, name: 'Calibri', color: { argb: COLORS.sectionFg } }, alignment: { horizontal: 'center', vertical: 'middle', wrapText: true } })
    row.getCell(2).style = cell(COLORS.white, 'FF111111', { font: { bold: true, size: 10, name: 'Calibri' }, alignment: { vertical: 'middle', wrapText: true } })
    row.getCell(3).style = cell(COLORS.altRow, 'FF1A237E', { font: { name: 'Courier New', size: 9, color: { argb: 'FF1A237E' } }, alignment: { vertical: 'top', wrapText: true } })
    row.getCell(4).style = cell(COLORS.white, 'FF555555', { font: { italic: true, size: 9, name: 'Calibri' }, alignment: { vertical: 'top', wrapText: true } })
  }
})()

// ─────────────────────────────────────────────
// SHEET 5 – ERROR CODES
// ─────────────────────────────────────────────
;(function buildErrors() {
  const ws = wb.addWorksheet('Error Codes')

  ws.columns = [
    { key: 'code',    width: 14 },
    { key: 'status',  width: 30 },
    { key: 'trigger', width: 55 },
    { key: 'body',    width: 50 },
  ]

  ws.mergeCells('A1:D1')
  const title = ws.getCell('A1')
  title.value = 'Bake & Brew POS — Standard API Error Responses'
  title.font = { bold: true, size: 14, color: { argb: COLORS.headerFg }, name: 'Calibri' }
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } }
  title.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 30

  const hRow = ws.addRow(['HTTP Code', 'Status Text', 'When Triggered', 'Response Body Shape'])
  hRow.height = 28
  ;['HTTP Code', 'Status Text', 'When Triggered', 'Response Body Shape'].forEach((_, i) => Object.assign(hRow.getCell(i + 1), hdr()))

  const ERRORS = [
    ['200', 'OK',                    'Successful read or update',                            '{ "data": … }'],
    ['201', 'Created',               'Resource successfully created',                        '{ "data": … }'],
    ['204', 'No Content',            'Successful delete with no body',                       '(empty body)'],
    ['400', 'Bad Request',           'Missing required field, invalid type, failed validation','{ "error": "string", "details": { field: msg } }'],
    ['401', 'Unauthorized',          'No token, invalid token, or expired token',            '{ "error": "Unauthorized" }'],
    ['403', 'Forbidden',             'Valid token but insufficient role for the action',     '{ "error": "Forbidden" }'],
    ['404', 'Not Found',             'Resource does not exist (or soft-deleted)',             '{ "error": "Not found" }'],
    ['409', 'Conflict',              'Duplicate email on user create; deleting category with items; paying an already-paid order', '{ "error": "Conflict", "details": "…" }'],
    ['422', 'Unprocessable Entity',  'Business rule violation (e.g. discount > subtotal, invalid status transition)', '{ "error": "…", "details": "…" }'],
    ['429', 'Too Many Requests',     'Rate limit exceeded (login endpoint)',                 '{ "error": "Too many requests" } + Retry-After header'],
    ['500', 'Internal Server Error', 'Unhandled server exception',                           '{ "error": "Internal server error" } — never expose stack trace in production'],
  ]

  const codeColor = (code) => {
    if (code.startsWith('2')) return COLORS.get
    if (code.startsWith('4')) return COLORS.patch
    return COLORS.delete
  }

  for (const [code, status, trigger, body] of ERRORS) {
    const row = ws.addRow([code, status, trigger, body])
    row.height = 28

    const bg = codeColor(code)
    row.getCell(1).style = cell(bg, 'FF000000', { font: { bold: true, size: 12, name: 'Courier New', color: { argb: 'FF000000' } }, alignment: { horizontal: 'center', vertical: 'middle' } })
    row.getCell(2).style = cell(bg, 'FF000000', { font: { bold: true, size: 10, name: 'Calibri' }, alignment: { vertical: 'middle' } })
    row.getCell(3).style = cell(COLORS.white, 'FF333333', { alignment: { vertical: 'middle', wrapText: true } })
    row.getCell(4).style = cell(COLORS.altRow, 'FF1A1A1A', { font: { name: 'Courier New', size: 9, color: { argb: 'FF1A1A1A' } }, alignment: { vertical: 'middle', wrapText: true } })
  }
})()

// ─────────────────────────────────────────────
// SAVE
// ─────────────────────────────────────────────
const outPath = path.join(__dirname, 'POS_Backend_API_Spec.xlsx')
await wb.xlsx.writeFile(outPath)
console.log(`✅  Saved → ${outPath}`)
