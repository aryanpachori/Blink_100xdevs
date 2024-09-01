import {
  ActionPostRequest,
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
  PostNextActionLink,
} from "@solana/actions";

import { DEFAULT_SOL_ADDRESS } from "./config";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { NextResponse } from "next/server";

const connection = new Connection(
  process.env.RPC_URL || clusterApiUrl("devnet")
);

export const GET = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);
    const { toPubkey } = validatedQueryParams(requestUrl);
    const basehref = new URL(
      `/api/actions/payments?to=${toPubkey.toBase58()}`,
      requestUrl.origin
    ).toString();

    const payload = {
      title: "100xdevs COHORT 3.0",
      icon: new URL("/logo.png", requestUrl.origin).toString(),
      description: 
      "1. Complete Blockchain + Web Development + DevOps - $100\n" +
      "2. Complete Web3.0 Cohort - $75\n" +
      "3. Complete Web Development + DevOps Cohort - $75\n\n" +
      "✨ Important: After making the payment, please send an email to 100xdevs@gmail.com with your transaction signature. We will use that email to grant you access to the course. 📧",
      links: {
        actions: [
          {
            label: "0.7SOL(100$)",
            href: `${basehref}&amount=0.7`,
          },
          {
            label: "0.5SOL(75$)",
            href: `${basehref}&amount=0.5`,
          },
          {
            label: "0.01SOL",
            href: `${basehref}&amount=0.01`,
          },
        ],
      },
    };

    return new NextResponse(JSON.stringify(payload), {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (err) {
    console.log(err);
    let message = "An unknown error occurred";
    if (typeof err == "string") message = err;
    return new Response(message, {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }
};
export const OPTIONS = GET;

export const POST = async (req: Request) => {
  try {
    const requestUrl = new URL(req.url);
    const body: ActionPostRequest = await req.json();
    const { toPubkey } = validatedQueryParams(requestUrl);
    const amountParam = requestUrl.searchParams.get("amount");
    if (!amountParam) {
      throw new Error("Missing 'amount' parameter");
    }
    const amount = parseFloat(amountParam);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Invalid 'amount' parameter");
    }
    let account: PublicKey;
    try {
      account = new PublicKey(body.account);
    } catch (err) {
      return new Response('Invalid "account" provided', {
        status: 400,
        headers: ACTIONS_CORS_HEADERS,
      });
    }

    const transferSolInstruction = SystemProgram.transfer({
      fromPubkey: account,
      toPubkey: toPubkey,
      lamports: amount * LAMPORTS_PER_SOL,
    });

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    const transaction = new Transaction({
      feePayer: account,
      blockhash,
      lastValidBlockHeight,
    }).add(transferSolInstruction);

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        transaction,
        message:
          "please send an email to 100xdevs@gmail.com with the transaction signature. We’ll let you in the course with that email.",
      },
    });

    return new NextResponse(JSON.stringify(payload), {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (err) {
    console.log(err);
    let message = "An unknown error occurred";
    if (typeof err == "string") message = err;
    return new Response(message, {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }
};

function validatedQueryParams(requestUrl: URL) {
  let toPubkey: PublicKey = DEFAULT_SOL_ADDRESS;

  try {
    if (requestUrl.searchParams.get("to")) {
      toPubkey = new PublicKey(requestUrl.searchParams.get("to")!);
    }
  } catch (err) {
    throw "Invalid input query parameter: to";
  }

  return {
    toPubkey,
  };
}
