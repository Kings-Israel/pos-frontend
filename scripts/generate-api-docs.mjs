import * as XLSX from 'xlsx'

// ─── HELPERS ────────────────────────────────────────────────────────────────

function makeSheet(rows) {
  const ws = XLSX.utils.aoa_to_sheet(rows)
  return ws
}

function setColWidths(ws, widths) {
  ws['!cols'] = widths.map(w => ({ wch: w }))
}

// ─── SHEET 1: OVERVIEW ──────────────────────────────────────────────────────

const overviewRows = [
  ['POS System — Backend API & Data Specification'],
  [],
  ['Project', 'Restaurant Point-of-Sale (POS)'],
  ['Frontend Stack', 'Vue 3, TypeScript, Pinia, Vue Router, Tailwind CSS'],
  ['Document Purpose', 'Defines all data models and REST API endpoints required for backend integration'],
  ['Base URL Convention', '/api/v1'],
  ['Auth Mechanism', 'JWT Bearer token (Authorization: Bearer <token>)'],
  ['Content-Type', 'application/json'],
  ['Tax Rate', '8% applied to subtotal after discounts'],
  [],
  ['MODULES'],
  ['#', 'Module', 'Description'],
  ['1', 'Authentication', 'Login, logout, session validation, role-based access'],
  ['2', 'Users', 'User CRUD, role management'],
  ['3', 'Menu', 'Categories and menu items with modifiers'],
  ['4', 'Orders', 'Order lifecycle from draft to paid/cancelled'],
  ['5', 'Tables', 'Table status and section management'],
  ['6', 'Kitchen', 'Kitchen ticket display and item status tracking'],
  ['7', 'Payments', 'Payment records, history, and reconciliation'],
  ['8', 'Reports', 'Daily, weekly, and analytical reporting'],
  [],
  ['USER ROLES & PERMISSIONS'],
  ['Role', 'Default Route', 'Allowed Modules'],
  ['admin', '/users', 'All modules'],
  ['manager', '/reports', 'Dashboard, Orders, Tables, Kitchen, Menu, Reports, Payments, Users'],
  ['waiter', '/orders', 'Dashboard, Orders, Tables'],
  ['kitchen', '/kitchen', 'Kitchen'],
  ['cashier', '/payments', 'Dashboard, Orders, Payments'],
]

const overviewWS = makeSheet(overviewRows)
setColWidths(overviewWS, [6, 28, 60])

// ─── SHEET 2: DATA MODELS ───────────────────────────────────────────────────

