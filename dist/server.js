"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const web3_js_1 = require("@solana/web3.js");
const actions_1 = require("@solana/actions");
const config_1 = require("./config");
require("dotenv").config();
const SOL_PUBKEY = "6fQytE8KQZvEVvGnSM6kfWbtVbso8j3GhFQPuZoHZCmD";
const connection = new web3_js_1.Connection(process.env.RPC_URL || (0, web3_js_1.clusterApiUrl)("mainnet-beta"));
const headers = (0, actions_1.createActionHeaders)();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, actions_1.actionCorsMiddleware)({}));
app.get("/blink/actions/payments", (req, res) => {
    try {
        const basehref = new URL(`/blink/actions/payments?to=${SOL_PUBKEY}`, req.protocol + "://" + req.get("host")).toString();
        const payload = {
            title: "100xdevs COHORT 3.0",
            icon: `data:image/png;base64,${config_1.BASE64_IMG}`,
            description: "1. Complete Blockchain + Web Development + Devops Cohort - $100\n" +
                "2. Complete Web3.0 Cohort - $75\n" +
                "3. Complete Web Development + Devops Cohort - $75\n\n" +
                "**IMP:** After you’ve made the payment, please send an email to 100xdevs@gmail.com with the transaction signature. We’ll let you in the course with that email.",
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
        res.set(headers);
        res.json(payload);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "An unknown error occurred" });
    }
});
app.post("/blink/actions/payments", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { account } = req.body;
        const amount = parseFloat(req.query.amount);
        if (!account) {
            return res.status(400).json({ error: 'Invalid "account" provided' });
        }
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: "Invalid or missing amount" });
        }
        const user = new web3_js_1.PublicKey(account);
        const transferSolInstruction = web3_js_1.SystemProgram.transfer({
            fromPubkey: user,
            toPubkey: new web3_js_1.PublicKey(SOL_PUBKEY),
            lamports: amount * web3_js_1.LAMPORTS_PER_SOL,
        });
        const { blockhash, lastValidBlockHeight } = yield connection.getLatestBlockhash();
        const transaction = new web3_js_1.Transaction({
            feePayer: user,
            blockhash,
            lastValidBlockHeight,
        }).add(transferSolInstruction);
        const serializedTransaction = transaction
            .serialize({
            requireAllSignatures: false,
            verifySignatures: false,
        })
            .toString("base64");
        const payload = yield (0, actions_1.createPostResponse)({
            fields: {
                transaction,
                message: `Send ${amount} SOL to ${SOL_PUBKEY}`,
            },
        });
        res.set(headers);
        res.json(payload);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "An unknown error occurred" });
    }
}));
app.options("/blink/actions/payments", (req, res) => {
    res.set(headers);
    res.sendStatus(204);
});
app.get("/actions.json", (req, res) => {
    res.set(headers);
    res.json({
        message: "This is your actions.json response",
    });
});
app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});
