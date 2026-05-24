import { Tooltip } from './tooltip';

const meta = {
  component: Tooltip,
  title: 'Components/Tooltip'
};

export default meta;

export const HoverTooltip = {
  render: () => (
    <Tooltip content="Shown on hover and focus for the trigger button.">
      <button className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white" type="button">
        Hover me
      </button>
    </Tooltip>
  )
};

export const FocusTooltip = {
  render: () => (
    <Tooltip content="Keyboard users get the same aria-describedby tooltip." side="bottom">
      <a className="font-black text-emerald-800 underline" href="/products">
        Focus the product link
      </a>
    </Tooltip>
  )
};