const modelsRows = [
  ['DATA MODELS'],
  [],

  // ── User
  ['ENTITY: User'],
  ['Field', 'Type', 'Required', 'Description', 'Example / Constraints'],
  ['id', 'string (UUID)', 'Yes', 'Unique identifier', 'uuid v4'],
  ['name', 'string', 'Yes', 'Full display name', 'John Smith'],
  ['email', 'string', 'Yes', 'Login email, unique', 'admin@pos.com'],
  ['password', 'string', 'Yes (write-only)', 'Hashed password — never returned in responses', 'bcrypt hash'],
  ['role', 'enum', 'Yes', 'Access role', 'admin | manager | waiter | kitchen | cashier'],
  ['avatar', 'string (URL)', 'No', 'Profile image URL', 'https://...'],
  ['isActive', 'boolean', 'Yes', 'Whether user can log in', 'true'],
  ['lastLogin', 'string (ISO 8601)', 'No', 'Timestamp of last successful login', '2024-01-15T10:30:00Z'],
  ['createdAt', 'string (ISO 8601)', 'Yes', 'Record creation timestamp', '2024-01-01T00:00:00Z'],
  ['updatedAt', 'string (ISO 8601)', 'Yes', 'Record last-updated timestamp', '2024-01-01T00:00:00Z'],
  [],

  // ── Category
  ['ENTITY: Category (Menu)'],
  ['Field', 'Type', 'Required', 'Description', 'Example / Constraints'],
  ['id', 'string (UUID)', 'Yes', 'Unique identifier', 'uuid v4'],
  ['name', 'string', 'Yes', 'Category display name', 'Beverages'],
  ['color', 'string', 'Yes', 'Hex color for UI badge', '#3B82F6'],
  ['icon', 'string', 'Yes', 'Emoji icon for UI', '☕'],
  ['sortOrder', 'integer', 'No', 'Display order', '1'],
  [],

  // ── ModifierOption
  ['ENTITY: ModifierOption (embedded in Modifier)'],
  ['Field', 'Type', 'Required', 'Description', 'Example / Constraints'],
  ['label', 'string', 'Yes', 'Option display name', 'Large'],
  ['priceAdd', 'number', 'Yes', 'Additional price for this option (0 = no charge)', '1.50'],
  [],

  // ── Modifier
  ['ENTITY: Modifier (embedded in MenuItem)'],
  ['Field', 'Type', 'Required', 'Description', 'Example / Constraints'],
  ['id', 'string (UUID)', 'Yes', 'Unique identifier', 'uuid v4'],
  ['name', 'string', 'Yes', 'Modifier group name', 'Size'],
  ['options', 'ModifierOption[]', 'Yes', 'Available choices', 'See ModifierOption'],
  [],

  // ── MenuItem
  ['ENTITY: MenuItem'],
  ['Field', 'Type', 'Required', 'Description', 'Example / Constraints'],
  ['id', 'string (UUID)', 'Yes', 'Unique identifier', 'uuid v4'],
  ['categoryId', 'string (UUID)', 'Yes', 'FK → Category.id', 'uuid v4'],
  ['name', 'string', 'Yes', 'Item display name', 'Espresso'],
  ['description', 'string', 'No', 'Short description', 'Rich double shot espresso'],
  ['price', 'number', 'Yes', 'Base price in dollars', '3.50'],
  ['available', 'boolean', 'Yes', 'Whether item can be ordered', 'true'],
  ['image', 'string (URL)', 'No', 'Item photo URL', 'https://...'],
  ['modifiers', 'Modifier[]', 'Yes', 'List of modifier groups (empty array if none)', '[]'],
  ['createdAt', 'string (ISO 8601)', 'Yes', 'Record creation timestamp', '2024-01-01T00:00:00Z'],
  ['updatedAt', 'string (ISO 8601)', 'Yes', 'Record last-updated timestamp', '2024-01-01T00:00:00Z'],
  [],

  // ── Table
  ['ENTITY: Table'],
  ['Field', 'Type', 'Required', 'Description', 'Example / Constraints'],
  ['id', 'string (UUID)', 'Yes', 'Unique identifier', 'uuid v4'],
  ['number', 'integer', 'Yes', 'Table number shown in UI', '1–99'],
  ['capacity', 'integer', 'Yes', 'Seating capacity', '2 | 4 | 6 | 8'],
  ['status', 'enum', 'Yes', 'Current status', 'available | occupied | reserved | cleaning'],
  ['currentOrderId', 'string (UUID)', 'No', 'FK → Order.id — set when occupied', 'uuid v4 or null'],
  ['reservedFor', 'string', 'No', 'Guest name / reservation note', 'Smith party of 4'],
  ['section', 'string', 'Yes', 'Physical section', 'Indoor | Outdoor | Bar'],
  [],

  // ── OrderItem
  ['ENTITY: OrderItem (embedded in Order)'],
  ['Field', 'Type', 'Required', 'Description', 'Example / Constraints'],
  ['id', 'string (UUID)', 'Yes', 'Unique line-item identifier', 'uuid v4'],
  ['menuItemId', 'string (UUID)', 'Yes', 'FK → MenuItem.id', 'uuid v4'],
  ['name', 'string', 'Yes', 'Snapshot of item name at time of order', 'Espresso'],
  ['price', 'number', 'Yes', 'Unit price including modifier additions at time of order', '4.00'],
  ['quantity', 'integer', 'Yes', 'Number of units', '≥ 1'],
  ['modifiers', 'string[]', 'Yes', 'Selected modifier option labels', '["Large", "Oat Milk"]'],
  ['notes', 'string', 'No', 'Free-text kitchen note for this line item', 'Extra hot'],
  [],

  // ── Order
  ['ENTITY: Order'],
  ['Field', 'Type', 'Required', 'Description', 'Example / Constraints'],
  ['id', 'string (UUID)', 'Yes', 'Unique identifier (e.g. ORD-XXXX)', 'ORD-1234'],
  ['tableId', 'string (UUID)', 'No', 'FK → Table.id — null for takeaway/bar orders', 'uuid v4 or null'],
  ['tableName', 'string', 'No', 'Denormalized table label for display', 'Table 3'],
  ['items', 'OrderItem[]', 'Yes', 'Line items', 'See OrderItem'],
  ['status', 'enum', 'Yes', 'Lifecycle stage', 'draft | sent | preparing | ready | served | paid | cancelled'],
  ['serverId', 'string (UUID)', 'Yes', 'FK → User.id — staff member who created the order', 'uuid v4'],
  ['discount', 'number', 'Yes', 'Discount amount in dollars (computed from %) — default 0', '5.00'],
  ['tip', 'number', 'Yes', 'Tip amount in dollars — default 0', '8.00'],
  ['notes', 'string', 'No', 'Order-level kitchen/special instructions', 'Nut allergy at table'],
  ['createdAt', 'string (ISO 8601)', 'Yes', 'Record creation timestamp', '2024-01-15T18:30:00Z'],
  ['updatedAt', 'string (ISO 8601)', 'Yes', 'Record last-updated timestamp', '2024-01-15T19:00:00Z'],
  [],

  // ── Payment
  ['ENTITY: Payment'],
  ['Field', 'Type', 'Required', 'Description', 'Example / Constraints'],
  ['id', 'string (UUID)', 'Yes', 'Unique identifier', 'uuid v4'],
  ['orderId', 'string (UUID)', 'Yes', 'FK → Order.id', 'uuid v4'],
  ['method', 'enum', 'Yes', 'Payment method', 'cash | card | digital'],
  ['amount', 'number', 'Yes', 'Total charged (subtotal + tax + tip - discount)', '42.50'],
  ['subtotal', 'number', 'Yes', 'Sum of items before tax and discount', '35.00'],
  ['tax', 'number', 'Yes', '8% tax on subtotalAfterDiscount', '2.72'],
  ['tip', 'number', 'Yes', 'Tip component', '5.00'],
  ['discount', 'number', 'Yes', 'Discount component', '0.00'],
  ['change', 'number', 'No', 'Cash change returned to customer (cash payments only)', '7.50'],
  ['status', 'enum', 'Yes', 'Payment state', 'completed | refunded | pending'],
  ['processedBy', 'string (UUID)', 'Yes', 'FK → User.id — cashier who processed', 'uuid v4'],
  ['processedAt', 'string (ISO 8601)', 'Yes', 'Payment timestamp', '2024-01-15T19:05:00Z'],
  [],

  // ── KitchenTicket
  ['ENTITY: KitchenTicket'],
  ['Field', 'Type', 'Required', 'Description', 'Example / Constraints'],
  ['id', 'string (UUID)', 'Yes', 'Unique identifier', 'uuid v4'],
  ['orderId', 'string (UUID)', 'Yes', 'FK → Order.id', 'uuid v4'],
  ['tableNumber', 'integer', 'No', 'Denormalized table number — null for takeaway', '3'],
  ['items', 'KitchenTicketItem[]', 'Yes', 'Items to prepare', 'See KitchenTicketItem'],
  ['priority', 'enum', 'Yes', 'Urgency flag', 'normal | high'],
  ['createdAt', 'string (ISO 8601)', 'Yes', 'Ticket creation timestamp', '2024-01-15T18:30:00Z'],
  [],

  // ── KitchenTicketItem
  ['ENTITY: KitchenTicketItem (embedded in KitchenTicket)'],
  ['Field', 'Type', 'Required', 'Description', 'Example / Constraints'],
  ['name', 'string', 'Yes', 'Menu item name snapshot', 'Ribeye Steak'],
  ['quantity', 'integer', 'Yes', 'Units to prepare', '≥ 1'],
  ['modifiers', 'string[]', 'Yes', 'Selected modifiers', '["Medium Rare", "Mushroom Sauce"]'],
  ['notes', 'string', 'No', 'Special preparation note', 'No pepper'],
  ['status', 'enum', 'Yes', 'Preparation stage', 'pending | preparing | ready'],
  [],

  // ── Reports
  ['ENTITY: DailySales (Report)'],
  ['Field', 'Type', 'Required', 'Description', 'Example / Constraints'],
  ['date', 'string (YYYY-MM-DD)', 'Yes', 'Report date', '2024-01-15'],
  ['totalRevenue', 'number', 'Yes', 'Sum of all paid order totals', '1250.00'],
  ['totalOrders', 'integer', 'Yes', 'Count of paid orders', '42'],
  ['averageOrderValue', 'number', 'Yes', 'totalRevenue / totalOrders', '29.76'],
  ['totalTax', 'number', 'Yes', 'Sum of tax collected', '88.20'],
  ['totalTips', 'number', 'Yes', 'Sum of tips received', '187.50'],
  ['totalDiscounts', 'number', 'Yes', 'Sum of discounts applied', '32.00'],
  ['paymentBreakdown.cash', 'number', 'Yes', 'Revenue from cash payments', '312.50'],
  ['paymentBreakdown.card', 'number', 'Yes', 'Revenue from card payments', '750.00'],
  ['paymentBreakdown.digital', 'number', 'Yes', 'Revenue from digital payments', '187.50'],
  [],

  ['ENTITY: HourlyDataPoint (embedded in DailySales)'],
  ['Field', 'Type', 'Required', 'Description', 'Example / Constraints'],
  ['hour', 'string (HH:00)', 'Yes', 'Hour label', '12:00'],
  ['sales', 'number', 'Yes', 'Revenue in that hour', '320.00'],
  ['orders', 'integer', 'Yes', 'Orders in that hour', '11'],
  [],

  ['ENTITY: PopularItem (Report)'],
  ['Field', 'Type', 'Required', 'Description', 'Example / Constraints'],
  ['rank', 'integer', 'Yes', 'Position in popularity ranking', '1'],
  ['menuItemId', 'string (UUID)', 'Yes', 'FK → MenuItem.id', 'uuid v4'],
  ['name', 'string', 'Yes', 'Item name snapshot', 'Margherita Pizza'],
  ['category', 'string', 'Yes', 'Category name snapshot', 'Mains'],
  ['quantitySold', 'integer', 'Yes', 'Units sold in period', '47'],
  ['revenue', 'number', 'Yes', 'Revenue generated', '658.00'],
  [],

  ['ENTITY: ServerStat (Report — per staff member)'],
  ['Field', 'Type', 'Required', 'Description', 'Example / Constraints'],
  ['serverId', 'string (UUID)', 'Yes', 'FK → User.id', 'uuid v4'],
  ['name', 'string', 'Yes', 'Staff member name', 'Maria Lopez'],
  ['ordersServed', 'integer', 'Yes', 'Orders attributed to this server', '18'],
  ['totalSales', 'number', 'Yes', 'Revenue from their orders', '540.00'],
  ['averageOrderValue', 'number', 'Yes', 'totalSales / ordersServed', '30.00'],
  ['tipsEarned', 'number', 'Yes', 'Tips from their orders', '81.00'],
  [],

  ['ENTITY: WeeklySummary (Report)'],
  ['Field', 'Type', 'Required', 'Description', 'Example / Constraints'],
  ['startDate', 'string (YYYY-MM-DD)', 'Yes', 'Start of reporting week', '2024-01-08'],
  ['endDate', 'string (YYYY-MM-DD)', 'Yes', 'End of reporting week', '2024-01-14'],
  ['days', 'DailySales[]', 'Yes', 'One DailySales entry per day', '7 entries'],
  ['totalRevenue', 'number', 'Yes', 'Sum across all days', '8750.00'],
  ['totalOrders', 'integer', 'Yes', 'Sum across all days', '294'],
  ['bestDay', 'string (YYYY-MM-DD)', 'Yes', 'Date with highest revenue', '2024-01-13'],
]

