import { ForwardedRef, forwardRef } from "react";

type QrCodeProps = Readonly<{
  value: string;
  size?: number;
  alt?: string;
  className?: string;
}>;

const QR_SERVICE_URL = "https://api.qrserver.com/v1/create-qr-code/";

export const QrCode = forwardRef(function QrCode(
  { value, size = 220, alt = "Shareable list QR code", className = "" }: QrCodeProps,
  ref: ForwardedRef<HTMLImageElement>
) {
  const imageSize = `${Math.max(120, size)}x${Math.max(120, size)}`;
  const encodedUrl = encodeURIComponent(value);
  const src = `${QR_SERVICE_URL}?size=${imageSize}&data=${encodedUrl}&margin=1`;

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      loading="lazy"
    />
  );
});

QrCode.displayName = "QrCode";
