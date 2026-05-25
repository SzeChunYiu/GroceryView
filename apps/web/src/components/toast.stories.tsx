import { Toast, type ToastProps } from './toast';

const meta = {
  title: 'Components/Toast',
  component: Toast,
  args: {
    title: 'Price alert saved',
    message: 'We will notify you when the watched item drops below your target.',
    variant: 'success',
    durationMs: 0
  }
};

export default meta;

export const Success = {
  args: {
    title: 'Price alert saved',
    message: 'We will notify you when the watched item drops below your target.',
    variant: 'success',
    durationMs: 0
  } satisfies ToastProps
};

export const Warning = {
  args: {
    title: 'Receipt upload delayed',
    message: 'The scanner queue is busy. Keep the tab open and retry in a moment.',
    variant: 'warn',
    durationMs: 0
  } satisfies ToastProps
};
