// Ticket routes - isolated to minimize changes to core router.js
// Import this in router.js and spread into routes array

const handleMobileView = (componentName) => {
  return window.innerWidth < 768 ? `Mobile${componentName}` : componentName
}

export const ticketRoutes = [
  {
    alias: '/tickets',
    path: '/tickets/view/:viewType?',
    name: 'Tickets',
    component: () => import('@/pages/Tickets.vue'),
  },
  {
    path: '/tickets/:ticketId',
    name: 'Ticket',
    component: () => import(`@/pages/${handleMobileView('Ticket')}.vue`),
    props: true,
  },
]

// Route names that need tab persistence
export const ticketTabRoutes = ['Ticket']

// Route names that need standard view routing
export const ticketViewRoutes = ['Tickets']

// Doctype map entries for tickets
export const ticketDoctypeMap = {
  Tickets: 'HD Ticket',
}