const modelsWS = makeSheet(modelsRows)
setColWidths(modelsWS, [32, 22, 12, 52, 36])

// ─── SHEET 3: API ENDPOINTS ──────────────────────────────────────────────────

const H = ['Module', 'Method', 'Endpoint', 'Auth Required', 'Roles Allowed', 'Description', 'Request Body / Query Params', 'Success Response', 'Error Codes']

const apiRows = [
  ['API ENDPOINTS  (Base: /api/v1)'],
  [],
  H,

  // ── AUTH
  ['Authentication', 'POST', '/auth/login', 'No', 'All', 'Authenticate user and return JWT token', 'Body: { email: string, password: string }', '200: { token: string, user: User }', '400 Invalid body | 401 Bad credentials'],
  ['Authentication', 'POST', '/auth/logout', 'Yes', 'All', 'Invalidate current JWT token', 'None', '204 No Content', '401 Unauthorized'],
  ['Authentication', 'GET', '/auth/me', 'Yes', 'All', 'Return currently authenticated user profile', 'None', '200: User', '401 Unauthorized'],
  ['Authentication', 'POST', '/auth/refresh', 'Yes', 'All', 'Refresh JWT token before expiry', 'Body: { refreshToken: string }', '200: { token: string, refreshToken: string }', '401 Expired | 400 Invalid token'],
  [],

  // ── USERS
  ['Users', 'GET', '/users', 'Yes', 'admin, manager', 'List all users with optional search filter', 'Query: ?search=string&role=enum&isActive=boolean&page=int&limit=int', '200: { data: User[], total: int, page: int, limit: int }', '401 | 403 Forbidden'],
  ['Users', 'POST', '/users', 'Yes', 'admin', 'Create a new user', 'Body: { name, email, password, role, avatar? }', '201: User', '400 Validation | 409 Email exists | 401 | 403'],
  ['Users', 'GET', '/users/:id', 'Yes', 'admin, manager', 'Get single user by ID', 'Path: id (UUID)', '200: User', '401 | 403 | 404 Not Found'],
  ['Users', 'PUT', '/users/:id', 'Yes', 'admin', 'Full update of a user record', 'Body: { name, email, role, avatar?, isActive }', '200: User', '400 | 401 | 403 | 404 | 409'],
  ['Users', 'PATCH', '/users/:id', 'Yes', 'admin', 'Partial update (e.g. role or isActive only)', 'Body: Partial<User> (password excluded)', '200: User', '400 | 401 | 403 | 404'],
  ['Users', 'DELETE', '/users/:id', 'Yes', 'admin', 'Delete a user (prevent deleting own account)', 'Path: id (UUID)', '204 No Content', '400 Cannot delete self | 401 | 403 | 404'],
  ['Users', 'PATCH', '/users/:id/password', 'Yes', 'admin, self', 'Change user password', 'Body: { currentPassword?: string, newPassword: string }', '204 No Content', '400 | 401 | 403 | 404'],
  [],

  // ── MENU - CATEGORIES
  ['Menu', 'GET', '/menu/categories', 'Yes', 'All', 'List all menu categories ordered by sortOrder', 'None', '200: Category[]', '401'],
  ['Menu', 'POST', '/menu/categories', 'Yes', 'admin, manager', 'Create a new category', 'Body: { name, color, icon, sortOrder? }', '201: Category', '400 | 401 | 403'],
  ['Menu', 'PUT', '/menu/categories/:id', 'Yes', 'admin, manager', 'Update a category', 'Body: { name, color, icon, sortOrder? }', '200: Category', '400 | 401 | 403 | 404'],
  ['Menu', 'DELETE', '/menu/categories/:id', 'Yes', 'admin', 'Delete a category (reject if items exist)', 'Path: id (UUID)', '204 No Content', '400 Category has items | 401 | 403 | 404'],

  // ── MENU - ITEMS
  ['Menu', 'GET', '/menu/items', 'Yes', 'All', 'List menu items with optional filters', 'Query: ?categoryId=uuid&available=boolean&search=string', '200: MenuItem[]', '401'],
  ['Menu', 'POST', '/menu/items', 'Yes', 'admin, manager', 'Create a new menu item', 'Body: { categoryId, name, description?, price, available, image?, modifiers[] }', '201: MenuItem', '400 | 401 | 403'],
  ['Menu', 'GET', '/menu/items/:id', 'Yes', 'All', 'Get single menu item by ID', 'Path: id (UUID)', '200: MenuItem', '401 | 404'],
  ['Menu', 'PUT', '/menu/items/:id', 'Yes', 'admin, manager', 'Full update of a menu item', 'Body: { categoryId, name, description?, price, available, image?, modifiers[] }', '200: MenuItem', '400 | 401 | 403 | 404'],
  ['Menu', 'PATCH', '/menu/items/:id', 'Yes', 'admin, manager', 'Partial update (e.g. toggle available)', 'Body: Partial<MenuItem> (e.g. { available: false })', '200: MenuItem', '400 | 401 | 403 | 404'],
  ['Menu', 'DELETE', '/menu/items/:id', 'Yes', 'admin', 'Delete a menu item', 'Path: id (UUID)', '204 No Content', '401 | 403 | 404'],
  ['Menu', 'POST', '/menu/items/:id/image', 'Yes', 'admin, manager', 'Upload or replace item image', 'Body: multipart/form-data — field: image (file)', '200: { imageUrl: string }', '400 Invalid file | 401 | 403 | 404'],
  [],

  // ── ORDERS
  ['Orders', 'GET', '/orders', 'Yes', 'admin, manager, waiter, cashier', 'List orders with filters', 'Query: ?status=enum&tableId=uuid&serverId=uuid&date=YYYY-MM-DD&page=int&limit=int', '200: { data: Order[], total: int, page: int, limit: int }', '401 | 403'],
  ['Orders', 'POST', '/orders', 'Yes', 'admin, manager, waiter', 'Create a new draft order', 'Body: { tableId?: uuid, notes?: string }', '201: Order (status: draft)', '400 | 401 | 403'],
  ['Orders', 'GET', '/orders/:id', 'Yes', 'admin, manager, waiter, cashier', 'Get full order detail', 'Path: id', '200: Order', '401 | 403 | 404'],
  ['Orders', 'PATCH', '/orders/:id', 'Yes', 'admin, manager, waiter', 'Update order metadata (discount, tip, notes)', 'Body: { discount?: number, tip?: number, notes?: string }', '200: Order', '400 | 401 | 403 | 404'],
  ['Orders', 'POST', '/orders/:id/items', 'Yes', 'admin, manager, waiter', 'Add a line item to an order', 'Body: { menuItemId, quantity, modifiers: string[], notes? }', '200: Order (updated)', '400 | 401 | 403 | 404 | 409 Item unavailable'],
  ['Orders', 'PATCH', '/orders/:id/items/:itemId', 'Yes', 'admin, manager, waiter', 'Update item quantity or notes', 'Body: { quantity?: int, notes?: string }', '200: Order (updated)', '400 | 401 | 403 | 404'],
  ['Orders', 'DELETE', '/orders/:id/items/:itemId', 'Yes', 'admin, manager, waiter', 'Remove a line item from an order', 'Path: id, itemId', '200: Order (updated)', '401 | 403 | 404'],
  ['Orders', 'PATCH', '/orders/:id/status', 'Yes', 'admin, manager, waiter, kitchen', 'Transition order status', 'Body: { status: enum } — valid transitions: draft→sent, sent→preparing, preparing→ready, ready→served', '200: Order (updated)', '400 Invalid transition | 401 | 403 | 404'],
  ['Orders', 'POST', '/orders/:id/payment', 'Yes', 'admin, manager, cashier', 'Process payment and close order (status→paid)', 'Body: { method: "cash"|"card"|"digital", amount: number }', '200: { order: Order, payment: Payment }', '400 | 401 | 403 | 404 | 409 Already paid'],
  ['Orders', 'PATCH', '/orders/:id/cancel', 'Yes', 'admin, manager', 'Cancel an order (status→cancelled)', 'Body: { reason?: string }', '200: Order (status: cancelled)', '400 Cannot cancel paid order | 401 | 403 | 404'],
  [],

  // ── TABLES
  ['Tables', 'GET', '/tables', 'Yes', 'All', 'List all tables with optional filters', 'Query: ?section=string&status=enum', '200: Table[]', '401'],
  ['Tables', 'POST', '/tables', 'Yes', 'admin', 'Create a new table', 'Body: { number, capacity, section, status? }', '201: Table', '400 | 401 | 403 | 409 Number exists'],
  ['Tables', 'GET', '/tables/:id', 'Yes', 'All', 'Get single table by ID', 'Path: id', '200: Table', '401 | 404'],
  ['Tables', 'PATCH', '/tables/:id/status', 'Yes', 'admin, manager, waiter', 'Update table status', 'Body: { status: enum, reservedFor?: string }', '200: Table', '400 | 401 | 403 | 404'],
  ['Tables', 'PATCH', '/tables/:id/assign', 'Yes', 'admin, manager, waiter', 'Assign an order to this table (sets status→occupied)', 'Body: { orderId: uuid }', '200: Table', '400 Table not available | 401 | 403 | 404'],
  ['Tables', 'PATCH', '/tables/:id/release', 'Yes', 'admin, manager, waiter', 'Release a table from an order (sets status→cleaning)', 'None', '200: Table', '400 | 401 | 403 | 404'],
  ['Tables', 'PUT', '/tables/:id', 'Yes', 'admin', 'Full update of a table record', 'Body: { number, capacity, section }', '200: Table', '400 | 401 | 403 | 404'],
  ['Tables', 'DELETE', '/tables/:id', 'Yes', 'admin', 'Delete a table (reject if occupied)', 'Path: id', '204 No Content', '400 Table occupied | 401 | 403 | 404'],
  [],

  // ── KITCHEN
  ['Kitchen', 'GET', '/kitchen/tickets', 'Yes', 'admin, manager, kitchen', 'List active (non-paid/cancelled) kitchen tickets', 'Query: ?priority=enum&status=enum', '200: KitchenTicket[]', '401 | 403'],
  ['Kitchen', 'GET', '/kitchen/tickets/:id', 'Yes', 'admin, manager, kitchen', 'Get single ticket detail', 'Path: id', '200: KitchenTicket', '401 | 403 | 404'],
  ['Kitchen', 'PATCH', '/kitchen/tickets/:id/priority', 'Yes', 'admin, manager, kitchen', 'Update ticket urgency', 'Body: { priority: "normal"|"high" }', '200: KitchenTicket', '400 | 401 | 403 | 404'],
  ['Kitchen', 'PATCH', '/kitchen/tickets/:id/items/:index', 'Yes', 'admin, manager, kitchen', 'Cycle a single item status (pending→preparing→ready)', 'Body: { status: "pending"|"preparing"|"ready" }', '200: KitchenTicket', '400 | 401 | 403 | 404'],
  ['Kitchen', 'PATCH', '/kitchen/tickets/:id/ready', 'Yes', 'admin, manager, kitchen', 'Mark all items on a ticket as ready', 'None', '200: KitchenTicket (all items status: ready)', '401 | 403 | 404'],
  ['Kitchen', 'WebSocket', 'ws://host/kitchen/stream', 'Yes (token in query)', 'admin, manager, kitchen', 'Real-time ticket updates — receive new tickets and status changes as JSON events', 'Event types: ticket.created | ticket.updated | ticket.completed', 'Stream of KitchenTicket JSON messages', '—'],
  [],

  // ── PAYMENTS
  ['Payments', 'GET', '/payments', 'Yes', 'admin, manager, cashier', 'List payment records with filters', 'Query: ?method=enum&status=enum&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&orderId=string&page=int&limit=int', '200: { data: Payment[], total: int, page: int, limit: int }', '401 | 403'],
  ['Payments', 'GET', '/payments/:id', 'Yes', 'admin, manager, cashier', 'Get single payment by ID', 'Path: id', '200: Payment', '401 | 403 | 404'],
  ['Payments', 'POST', '/payments/:id/refund', 'Yes', 'admin, manager', 'Refund a payment (sets status→refunded)', 'Body: { reason?: string, amount?: number (partial refund) }', '200: Payment (status: refunded)', '400 Already refunded | 401 | 403 | 404'],
  ['Payments', 'GET', '/payments/:id/receipt', 'Yes', 'admin, manager, cashier', 'Generate receipt data for a payment', 'Path: id', '200: { receiptHtml: string } or PDF blob', '401 | 403 | 404'],
  [],

  // ── REPORTS
  ['Reports', 'GET', '/reports/daily', 'Yes', 'admin, manager', 'Get full daily report including hourly data, popular items, server stats', 'Query: ?date=YYYY-MM-DD (defaults to today)', '200: { dailySales: DailySales, hourlyData: HourlyDataPoint[], popularItems: PopularItem[], serverStats: ServerStat[] }', '400 Invalid date | 401 | 403'],
  ['Reports', 'GET', '/reports/weekly', 'Yes', 'admin, manager', 'Get 7-day rolling weekly summary', 'Query: ?endDate=YYYY-MM-DD (defaults to today)', '200: WeeklySummary', '400 | 401 | 403'],
  ['Reports', 'GET', '/reports/monthly', 'Yes', 'admin, manager', 'Get monthly aggregated report', 'Query: ?year=int&month=int (1-12)', '200: { month: string, days: DailySales[], totalRevenue, totalOrders, bestDay }', '400 | 401 | 403'],
  ['Reports', 'GET', '/reports/popular-items', 'Yes', 'admin, manager', 'Get popular items for a date range', 'Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&limit=int', '200: PopularItem[]', '400 | 401 | 403'],
  ['Reports', 'GET', '/reports/server-stats', 'Yes', 'admin, manager', 'Get per-server performance stats for a date range', 'Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD', '200: ServerStat[]', '401 | 403'],
]

