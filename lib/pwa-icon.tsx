import { ImageResponse } from "next/og";

export function pwaIcon(size: number) {
  const radius = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.42);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#08090d",
          borderRadius: size >= 180 ? radius : 0,
        }}
      >
        <div
          style={{
            width: Math.round(size * 0.72),
            height: Math.round(size * 0.72),
            borderRadius: Math.round(size * 0.2),
            background: "#0f766e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#f0fdfa",
            fontSize,
            fontWeight: 700,
            letterSpacing: "-0.06em",
          }}
        >
          T
        </div>
      </div>
    ),
    { width: size, height: size }
  );
}