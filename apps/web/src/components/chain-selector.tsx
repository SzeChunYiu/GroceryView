/**
 * Renders a compact selector for choosing the active grocery chain in comparison and pricing views.
 *
 * @example
 * <ChainSelector chains={chains} value={selectedChainId} onChange={setSelectedChainId} />
 *
 * | Prop | Description |
 * | --- | --- |
 * | `chains` | Available grocery chains shown as selector options. |
 * | `value` | Identifier for the currently selected chain. |
 * | `onChange` | Callback fired with the selected chain identifier when the choice changes. |
 * | `label` | Optional accessible label for the selector. |
 * | `disabled` | Optional flag that disables chain selection. |
 *
 * @param chains Available grocery chains shown as selector options.
 * @param value Identifier for the currently selected chain.
 * @param onChange Callback fired with the selected chain identifier when the choice changes.
 * @param label Optional accessible label for the selector.
 * @param disabled Optional flag that disables chain selection.
 */
export interface Props {
  chains: ReadonlyArray<{
    id: string;
    name: string;
  }>;
  value: string;
  onChange: (chainId: string) => void;
  label?: string;
  disabled?: boolean;
}

export function ChainSelector({ chains, value, onChange, label = "Select chain", disabled = false }: Props) {
  return (
    <label>
      <span>{label}</span>
      <select disabled={disabled} value={value} onChange={(event) => onChange(event.target.value)}>
        {chains.map((chain) => (
          <option key={chain.id} value={chain.id}>
            {chain.name}
          </option>
        ))}
      </select>
    </label>
  );
}
