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
const USDC_PUBKEY = "94A7ExXa9AkdiAnPiCYwJ8SbMuZdAoXnAhGiJqygmFfL";
const connection = new web3_js_1.Connection("https://solana-devnet.g.alchemy.com/v2/qlsrTkNGjnuK46GWAC2AVAaVnVZ2ylVf");
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, actions_1.actionCorsMiddleware)({}));
app.get("/blink/actions/payments", (req, res) => {
    try {
        const basehref = `${BASE_URL}/blink/actions/payments?to=${USDC_PUBKEY}`;
        const payload = {
            title: "100xdevs",
            icon: `data:image/png;base64,${config_1.BASE64_IMG}`,
            description: "1. Complete Blockchain + Web Development + Devops Cohort - $100 2. Complete Web3.0 Cohort - $75 3. Complete Web Development + Devops Cohort - $75  **IMP :After you’ve made the payment, please send an email to 100xdevs@gmail.com with the transaction signature. We’ll let you in the course with that email.",
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
            toPubkey: new web3_js_1.PublicKey(USDC_PUBKEY),
            lamports: amount * web3_js_1.LAMPORTS_PER_SOL,
        });
        const { blockhash, lastValidBlockHeight } = yield connection.getLatestBlockhash();
        const transaction = new web3_js_1.Transaction({
            feePayer: user,
            blockhash,
            lastValidBlockHeight,
        }).add(transferSolInstruction);
        const payload = yield (0, actions_1.createPostResponse)({
            fields: {
                transaction,
                message: `Send ${amount} SOL to ${USDC_PUBKEY}`,
            },
        });
        res.json(payload);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "An unknown error occurred" });
    }
}));
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