const apiWS = makeSheet(apiRows)
setColWidths(apiWS, [18, 10, 36, 14, 36, 46, 60, 48, 42])

// ─── SHEET 4: STATUS & TRANSITIONS ──────────────────────────────────────────

const statusRows = [
  ['STATUS WORKFLOWS'],
  [],

  ['ORDER STATUS LIFECYCLE'],
  ['Status', 'Triggered By', 'Next Valid Statuses', 'Table Effect', 'Kitchen Effect'],
  ['draft', 'POST /orders', 'sent, cancelled', 'None', 'None'],
  ['sent', 'PATCH /orders/:id/status (waiter sends to kitchen)', 'preparing, cancelled', 'None', 'KitchenTicket created'],
  ['preparing', 'PATCH /orders/:id/status (kitchen marks as started)', 'ready, cancelled', 'None', 'Ticket items set to preparing'],
  ['ready', 'PATCH /orders/:id/status (kitchen marks all items ready)', 'served, cancelled', 'None', 'Ticket items set to ready'],
  ['served', 'PATCH /orders/:id/status (waiter confirms delivery)', 'paid, cancelled', 'None', 'None'],
  ['paid', 'POST /orders/:id/payment (cashier processes payment)', '— (terminal)', 'Table status → cleaning', 'None'],
  ['cancelled', 'PATCH /orders/:id/cancel', '— (terminal)', 'Table status → available (if was occupied)', 'None'],
  [],

  ['TABLE STATUS LIFECYCLE'],
  ['Status', 'Triggered By', 'Next Valid Statuses', 'Description'],
  ['available', 'Initial / after cleaning confirmed', 'occupied, reserved', 'Table is free to seat guests'],
  ['reserved', 'PATCH /tables/:id/status', 'available, occupied', 'Table held for upcoming reservation'],
  ['occupied', 'PATCH /tables/:id/assign (order assigned)', 'cleaning', 'Guests seated; order in progress'],
  ['cleaning', 'Order paid or cancelled / PATCH /tables/:id/release', 'available', 'Table being cleared; not yet ready'],
  [],

  ['KITCHEN ITEM STATUS LIFECYCLE'],
  ['Status', 'Triggered By', 'Description'],
  ['pending', 'KitchenTicket created', 'Item not yet started'],
  ['preparing', 'PATCH /kitchen/tickets/:id/items/:index or bulk action', 'Item actively being prepared'],
  ['ready', 'PATCH /kitchen/tickets/:id/items/:index or PATCH .../ready', 'Item plated and waiting for pickup'],
  [],

  ['PAYMENT STATUS'],
  ['Status', 'Description'],
  ['completed', 'Payment successfully processed'],
  ['refunded', 'Full or partial refund issued via POST /payments/:id/refund'],
  ['pending', 'Payment initiated but not yet confirmed (e.g. card processing)'],
  [],

  ['KITCHEN TICKET PRIORITY'],
  ['Priority', 'Description', 'Visual Indicator'],
  ['normal', 'Standard ticket', 'No highlight'],
  ['high', 'Urgent or overdue ticket', 'Animated pulse border; badge shown'],
  [],
  ['NOTE: A ticket is considered overdue when elapsed time > 15 minutes (900 seconds). Backend should expose elapsed as a computed field or the frontend calculates from createdAt.'],
]

