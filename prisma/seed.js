const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const STORES = ['Магазин 1', 'Магазин 2', 'Магазин 3', 'Магазин 4', 'Магазин 5', 'Коктейл-бар']

const DEFAULT_TASKS = [
  { role: 'CASHIER', shift: 'FIRST', title: 'Проверка на касата в началото на смяната' },
  { role: 'CASHIER', shift: 'FIRST', title: 'Зареждане на касовата лента' },
  { role: 'CASHIER', shift: 'FIRST', title: 'Проверка на наличните монети' },
  { role: 'CASHIER', shift: 'FIRST', title: 'Отчет на дневните продажби' },
  { role: 'CASHIER', shift: 'FIRST', title: 'Попълване на касовата книга' },
  { role: 'CASHIER', shift: 'SECOND', title: 'Приемане на касата от предишната смяна' },
  { role: 'CASHIER', shift: 'SECOND', title: 'Проверка на наличността в касата' },
  { role: 'CASHIER', shift: 'SECOND', title: 'Затваряне на касата в края на смяната' },
  { role: 'CASHIER', shift: 'SECOND', title: 'Финален отчет и предаване' },
  { role: 'WEIGHER', shift: 'FIRST', title: 'Тарировка на везните' },
  { role: 'WEIGHER', shift: 'FIRST', title: 'Проверка на точността на везните' },
  { role: 'WEIGHER', shift: 'FIRST', title: 'Зареждане на хартия за везните' },
  { role: 'WEIGHER', shift: 'FIRST', title: 'Преглед на теглата от деня' },
  { role: 'WEIGHER', shift: 'SECOND', title: 'Почистване на везните' },
  { role: 'WEIGHER', shift: 'SECOND', title: 'Проверка на калибрирането' },
  { role: 'WEIGHER', shift: 'SECOND', title: 'Приключване и отчет на везните' },
  { role: 'WAREHOUSE', shift: 'FIRST', title: 'Приемане на сутрешната доставка' },
  { role: 'WAREHOUSE', shift: 'FIRST', title: 'Проверка и разопаковане на стоката' },
  { role: 'WAREHOUSE', shift: 'FIRST', title: 'Зареждане на стелажите' },
  { role: 'WAREHOUSE', shift: 'FIRST', title: 'Проверка на срока на годност' },
  { role: 'WAREHOUSE', shift: 'FIRST', title: 'Инвентаризация на склада' },
  { role: 'WAREHOUSE', shift: 'SECOND', title: 'Почистване на складовото помещение' },
  { role: 'WAREHOUSE', shift: 'SECOND', title: 'Попълване на стелажите' },
  { role: 'WAREHOUSE', shift: 'SECOND', title: 'Приемане на следобедна доставка' },
  { role: 'WAREHOUSE', shift: 'SECOND', title: 'Отчет за наличностите' },
  { role: 'BAR', shift: 'FIRST', title: 'Проверка на наличностите в бара' },
  { role: 'BAR', shift: 'FIRST', title: 'Подготовка на оборудването' },
  { role: 'BAR', shift: 'FIRST', title: 'Зареждане на хладилниците' },
  { role: 'BAR', shift: 'FIRST', title: 'Проверка на срока на годност на продуктите' },
  { role: 'BAR', shift: 'FIRST', title: 'Отчет на дневните продажби в бара' },
  { role: 'BAR', shift: 'SECOND', title: 'Приемане на бара от предишната смяна' },
  { role: 'BAR', shift: 'SECOND', title: 'Попълване на наличностите' },
  { role: 'BAR', shift: 'SECOND', title: 'Почистване на оборудването' },
  { role: 'BAR', shift: 'SECOND', title: 'Затваряне и финален отчет на бара' },
]

const DEFAULT_PINS = [
  { role: 'CASHIER', pin: '1111' },
  { role: 'WEIGHER', pin: '2222' },
  { role: 'WAREHOUSE', pin: '3333' },
  { role: 'BAR', pin: '4444' },
  { role: 'MANAGER', pin: '9999' },
]

async function seedStore(storeName) {
  const existing = await prisma.store.findFirst({ where: { name: storeName } })
  if (existing) { console.log(`⏭  ${storeName} (вече съществува)`); return }

  const store = await prisma.store.create({ data: { name: storeName } })

  for (const { role, pin } of DEFAULT_PINS) {
    await prisma.rolePin.create({ data: { storeId: store.id, role, pin } })
  }

  for (let i = 0; i < DEFAULT_TASKS.length; i++) {
    const { role, shift, title } = DEFAULT_TASKS[i]
    await prisma.task.create({ data: { storeId: store.id, role, shift, title, order: i } })
  }

  console.log(`✓ ${storeName}`)
}

async function main() {
  console.log('Seeding...')
  for (const storeName of STORES) {
    await seedStore(storeName)
  }
  console.log('Done!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
