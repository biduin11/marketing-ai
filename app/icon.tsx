import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1A1A18",
          borderRadius: 7,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
          <path
            d="M2 11.5 6.5 3l2 5.5L12 6l2 2.5"
            stroke="#F9F8F6"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="6" r="1.4" fill="#F9F8F6" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
