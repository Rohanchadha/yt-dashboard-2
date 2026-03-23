export default function SetupPage() {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  const steps = [
    {
      num: 1,
      done: false,
      title: "Create a Google Cloud Project",
      body: (
        <>
          Go to{" "}
          <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">
            console.cloud.google.com
          </a>{" "}
          → New Project → give it any name.
        </>
      ),
    },
    {
      num: 2,
      done: false,
      title: "Enable the YouTube APIs",
      body: (
        <>
          In your project, go to <strong>APIs &amp; Services → Library</strong> and enable:
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>YouTube Data API v3</li>
            <li>YouTube Analytics API</li>
          </ul>
        </>
      ),
    },
    {
      num: 3,
      done: false,
      title: "Create OAuth 2.0 Credentials",
      body: (
        <>
          Go to <strong>APIs &amp; Services → Credentials → Create Credentials → OAuth client ID</strong>.
          <ul className="list-disc ml-5 mt-2 space-y-1">
            <li>Application type: <strong>Web application</strong></li>
            <li>
              Add redirect URI:{" "}
              <code className="bg-gray-800 px-1 rounded text-cyan-400">http://localhost:3000/api/auth/youtube/callback</code>
            </li>
          </ul>
          Copy the <strong>Client ID</strong> and <strong>Client Secret</strong>.
        </>
      ),
    },
    {
      num: 4,
      done: !!(clientId && clientSecret),
      title: "Add credentials to .env.local",
      body: (
        <>
          Create a <code className="bg-gray-800 px-1 rounded text-cyan-400">.env.local</code> file in your project root with:
          <pre className="bg-gray-900 rounded-lg p-4 mt-2 text-sm text-cyan-400 overflow-auto">
{`YOUTUBE_CLIENT_ID=your_client_id_here
YOUTUBE_CLIENT_SECRET=your_client_secret_here`}
          </pre>
          Then restart the dev server.
          {clientId && clientSecret && (
            <p className="mt-2 text-green-400 font-semibold">✓ Client ID and Secret detected!</p>
          )}
        </>
      ),
    },
    {
      num: 5,
      done: !!refreshToken,
      title: "Authorize your YouTube channel",
      body: (
        <>
          {clientId && clientSecret ? (
            <>
              <p className="mb-3">Click below to sign in with Google and authorize access to your channel analytics.</p>
              <a
                href="/api/auth/youtube"
                className="inline-block bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2 rounded-lg transition-colors"
              >
                Connect YouTube Channel →
              </a>
            </>
          ) : (
            <p className="text-yellow-400">Complete step 4 first (add credentials to .env.local and restart).</p>
          )}
          {refreshToken && (
            <p className="mt-3 text-green-400 font-semibold">✓ Refresh token detected — you're all set!</p>
          )}
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8" style={{ background: "var(--bg-page)" }}>
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          Connect Your YouTube Channel
        </h1>
        <p className="mb-8 text-sm" style={{ color: "var(--text-secondary)" }}>
          Follow these steps to link your real channel data to the dashboard.
        </p>

        <div className="flex flex-col gap-4">
          {steps.map((step) => (
            <div
              key={step.num}
              className="card p-5"
              style={{ borderColor: step.done ? "#22c55e44" : "var(--border)" }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
                  style={{
                    background: step.done ? "#22c55e22" : "#ef444422",
                    color: step.done ? "#22c55e" : "#ef4444",
                  }}
                >
                  {step.done ? "✓" : step.num}
                </div>
                <div>
                  <h3 className="font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                    {step.title}
                  </h3>
                  <div className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {step.body}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {refreshToken && (
          <div
            className="mt-6 p-5 rounded-xl text-center"
            style={{ background: "#22c55e22", border: "1px solid #22c55e44" }}
          >
            <p className="text-green-400 font-semibold text-lg mb-2">🎉 All set!</p>
            <a
              href="/"
              className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
            >
              Go to Dashboard →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
