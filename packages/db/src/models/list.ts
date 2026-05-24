export type ShoppingListInput = {
  userId: string;
  name: string;
};

export type ListItemInput = {
  listId: string;
  productId: string;
  quantity?: number;
  checked?: boolean;
  note?: string | null;
};

type ShoppingListDelegate = {
  create(args: unknown): Promise<unknown>;
  findMany(args: unknown): Promise<unknown>;
};

type ListItemDelegate = {
  create(args: unknown): Promise<unknown>;
  update(args: unknown): Promise<unknown>;
};

export type ShoppingListDb = {
  shoppingList: ShoppingListDelegate;
  listItem: ListItemDelegate;
};

export function createShoppingList(db: ShoppingListDb, input: ShoppingListInput) {
  return db.shoppingList.create({ data: input });
}

export function listShoppingListsForUser(db: ShoppingListDb, userId: string) {
  return db.shoppingList.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: 'desc' }
  });
}

export function addListItem(db: ShoppingListDb, input: ListItemInput) {
  return db.listItem.create({
    data: {
      listId: input.listId,
      productId: input.productId,
      quantity: input.quantity ?? 1,
      checked: input.checked ?? false,
      note: input.note ?? null
    }
  });
}

export function updateListItemChecked(db: ShoppingListDb, id: string, checked: boolean) {
  return db.listItem.update({ where: { id }, data: { checked } });
}
