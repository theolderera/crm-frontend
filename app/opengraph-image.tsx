import { ImageResponse } from "next/og";

export const alt = "Student CRM — Системаи идораи донишҷӯён";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #3730a3 0%, #4f46e5 50%, #6d28d9 100%)",
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 108,
            height: 108,
            background: "rgba(255,255,255,0.15)",
            borderRadius: 28,
            marginBottom: 36,
            border: "2px solid rgba(255,255,255,0.25)",
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: "white",
              lineHeight: 1,
            }}
          >
            S
          </div>
        </div>

        <div
          style={{
            fontSize: 76,
            fontWeight: 900,
            color: "white",
            letterSpacing: "-3px",
            marginBottom: 18,
            textAlign: "center",
          }}
        >
          Student CRM
        </div>

        <div
          style={{
            fontSize: 30,
            color: "rgba(255,255,255,0.82)",
            textAlign: "center",
            fontWeight: 400,
          }}
        >
          Системаи идораи донишҷӯён
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: 40,
          }}
        >
          {["Қайди ҳузур", "Идораи гурӯҳҳо", "Менторон"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "8px 20px",
                background: "rgba(255,255,255,0.15)",
                borderRadius: 999,
                fontSize: 18,
                color: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
