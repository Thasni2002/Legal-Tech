export const metadata = {
  title: "404: This page could not be found",
};

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <head>
        <style>{`
          body {
            margin: 0;
            color: #000;
            background: #fff;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          @media (prefers-color-scheme: dark) {
            body {
              color: #fff;
              background: #000;
            }
          }
          .container {
            display: flex;
            align-items: center;
            font-family: inherit;
          }
          .status {
            font-size: 24px;
            font-weight: 500;
            vertical-align: top;
            border-right: 1px solid rgba(0, 0, 0, 0.3);
            margin: 0 20px 0 0;
            padding: 0 23px 0 0;
          }
          @media (prefers-color-scheme: dark) {
            .status {
              border-right: 1px solid rgba(255, 255, 255, 0.3);
            }
          }
          .message {
            font-size: 14px;
            font-weight: 400;
            line-height: 28px;
            margin: 0;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <h1 className="status">404</h1>
          <div style={{ display: 'inline-block' }}>
            <h2 className="message">This page could not be found.</h2>
          </div>
        </div>
      </body>
    </html>
  );
}
