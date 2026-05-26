import express from "express";
import httpntlm from "httpntlm";

const app = express();
app.use(express.text({ type: "*/*", limit: "10mb" }));

const {
  EWS_URL,
  EWS_USERNAME,
  EWS_PASSWORD,
  EWS_DOMAIN = "",
  EWS_WORKSTATION = "",
  PROXY_TOKEN,
} = process.env;

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/ews", (req, res) => {
  const token = req.header("x-proxy-token");
  if (!PROXY_TOKEN || token !== PROXY_TOKEN) {
    return res.status(401).send("Unauthorized");
  }

  httpntlm.post(
    {
      url: EWS_URL,
      username: EWS_USERNAME,
      password: EWS_PASSWORD,
      domain: EWS_DOMAIN,
      workstation: EWS_WORKSTATION,
      headers: {
        "Content-Type": 'text/xml; charset="utf-8"',
        Accept: "text/xml",
      },
      body: req.body,
    },
    (err, response) => {
      if (err) {
        console.error("NTLM error:", err);
        return res.status(502).send(`NTLM error: ${err.message || err}`);
      }
      res.status(response.statusCode).type("text/xml").send(response.body);
    },
  );
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`EWS proxy listening on ${port}`));
