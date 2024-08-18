import express from "express";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { createPostResponse, actionCorsMiddleware } from "@solana/actions";
import { BASE64_IMG } from "./config";
require("dotenv").config();

const USDC_PUBKEY = "94A7ExXa9AkdiAnPiCYwJ8SbMuZdAoXnAhGiJqygmFfL";
const connection = new Connection(
  "https://solana-devnet.g.alchemy.com/v2/qlsrTkNGjnuK46GWAC2AVAaVnVZ2ylVf"
);
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

const app = express();

app.use(express.json());
app.use(actionCorsMiddleware({}));

app.get("/blink/actions/payments", (req, res) => {
  try {
    const basehref = `${BASE_URL}/blink/actions/payments?to=${USDC_PUBKEY}`;
    const payload = {
      title: "100xdevs",
      icon: `data:image/png;base64,${BASE64_IMG}`,
      description:
        "1. Complete Blockchain + Web Development + Devops Cohort - $100 2. Complete Web3.0 Cohort - $75 3. Complete Web Development + Devops Cohort - $75  **IMP :After you’ve made the payment, please send an email to 100xdevs@gmail.com with the transaction signature. We’ll let you in the course with that email.",
      actions: [
        {
          label: "100 USDC",
          href: `${basehref}&amount=100`,
        },
        {
          label: "75 USDC",
          href: `${basehref}&amount=75`,
        },
      ],
    };
    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An unknown error occurred" });
  }
});

app.post("/blink/actions/payments", async (req, res) => {
  try {
    const { account } = req.body;
    const amount = parseFloat(req.query.amount as string);

    if (!account) {
      return res.status(400).json({ error: 'Invalid "account" provided' });
    }
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid or missing amount" });
    }

    const user = new PublicKey(account);
    const transferSolInstruction = SystemProgram.transfer({
      fromPubkey: user,
      toPubkey: new PublicKey(USDC_PUBKEY),
      lamports: amount * LAMPORTS_PER_SOL,
    });

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    const transaction = new Transaction({
      feePayer: user,
      blockhash,
      lastValidBlockHeight,
    }).add(transferSolInstruction);

   

    const payload = await createPostResponse({
      fields: {
        transaction,
        message: `Send ${amount} SOL to ${USDC_PUBKEY}`,
      },
    });

    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An unknown error occurred" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
