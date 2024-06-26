"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const mongoose_1 = __importDefault(require("mongoose"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const process = __importStar(require("process"));
const app = (0, express_1.default)();
app.listen(5000, () => {
    console.log('listening at port 5000');
});
const urlSchema = new mongoose_1.default.Schema({
    originalUrl: { type: String, required: true },
    customHash: { type: String, required: true, unique: true }
});
const URL = mongoose_1.default.model('URL', urlSchema);
const mongoURI = process.env.MONGODB_URI;
mongoose_1.default.connect(mongoURI)
    .then(() => console.log('connected to the db'))
    .catch((error) => console.error('mongo db connection error:', error));
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)());
function customHash(url) {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        const char = url.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}
//unique hash creater
function generateUniqueHash(url) {
    return __awaiter(this, void 0, void 0, function* () {
        let hash = customHash(url);
        let counter = 0;
        while (yield URL.findOne({ customHash: hash })) {
            counter++;
            hash = customHash(url + counter);
        }
        return hash;
    });
}
app.post('/shorten', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { originalUrl, customHash: userHash } = req.body;
    console.log('request received to shorten the url:', originalUrl);
    try {
        const existingUrl = yield URL.findOne({ originalUrl });
        if (existingUrl) {
            const host = req.get('host');
            const protocol = req.protocol;
            const shortUrl = `${protocol}://${host}/${existingUrl.customHash}`;
            console.log('Original URL exist. Returning shorturl:', shortUrl);
            return res.json({ "shortUrl": shortUrl });
        }
        let Hash = userHash || (yield generateUniqueHash(originalUrl));
        const newURL = new URL({ originalUrl, customHash: Hash });
        newURL.save();
        console.log('saved new url to the databse');
        const host = req.get('host');
        const protocol = req.protocol;
        const shortUrl = `${protocol}://${host}/${Hash}`;
        console.log('returning new short url:', shortUrl);
        return res.json(shortUrl);
    }
    catch (_a) {
        res.status(400).json('custom hash already taken try other');
    }
}));
app.get('/:customHash', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { customHash } = req.params;
    try {
        const url = yield URL.findOne({ customHash });
        if (url) {
            console.log('url found redirecting to original url:', url.originalUrl);
            res.redirect(url.originalUrl);
        }
        res.status(400).json({ error: 'URL Not Found' });
    }
    catch (_b) {
        res.status(500).json({ error: 'server error' });
    }
}));
