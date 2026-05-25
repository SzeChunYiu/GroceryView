type BasketActionsProps = {
  label?: string;
  onAdd: () => void;
};

export function BasketActions({ label = 'Add', onAdd }: Readonly<BasketActionsProps>) {
  return (
    <button type="button" onClick={onAdd}>
      {label}
    </button>
  );
}