const statusWS = makeSheet(statusRows)
setColWidths(statusWS, [18, 42, 42, 36, 32])

// ─── SHEET 5: AUTH & ERRORS ──────────────────────────────────────────────────

const authRows = [
  ['AUTHENTICATION & ERROR REFERENCE'],
  [],

  ['AUTHENTICATION'],
  ['Item', 'Detail'],
  ['Mechanism', 'JWT (JSON Web Token) — Bearer scheme'],
  ['Header', 'Authorization: Bearer <token>'],
  ['Token Lifetime', 'Access token: 1 hour  |  Refresh token: 7 days (recommended)'],
  ['Session Storage (frontend)', "sessionStorage key 'pos_session_user' — cleared on browser close"],
  ['Login Endpoint', 'POST /api/v1/auth/login'],
  ['Token Refresh', 'POST /api/v1/auth/refresh'],
  [],

  ['ROLE → DEFAULT ROUTE MAP'],
  ['Role', 'Post-Login Redirect', 'Notes'],
  ['admin', '/users', 'Full system access'],
  ['manager', '/reports', 'Cannot manage user accounts'],
  ['waiter', '/orders', 'Cannot access reports or user management'],
  ['kitchen', '/kitchen', 'Kitchen-only view; no order creation'],
  ['cashier', '/payments', 'Payment processing; no kitchen or reports access'],
  [],

  ['HTTP ERROR CODES'],
  ['Code', 'Meaning', 'Common Causes'],
  ['200', 'OK', 'Successful GET or PATCH'],
  ['201', 'Created', 'Successful POST (resource created)'],
  ['204', 'No Content', 'Successful DELETE or logout'],
  ['400', 'Bad Request', 'Missing/invalid fields, invalid status transition, invalid file type'],
  ['401', 'Unauthorized', 'Missing or expired JWT token'],
  ['403', 'Forbidden', 'Authenticated but insufficient role'],
  ['404', 'Not Found', 'Resource with given ID does not exist'],
  ['409', 'Conflict', 'Duplicate (email, table number), item unavailable, order already paid'],
  ['422', 'Unprocessable Entity', 'Semantically invalid request (e.g. negative quantity)'],
  ['500', 'Internal Server Error', 'Unexpected server failure'],
  [],

  ['STANDARD ERROR RESPONSE BODY'],
  ['Field', 'Type', 'Description'],
  ['error', 'string', 'Machine-readable error code (e.g. "INVALID_CREDENTIALS")'],
  ['message', 'string', 'Human-readable description'],
  ['details', 'object | null', 'Optional field-level validation errors (e.g. { email: "already in use" })'],
  [],

  ['STANDARD PAGINATED RESPONSE BODY'],
  ['Field', 'Type', 'Description'],
  ['data', 'T[]', 'Array of resource objects'],
  ['total', 'integer', 'Total records matching the query (before pagination)'],
  ['page', 'integer', 'Current page number (1-based)'],
  ['limit', 'integer', 'Page size used'],
  [],

  ['WEBSOCKET EVENTS (Kitchen Stream)'],
  ['Event Type', 'Payload', 'Description'],
  ['ticket.created', 'KitchenTicket', 'New order sent to kitchen'],
  ['ticket.updated', 'KitchenTicket', 'Item status or priority changed'],
  ['ticket.completed', '{ ticketId: string }', 'All items ready; ticket resolved'],
  [],

  ['NOTES'],
  ['- All timestamps must be ISO 8601 strings in UTC (e.g. 2024-01-15T18:30:00Z)'],
  ['- All monetary values are in USD dollars (number type, 2 decimal places)'],
  ['- All IDs are UUID v4 strings unless noted otherwise'],
  ['- Order IDs may use a human-readable prefix (ORD-XXXX) in addition to UUID for display'],
  ['- The frontend calculates: subtotal, tax (8%), totalWithTax, discountAmount — backend must store raw values and validate totals on payment'],
]

const authWS = makeSheet(authRows)
setColWidths(authWS, [32, 52, 52])

// ─── BUILD WORKBOOK ──────────────────────────────────────────────────────────

const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, overviewWS, 'Overview')
XLSX.utils.book_append_sheet(wb, modelsWS, 'Data Models')
XLSX.utils.book_append_sheet(wb, apiWS, 'API Endpoints')
XLSX.utils.book_append_sheet(wb, statusWS, 'Status Workflows')
XLSX.utils.book_append_sheet(wb, authWS, 'Auth & Errors')

const outPath = 'POS_Backend_API_Spec.xlsx'
XLSX.writeFile(wb, outPath)
console.log(`Written: ${outPath}`)
